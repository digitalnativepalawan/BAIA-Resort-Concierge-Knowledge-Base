import { TalaSettings } from '../types';
import { supabase, isSupabaseConfigured, localCache } from '../lib/supabase';

const SETTINGS_TABLE = 'settings';
const SETTINGS_KEY = 'baia_resort_settings';

export const settingsService = {
  saveSettings: async (settings: TalaSettings): Promise<void> => {
    try {
      const safeSettings = { ...settings };
      delete safeSettings.openrouterApiKey;
      delete safeSettings.customApiKey;

      localCache.set('resort_settings', safeSettings);

      if (isSupabaseConfigured()) {
        const { data } = await supabase
          .from(SETTINGS_TABLE)
          .select('id')
          .eq('key', SETTINGS_KEY)
          .maybeSingle();

        if (data?.id) {
          await supabase
            .from(SETTINGS_TABLE)
            .update({ value: safeSettings })
            .eq('id', data.id);
        } else {
          await supabase
            .from(SETTINGS_TABLE)
            .insert({ key: SETTINGS_KEY, value: safeSettings });
        }
      }
    } catch (err) {
      console.warn('Failed to sync settings with Supabase:', err);
    }
  },

  getSettings: async (): Promise<Partial<TalaSettings> | null> => {
    try {
      if (isSupabaseConfigured()) {
        const { data } = await supabase
          .from(SETTINGS_TABLE)
          .select('value')
          .eq('key', SETTINGS_KEY)
          .maybeSingle();

        if (data?.value) {
          return data.value as Partial<TalaSettings>;
        }
      }
    } catch (e) {
      console.warn('Supabase getSettings fallback to local:', e);
    }
    return localCache.get<Partial<TalaSettings> | null>('resort_settings', null);
  },
};
