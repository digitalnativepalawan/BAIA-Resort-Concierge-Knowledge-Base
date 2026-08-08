import { cleanTextForSpeech } from '../utils/textUtils';

export interface VoiceOption {
  name: string;
  lang: string;
  gender?: 'female' | 'male' | 'unknown';
  voiceURI: string;
}

export const speechEngine = {
  getAvailableVoices: (): VoiceOption[] => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
    const voices = window.speechSynthesis.getVoices();
    return voices.map((v) => {
      const isFemaleName = /(samantha|zira|victoria|karen|jenny|aria|eva|monica|serena|siri|female|natural)/i.test(
        v.name
      );
      return {
        name: v.name,
        lang: v.lang,
        gender: isFemaleName ? 'female' : 'male',
        voiceURI: v.voiceURI,
      };
    });
  },

  speakText: (
    text: string,
    voiceName?: string,
    pitch = 1.0,
    rate = 1.0,
    onEnd?: () => void
  ): Promise<void> => {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        if (onEnd) onEnd();
        resolve();
        return;
      }

      window.speechSynthesis.cancel(); // Stop any active speech

      const cleanedText = cleanTextForSpeech(text);
      if (!cleanedText.trim()) {
        if (onEnd) onEnd();
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.pitch = pitch;
      utterance.rate = rate;

      if (voiceName) {
        const voices = window.speechSynthesis.getVoices();
        const selected = voices.find((v) => v.name === voiceName || v.voiceURI === voiceName);
        if (selected) {
          utterance.voice = selected;
        }
      }

      utterance.onend = () => {
        if (onEnd) onEnd();
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        if (onEnd) onEnd();
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  },

  stopSpeech: (): void => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },
};
