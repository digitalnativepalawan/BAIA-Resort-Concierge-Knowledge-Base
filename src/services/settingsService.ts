import { TalaSettings } from '../types';
import { pb } from '../lib/pocketbase';

const SETTINGS_COLLECTION = 'settings';

export const settingsService = {
  saveSettings: async (settings: TalaSettings): Promise<void> => {
    try {
      // Exclude secrets before saving
      const safeSettings = { ...settings };
      delete safeSettings.openrouterApiKey;
      delete safeSettings.customApiKey;

      if (pb.authStore.isValid) {
        // Find existing resort settings record or create one
        try {
          const records = await pb.collection(SETTINGS_COLLECTION).getList(1, 1);
          if (records.items.length > 0) {
            await pb.collection(SETTINGS_COLLECTION).update(records.items[0].id, {
              value: safeSettings
            });
          } else {
            await pb.collection(SETTINGS_COLLECTION).create({
              key: 'baia_resort_settings',
              value: safeSettings
            });
          }
        } catch (e) {
          console.warn('PocketBase settings save error:', e);
        }
      }
    } catch (err) {
      console.warn('Failed to sync settings with PocketBase:', err);
    }
  },

  getSettings: async (): Promise<Partial<TalaSettings> | null> => {
    try {
      if (pb.authStore.isValid) {
        const records = await pb.collection(SETTINGS_COLLECTION).getList(1, 1);
        if (records.items.length > 0 && records.items[0].value) {
          return records.items[0].value as Partial<TalaSettings>;
        }
      }
    } catch (e) {
      console.warn('PocketBase getSettings fallback to local:', e);
    }
    return null;
  }
};
