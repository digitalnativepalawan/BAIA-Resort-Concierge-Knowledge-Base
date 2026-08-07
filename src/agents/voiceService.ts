// Voice service abstraction for text-to-speech
// Wraps browser SpeechSynthesis API with a clean interface

export interface VoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
}

export interface SpeakOptions {
  text: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
}

let currentUtterance: SpeechSynthesisUtterance | null = null;

export function getVoices(): VoiceOption[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return [];
  }
  const voices = window.speechSynthesis.getVoices();
  return voices.map((v) => ({
    name: v.name,
    lang: v.lang,
    voiceURI: v.voiceURI,
  }));
}

export function selectBestVoice(
  preferredName?: string,
  langPrefix = 'en'
): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return null;
  }
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Try exact name match first
  if (preferredName) {
    const exact = voices.find((v) => v.name === preferredName);
    if (exact) return exact;
  }

  // Try language prefix match
  const langMatches = voices.filter((v) => v.lang.startsWith(langPrefix));
  if (langMatches.length > 0) return langMatches[0];

  return voices[0] || null;
}

export function speak(options: SpeakOptions): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }

  // Stop any ongoing speech
  stop();

  const utterance = new SpeechSynthesisUtterance(options.text);
  utterance.rate = options.rate ?? 1.0;
  utterance.pitch = options.pitch ?? 1.0;
  utterance.volume = options.volume ?? 1.0;

  const voice = selectBestVoice(options.voiceName);
  if (voice) {
    utterance.voice = voice;
  }

  currentUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}

export function stop(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return false;
  }
  return window.speechSynthesis.speaking;
}
