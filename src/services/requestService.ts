import { GuestRequest, GuestRequestStatus } from '../types';
import { pb } from '../lib/pocketbase';

function pbRecordToRequest(record: any): GuestRequest {
  return {
    id: record.id,
    title: record.title || '',
    description: record.description || '',
    category: record.category || 'general',
    guestLabel: record.guest_label || 'Guest',
    room: record.room || 'Main Villa',
    status: record.status || 'new',
    createdAt: new Date(record.created).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };
}

export const requestService = {
  getLocalRequests: (): GuestRequest[] => {
    // No longer using localStorage - PocketBase is source of truth
    return [];
  },

  saveRequest: async (request: Omit<GuestRequest, 'id' | 'createdAt'>): Promise<GuestRequest | null> => {
    try {
      const record = await pb.collection('guest_requests').create({
        title: request.title,
        description: request.description,
        category: request.category,
        guest_label: request.guestLabel || 'Guest',
        room: request.room || 'Main Villa',
        status: request.status || 'new'
      });
      return pbRecordToRequest(record);
    } catch (err) {
      console.warn('PocketBase: Failed to save request:', err);
      return null;
    }
  },

  updateRequestStatus: async (requestId: string, status: GuestRequestStatus): Promise<boolean> => {
    try {
      await pb.collection('guest_requests').update(requestId, { status });
      return true;
    } catch (err) {
      console.warn('PocketBase: Failed to update request status:', err);
      return false;
    }
  },

  deleteRequest: async (requestId: string): Promise<boolean> => {
    try {
      await pb.collection('guest_requests').delete(requestId);
      return true;
    } catch (err) {
      console.warn('PocketBase: Failed to delete request:', err);
      return false;
    }
  },

  getAllRequests: async (): Promise<GuestRequest[]> => {
    try {
      const records = await pb.collection('guest_requests').getFullList({
        sort: '-created'
      });
      return records.map(pbRecordToRequest);
    } catch (err) {
      console.warn('PocketBase: Failed to get requests:', err);
      return [];
    }
  },

  listenRequests: (callback: (requests: GuestRequest[]) => void) => {
    let active = true;

    const load = async () => {
      if (!active) return;
      try {
        const records = await pb.collection('guest_requests').getFullList({
          sort: '-created'
        });
        if (!active) return;
        const requests = records.map(pbRecordToRequest);
        callback(requests);
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
