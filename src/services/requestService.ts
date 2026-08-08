import { GuestRequest, GuestRequestStatus } from '../types';
import { pb } from '../lib/pocketbase';

const LOCAL_STORAGE_KEY = 'tala_guest_requests';
const REQUESTS_COLLECTION = 'guest_requests';

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

  saveRequest: async (request: GuestRequest) => {
    const current = requestService.getLocalRequests();
    const updated = [request, ...current.filter((r) => r.id !== request.id)];
    requestService.saveLocalRequests(updated);

    try {
      await pb.collection(REQUESTS_COLLECTION).create({
        title: request.title,
        description: request.description,
        category: request.category,
        guest_label: request.guestLabel,
        room: request.room,
        status: request.status
      });
    } catch (e) {
      console.warn('PocketBase save request notice:', e);
    }

    return updated;
  },

  updateRequestStatus: async (requestId: string, status: GuestRequestStatus) => {
    const current = requestService.getLocalRequests();
    const updated = current.map((r) =>
      r.id === requestId ? { ...r, status, updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } : r
    );
    requestService.saveLocalRequests(updated);

    try {
      await pb.collection(REQUESTS_COLLECTION).update(requestId, { status });
    } catch (e) {
      console.warn('PocketBase request status update notice:', e);
    }

    return updated;
  },

  deleteRequest: async (requestId: string) => {
    const current = requestService.getLocalRequests();
    const updated = current.filter((r) => r.id !== requestId);
    requestService.saveLocalRequests(updated);

    try {
      await pb.collection(REQUESTS_COLLECTION).delete(requestId);
    } catch (e) {
      console.warn('PocketBase request delete notice:', e);
    }

    return updated;
  },

  listenRequests: (callback: (requests: GuestRequest[]) => void) => {
    try {
      pb.collection(REQUESTS_COLLECTION)
        .getList(1, 50, { sort: '-created' })
        .then((res) => {
          if (res.items.length > 0) {
            const remoteRequests: GuestRequest[] = res.items.map((item) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              category: item.category,
              guestLabel: item.guest_label || 'Guest',
              room: item.room || 'Main Villa',
              status: item.status || 'new',
              createdAt: new Date(item.created).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
            }));
            requestService.saveLocalRequests(remoteRequests);
            callback(remoteRequests);
          }
        })
        .catch(() => {});

      let unsubscribeFn: (() => void) | null = null;
      pb.collection(REQUESTS_COLLECTION)
        .subscribe('*', () => {
          pb.collection(REQUESTS_COLLECTION)
            .getList(1, 50, { sort: '-created' })
            .then((res) => {
              const remoteRequests: GuestRequest[] = res.items.map((item) => ({
                id: item.id,
                title: item.title,
                description: item.description,
                category: item.category,
                guestLabel: item.guest_label || 'Guest',
                room: item.room || 'Main Villa',
                status: item.status || 'new',
                createdAt: new Date(item.created).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
              }));
              requestService.saveLocalRequests(remoteRequests);
              callback(remoteRequests);
            })
            .catch(() => {});
        })
        .then((unsub) => {
          unsubscribeFn = unsub;
        })
        .catch(() => {});

      return () => {
        if (unsubscribeFn) unsubscribeFn();
        pb.collection(REQUESTS_COLLECTION).unsubscribe('*').catch(() => {});
      };
    } catch (e) {
      return () => {};
    }
  }
};
