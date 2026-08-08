import { cleanTextForSpeech } from '../utils/textUtils';

export interface VoiceOption {
  name: string;
  lang: string;
  gender?: 'female' | 'male' | 'unknown';
  voiceURI: string;
  default?: boolean;
  isNatural?: boolean;
}

export const CLOUD_FEMALE_NEURAL_VOICES: VoiceOption[] = [
  {
    name: 'TALA - Natural Neural Female (US)',
    lang: 'en-US',
    gender: 'female',
    voiceURI: 'cloud-tala-female-us',
    default: true,
    isNatural: true,
  },
  {
    name: 'TALA - Elegant British Female (UK)',
    lang: 'en-GB',
    gender: 'female',
    voiceURI: 'cloud-tala-female-uk',
    default: false,
    isNatural: true,
  },
  {
    name: 'TALA - Warm Resort Female (AU)',
    lang: 'en-AU',
    gender: 'female',
    voiceURI: 'cloud-tala-female-au',
    default: false,
    isNatural: true,
  },
  {
    name: 'TALA - Gentle Asian Accent Female (IN)',
    lang: 'en-IN',
    gender: 'female',
    voiceURI: 'cloud-tala-female-in',
    default: false,
    isNatural: true,
  },
];

const FEMALE_KEYWORDS = [
  'female', 'woman', 'girl', 'jenny', 'aria', 'samantha', 'zira', 'victoria', 
  'karen', 'eva', 'monica', 'serena', 'siri', 'ana', 'clara', 'emma', 'sonia', 
  'ava', 'michelle', 'moira', 'fiona', 'veena', 'susan', 'allison', 'nora', 
  'chloe', 'zoey', 'emily', 'olivia', 'sophia', 'isabella', 'charlotte', 'mia', 
  'amelia', 'harper', 'evelyn', 'abigail', 'ella', 'kyoko', 'yuri', 'sin-ji', 
  'meijia', 'tingting', 'huihui', 'yaoyao', 'kanya', 'laila', 'zhiyu', 'google us english',
  'google uk english female', 'natural', 'neural', 'tala'
];

const MALE_KEYWORDS = [
  'male', 'man', 'boy', 'david', 'mark', 'george', 'guy', 'jason', 'stefan', 
  'paul', 'christopher', 'brian', 'eric', 'andrew', 'james', 'john', 'michael', 
  'robert', 'william', 'richard', 'joseph', 'thomas', 'charles', 'daniel', 
  'matthew', 'anthony', 'donald', 'steven', 'kenneth', 'joshua', 'kevin', 
  'edward', 'ronald', 'timothy', 'jeffrey', 'ryan', 'jacob', 'gary', 'nicholas', 
  'jonathan', 'stephen', 'scott', 'brandon', 'benjamin', 'samuel', 'gregory', 
  'alexander', 'frank', 'patrick', 'raymond', 'jack', 'dennis', 'jerry', 
  'tyler', 'aaron', 'adam', 'nathan', 'henry', 'douglas', 'zachary', 'peter'
];

const NATURAL_KEYWORDS = ['natural', 'online', 'neural', 'wavenet', 'enhanced', 'premium', 'studio', 'deep', 'google', 'tala'];

export function isFemaleVoiceName(name: string): boolean {
  const lowerName = name.toLowerCase();
  const hasFemaleKeyword = FEMALE_KEYWORDS.some((k) => lowerName.includes(k));
  const hasMaleKeyword = MALE_KEYWORDS.some((k) => lowerName.includes(k));
  if (hasFemaleKeyword && !hasMaleKeyword) return true;
  if (hasFemaleKeyword) return true;
  return false;
}

export function isNaturalVoiceName(name: string): boolean {
  const lowerName = name.toLowerCase();
  return NATURAL_KEYWORDS.some((k) => lowerName.includes(k));
}

export function getBestFemaleVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | undefined {
  if (!voices || voices.length === 0) return undefined;

  // 1. Natural female English voice
  const naturalFemaleEn = voices.find(
    (v) => v.lang.startsWith('en') && isNaturalVoiceName(v.name) && isFemaleVoiceName(v.name)
  );
  if (naturalFemaleEn) return naturalFemaleEn;

  // 2. Any female English voice
  const femaleEn = voices.find((v) => v.lang.startsWith('en') && isFemaleVoiceName(v.name));
  if (femaleEn) return femaleEn;

  // 3. Any natural female voice
  const naturalFemaleAny = voices.find((v) => isNaturalVoiceName(v.name) && isFemaleVoiceName(v.name));
  if (naturalFemaleAny) return naturalFemaleAny;

  // 4. Any female voice
  const femaleAny = voices.find((v) => isFemaleVoiceName(v.name));
  if (femaleAny) return femaleAny;

  return voices[0];
}

let currentAudio: HTMLAudioElement | null = null;

function speakWebSpeech(
  cleanedText: string,
  voiceName?: string,
  pitch = 1.0,
  rate = 1.0,
  onEnd?: () => void,
  resolve?: () => void
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    if (resolve) resolve();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanedText);
  utterance.pitch = pitch;
  utterance.rate = rate;

  const voices = window.speechSynthesis.getVoices();
  let selected: SpeechSynthesisVoice | undefined;

  if (voiceName) {
    selected = voices.find((v) => v.name === voiceName || v.voiceURI === voiceName);
  }

  // Only fall back to best female voice if the user's selected voice was not found
  if (!selected) {
    selected = getBestFemaleVoice(voices) || voices[0];
  }

  if (selected) {
    utterance.voice = selected;
  }

  utterance.onend = () => {
    if (onEnd) onEnd();
    if (resolve) resolve();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error:', e);
    if (onEnd) onEnd();
    if (resolve) resolve();
  };

  window.speechSynthesis.speak(utterance);
}

export interface VoiceSelectionDiagnostic {
  timestamp: string;
  requestedVoice: string;
  resolvedVoiceType: 'cloud' | 'webspeech';
  activeAudioPlaying: boolean;
  webSpeechSpeaking: boolean;
  webSpeechPending: boolean;
  queueStatus: 'cleared' | 'valid';
  context?: string;
}

const diagnosticLogs: VoiceSelectionDiagnostic[] = [];

export function logAndValidateVoiceSelection(
  voiceName: string,
  context: string = 'voice-selection'
): VoiceSelectionDiagnostic {
  const now = new Date().toISOString();

  let webSpeechSpeaking = false;
  let webSpeechPending = false;

  // 1. Validate & purge WebSpeech synthesis queue
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    webSpeechSpeaking = window.speechSynthesis.speaking;
    webSpeechPending = window.speechSynthesis.pending;

    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('[SPEECH DIAGNOSTIC] Queue purge error:', e);
    }
  }

  // 2. Halt & cleanup any active HTMLAudio element
  let activeAudioPlaying = false;
  if (currentAudio) {
    activeAudioPlaying = true;
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch (e) {}
    currentAudio = null;
  }

  // 3. Resolve target voice type
  const isCloud =
    !voiceName ||
    voiceName.startsWith('cloud-') ||
    voiceName.startsWith('TALA -') ||
    CLOUD_FEMALE_NEURAL_VOICES.some((cv) => cv.name === voiceName || cv.voiceURI === voiceName);

  const diagnostic: VoiceSelectionDiagnostic = {
    timestamp: now,
    requestedVoice: voiceName,
    resolvedVoiceType: isCloud ? 'cloud' : 'webspeech',
    activeAudioPlaying,
    webSpeechSpeaking,
    webSpeechPending,
    queueStatus: 'cleared',
    context,
  };

  diagnosticLogs.push(diagnostic);
  if (diagnosticLogs.length > 50) diagnosticLogs.shift();

  console.log(`[SPEECH ENGINE DIAGNOSTIC] [${context}] Target: "${voiceName}" | Type: ${diagnostic.resolvedVoiceType} | Queue Cleared`, diagnostic);

  return diagnostic;
}

export const speechEngine = {
  logAndValidateVoiceSelection,

  getDiagnosticLogs: (): VoiceSelectionDiagnostic[] => [...diagnosticLogs],

  getAvailableVoices: (): VoiceOption[] => {
    const localVoices: VoiceOption[] = [];
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      voices.forEach((v) => {
        const isFemale = isFemaleVoiceName(v.name);
        const isNatural = isNaturalVoiceName(v.name);
        localVoices.push({
          name: v.name,
          lang: v.lang,
          gender: isFemale ? 'female' : 'male',
          voiceURI: v.voiceURI,
          default: v.default,
          isNatural,
        });
      });
    }

    // Combine Cloud Neural Female voices first, followed by local voices
    return [...CLOUD_FEMALE_NEURAL_VOICES, ...localVoices];
  },

  speakText: (
    text: string,
    voiceName?: string,
    pitch = 1.0,
    rate = 1.0,
    onEnd?: () => void
  ): Promise<void> => {
    return new Promise((resolve) => {
      // Validate queue and log selection event
      logAndValidateVoiceSelection(voiceName || 'default', 'speakText');

      const cleanedText = cleanTextForSpeech(text);
      if (!cleanedText.trim()) {
        if (onEnd) onEnd();
        resolve();
        return;
      }

      // Check if target is a Cloud Neural Female Voice or empty (default to Cloud Neural)
      const isCloudVoice =
        !voiceName ||
        voiceName.startsWith('cloud-') ||
        voiceName.startsWith('TALA -') ||
        CLOUD_FEMALE_NEURAL_VOICES.some((cv) => cv.name === voiceName || cv.voiceURI === voiceName);

      if (isCloudVoice) {
        const targetCloudVoice = voiceName || 'TALA - Natural Neural Female (US)';
        const audioUrl = `/api/tts?text=${encodeURIComponent(cleanedText.slice(0, 300))}&voice=${encodeURIComponent(targetCloudVoice)}`;
        const audio = new Audio(audioUrl);
        currentAudio = audio;

        audio.onended = () => {
          currentAudio = null;
          if (onEnd) onEnd();
          resolve();
        };

        audio.onerror = (err) => {
          console.warn('[CLOUD TTS ERROR, FALLING BACK TO WEBSPEECH]', err);
          currentAudio = null;
          speakWebSpeech(cleanedText, voiceName, pitch, rate, onEnd, resolve);
        };

        audio.play().catch((err) => {
          console.warn('[CLOUD AUDIO PLAY ERROR, FALLING BACK TO WEBSPEECH]', err);
          currentAudio = null;
          speakWebSpeech(cleanedText, voiceName, pitch, rate, onEnd, resolve);
        });

        return;
      }

      // WebSpeech fallback route
      speakWebSpeech(cleanedText, voiceName, pitch, rate, onEnd, resolve);
    });
  },

  stopSpeech: (): void => {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
    }
  },
};


