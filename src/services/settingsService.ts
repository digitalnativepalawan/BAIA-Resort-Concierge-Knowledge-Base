import { TalaSettings } from '../types';
import { saveUserSettings, getUserSettings } from '../lib/firebase';

export const settingsService = {
  saveSettings: async (userId: string, settings: TalaSettings) => {
    return saveUserSettings(userId, settings);
  },
  getSettings: async (userId: string): Promise<Partial<TalaSettings> | null> => {
    return getUserSettings(userId);
  }
};
