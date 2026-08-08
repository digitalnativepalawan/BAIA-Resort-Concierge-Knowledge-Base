import { GuestRequest, GuestRequestStatus } from '../types';
import { supabase, isSupabaseConfigured, localCache } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'tala_guest_requests';
const REQUESTS_TABLE = 'guest_requests';

const INITIAL_DEMO_REQUESTS: GuestRequest[] = [
  {
    id: 'req-101',
    title: 'Extra Bath Towels & Pool Robes',
    description: 'Guest requested 4 additional beach towels and 2 robes delivered to Villa 102.',
    category: 'housekeeping',
    guestLabel: 'Sarah Jenkins',
    room: 'Villa 102',
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 35).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'req-102',
    title: 'San Vicente Airport Shuttle Dropoff',
    description: 'Guest scheduled private van transfer to San Vicente Airport tomorrow at 09:30 AM.',
    category: 'transportation',
    guestLabel: 'Marco Rossi',
    room: 'Ocean Suite 04',
    status: 'in_progress',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  },
  {
    id: 'req-103',
    title: 'Floating Breakfast Basket in Pool',
    description: 'Order 2x Tropical Mango Pancakes and Fresh Coconut Smoothie for morning pool delivery.',
    category: 'food',
    guestLabel: 'Elena Vance',
    room: 'Pool Villa 01',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 300).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  },
];

export const requestService = {
  getLocalRequests: (): GuestRequest[] => {
    return localCache.get<GuestRequest[]>(LOCAL_STORAGE_KEY, INITIAL_DEMO_REQUESTS);
  },

  saveLocalRequests: (requests: GuestRequest[]) => {
    localCache.set(LOCAL_STORAGE_KEY, requests);
  },

  saveRequest: async (request: GuestRequest) => {
    const current = requestService.getLocalRequests();
    const updated = [request, ...current.filter((r) => r.id !== request.id)];
    requestService.saveLocalRequests(updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from(REQUESTS_TABLE).insert({
          guest_name: request.guestLabel,
          room_number: request.room,
          request_type: request.category,
          status: request.status,
          notes: `${request.title}: ${request.description}`,
          created_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Supabase save request notice:', e);
      }
    }

    return updated;
  },

  updateRequestStatus: async (requestId: string, status: GuestRequestStatus) => {
    const current = requestService.getLocalRequests();
    const updated = current.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status,
            updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          }
        : r
    );
    requestService.saveLocalRequests(updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from(REQUESTS_TABLE).update({ status }).eq('id', requestId);
      } catch (e) {
        console.warn('Supabase request status update notice:', e);
      }
    }

    return updated;
  },

  deleteRequest: async (requestId: string) => {
    const current = requestService.getLocalRequests();
    const updated = current.filter((r) => r.id !== requestId);
    requestService.saveLocalRequests(updated);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from(REQUESTS_TABLE).delete().eq('id', requestId);
      } catch (e) {
        console.warn('Supabase request delete notice:', e);
      }
    }

    return updated;
  },

  listenRequests: (callback: (requests: GuestRequest[]) => void) => {
    const cached = requestService.getLocalRequests();
    callback(cached);

    if (!isSupabaseConfigured()) {
      return () => {};
    }

    const fetchRequests = async () => {
      const { data, error } = await supabase
        .from(REQUESTS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const remoteRequests: GuestRequest[] = data.map((item) => {
          const notes = item.notes || '';
          const parts = notes.split(': ');
          const title = parts[0] || item.request_type || 'Guest Service Request';
          const description = parts.slice(1).join(': ') || notes || 'Service requested.';

          return {
            id: item.id,
            title,
            description,
            category: (item.request_type as any) || 'housekeeping',
            guestLabel: item.guest_name || 'Guest',
            room: item.room_number || 'Main Villa',
            status: (item.status as GuestRequestStatus) || 'new',
            createdAt: new Date(item.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          };
        });
        requestService.saveLocalRequests(remoteRequests);
        callback(remoteRequests);
      }
    };

    fetchRequests();

    const channel = supabase
      .channel('public:guest_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: REQUESTS_TABLE },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
