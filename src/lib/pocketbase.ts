import PocketBase from 'pocketbase';

const pocketbaseUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_POCKETBASE_URL) ||
  'http://127.0.0.1:8090';

export const pb = new PocketBase(pocketbaseUrl);

// Disable auto cancellation to allow concurrent requests
pb.autoCancellation(false);
