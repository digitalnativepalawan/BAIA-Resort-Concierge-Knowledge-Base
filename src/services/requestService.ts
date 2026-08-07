import { GuestRequest, GuestRequestStatus } from '../types';
import { pb } from '../lib/pocketbase';

const LOCAL_STORAGE_KEY = 'tala_guest_requests';

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
  }
];

export const requestService = {
  getLocalRequests: (): GuestRequest[] => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_REQUESTS));
      return INITIAL_DEMO_REQUESTS;
    } catch (e) {
      return INITIAL_DEMO_REQUESTS;
    }
  },

  saveLocalRequests: (requests: GuestRequest[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(requests));
    } catch (e) {
      console.warn('Failed to save requests to localStorage', e);
    }
  },

  saveRequest: async (userId: string | null, request: GuestRequest) => {
    const current = requestService.getLocalRequests();
    const updated = [request, ...current.filter((r) => r.id !== request.id)];
    requestService.saveLocalRequests(updated);

    try {
      await pb.collection('guest_requests').create({
        title: request.title,
        description: request.description,
        category: request.category,
        guest_label: request.guestLabel || 'Guest',
        room: request.room || 'Main Villa',
        status: request.status
      });
    } catch (err) {
      console.warn('PocketBase: Failed to save request:', err);
    }

    return updated;
  },

  updateRequestStatus: async (userId: string | null, requestId: string, status: GuestRequestStatus) => {
    const current = requestService.getLocalRequests();
    const updated = current.map((r) =>
      r.id === requestId ? { ...r, status, updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } : r
    );
    requestService.saveLocalRequests(updated);

    try {
      await pb.collection('guest_requests').update(requestId, { status });
    } catch (err) {
      console.warn('PocketBase: Failed to update request status:', err);
    }

    return updated;
  },

  deleteRequest: async (userId: string | null, requestId: string) => {
    const current = requestService.getLocalRequests();
    const updated = current.filter((r) => r.id !== requestId);
    requestService.saveLocalRequests(updated);

    try {
      await pb.collection('guest_requests').delete(requestId);
    } catch (err) {
      console.warn('PocketBase: Failed to delete request:', err);
    }

    return updated;
  },

  listenRequests: (userId: string, callback: (requests: GuestRequest[]) => void) => {
    let active = true;

    const load = async () => {
      if (!active) return;
      try {
        const records = await pb.collection('guest_requests').getFullList({
          sort: '-created'
        });
        if (!active) return;

        const requests: GuestRequest[] = records.map((r: any) => ({
          id: r.id,
          title: r.title || '',
          description: r.description || '',
          category: r.category || 'general',
          guestLabel: r.guest_label || 'Guest',
          room: r.room || 'Main Villa',
          status: r.status || 'new',
          createdAt: new Date(r.created).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }));

        if (requests.length > 0) {
          requestService.saveLocalRequests(requests);
          callback(requests);
        }
      } catch (err) {
        console.warn('PocketBase: listenRequests load failed:', err);
      }
    };

    load();

    const setupSubscription = async () => {
      try {
        await pb.collection('guest_requests').subscribe('*', (event: any) => {
          if (active) load();
        });
      } catch (err) {
        console.warn('PocketBase: listenRequests subscription failed:', err);
      }
    };

    setupSubscription();

    return () => {
      active = false;
      pb.collection('guest_requests').unsubscribe('*');
    };
  }
};
