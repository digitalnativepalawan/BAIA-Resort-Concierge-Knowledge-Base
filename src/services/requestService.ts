import { GuestRequest, GuestRequestStatus } from '../types';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'tala_guest_requests';

// Initial sample request data for resort demonstration if empty
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
      // Save initial demo requests on first load
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

    if (userId) {
      try {
        const path = `users/${userId}/guest_requests/${request.id}`;
        await setDoc(doc(db, path), request);
      } catch (err) {
        console.warn('Firestore request sync failed:', err);
      }
    }
    return updated;
  },

  updateRequestStatus: async (userId: string | null, requestId: string, status: GuestRequestStatus) => {
    const current = requestService.getLocalRequests();
    const updated = current.map((r) =>
      r.id === requestId ? { ...r, status, updatedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } : r
    );
    requestService.saveLocalRequests(updated);

    if (userId) {
      try {
        const reqToUpdate = updated.find((r) => r.id === requestId);
        if (reqToUpdate) {
          const path = `users/${userId}/guest_requests/${requestId}`;
          await setDoc(doc(db, path), reqToUpdate);
        }
      } catch (err) {
        console.warn('Firestore request status update failed:', err);
      }
    }
    return updated;
  },

  deleteRequest: async (userId: string | null, requestId: string) => {
    const current = requestService.getLocalRequests();
    const updated = current.filter((r) => r.id !== requestId);
    requestService.saveLocalRequests(updated);

    if (userId) {
      try {
        const path = `users/${userId}/guest_requests/${requestId}`;
        await deleteDoc(doc(db, path));
      } catch (err) {
        console.warn('Firestore request delete failed:', err);
      }
    }
    return updated;
  },

  listenRequests: (userId: string, callback: (requests: GuestRequest[]) => void) => {
    try {
      const colPath = `users/${userId}/guest_requests`;
      return onSnapshot(
        collection(db, colPath),
        (snapshot) => {
          const remoteRequests: GuestRequest[] = [];
          snapshot.forEach((docSnap) => {
            remoteRequests.push(docSnap.data() as GuestRequest);
          });
          if (remoteRequests.length > 0) {
            remoteRequests.sort((a, b) => b.id.localeCompare(a.id));
            requestService.saveLocalRequests(remoteRequests);
            callback(remoteRequests);
          }
        },
        (err) => {
          console.warn('Firestore listenRequests error:', err);
        }
      );
    } catch (e) {
      return () => {};
    }
  }
};
