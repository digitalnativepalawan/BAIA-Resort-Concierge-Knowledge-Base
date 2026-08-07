import { TalaSettings } from '../types';
import { pb } from '../lib/pocketbase';

const SETTINGS_COLLECTION = 'settings';
const SETTINGS_RECORD_ID_KEY = 'tala_settings_record_id';

function getSettingsRecordId(): string | null {
  try {
    return localStorage.getItem(SETTINGS_RECORD_ID_KEY);
  } catch {
    return null;
  }
}

function setSettingsRecordId(id: string) {
  try {
    localStorage.setItem(SETTINGS_RECORD_ID_KEY, id);
  } catch {}
}

export const settingsService = {
  saveSettings: async (userId: string, settings: TalaSettings) => {
    try {
      // Strip secrets before saving
      const safeSettings = { ...settings };
      delete safeSettings.openrouterApiKey;
      delete safeSettings.customApiKey;

      const recordId = getSettingsRecordId();
      const data = {
        resort_name: 'BAIA Resort San Vicente',
        default_model: settings.selectedOpenRouterModel || 'openrouter/free',
        system_prompt: settings.systemInstruction,
        voice_profile: {
          pitch: settings.pitch,
          rate: settings.rate,
          selectedVoiceName: settings.selectedVoiceName
        },
        temperature: 0.7,
        auto_speak: settings.autoSpeak,
        continuous_listening: settings.continuousListening,
        sound_enabled: settings.soundEnabled
      };

      if (recordId) {
        try {
          await pb.collection(SETTINGS_COLLECTION).update(recordId, data);
        } catch (err) {
          // Record might have been deleted, create new one
          const record = await pb.collection(SETTINGS_COLLECTION).create(data);
          setSettingsRecordId(record.id);
        }
      } else {
        try {
          // Try to get existing settings record
          const records = await pb.collection(SETTINGS_COLLECTION).getFullList({ limit: 1 });
          if (records.length > 0) {
            await pb.collection(SETTINGS_COLLECTION).update(records[0].id, data);
            setSettingsRecordId(records[0].id);
          } else {
            const record = await pb.collection(SETTINGS_COLLECTION).create(data);
            setSettingsRecordId(record.id);
          }
        } catch (err) {
          console.warn('PocketBase: Failed to save settings:', err);
        }
      }
    } catch (err) {
      console.warn('PocketBase: saveSettings error:', err);
    }
  },

  getSettings: async (userId: string): Promise<Partial<TalaSettings> | null> => {
    try {
      const records = await pb.collection(SETTINGS_COLLECTION).getFullList({ limit: 1 });
      if (records.length === 0) return null;

      const record = records[0];
      setSettingsRecordId(record.id);

      const voiceProfile = record.voice_profile || {};
      return {
        pitch: voiceProfile.pitch || 1.05,
        rate: voiceProfile.rate || 1.05,
        selectedVoiceName: voiceProfile.selectedVoiceName || '',
        selectedOpenRouterModel: record.default_model || 'openrouter/free',
        systemInstruction: record.system_prompt || '',
        autoSpeak: record.auto_speak ?? true,
        soundEnabled: record.sound_enabled ?? true,
        continuousListening: record.continuous_listening ?? false,
        useHybridNeural: true
      };
    } catch (err) {
      console.warn('PocketBase: Failed to get settings:', err);
      return null;
    }
  }
};
