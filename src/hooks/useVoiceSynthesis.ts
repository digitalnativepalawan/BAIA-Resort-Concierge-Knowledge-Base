import { useState, useCallback, useEffect } from 'react';
import { speechEngine, VoiceOption } from '../lib/speechEngine';

export function useVoiceSynthesis(selectedVoiceName?: string) {
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  useEffect(() => {
    const updateVoices = () => {
      setVoices(speechEngine.getAvailableVoices());
    };
    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const speak = useCallback(
    async (text: string, pitch = 1.0, rate = 1.0) => {
      setIsSpeaking(true);
      await speechEngine.speakText(text, selectedVoiceName, pitch, rate, () => {
        setIsSpeaking(false);
      });
    },
    [selectedVoiceName]
  );

  const stop = useCallback(() => {
    speechEngine.stopSpeech();
    setIsSpeaking(false);
  }, []);

  return {
    voices,
    isSpeaking,
    speak,
    stop,
  };
}
