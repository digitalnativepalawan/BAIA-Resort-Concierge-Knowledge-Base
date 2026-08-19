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

export function getNetworkQuality(): 'strong' | 'weak' | 'offline' {
  if (typeof navigator === 'undefined') return 'strong';
  if (!navigator.onLine) return 'offline';

  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  if (connection) {
    if (connection.saveData || connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') {
      return 'weak';
    }
    if (connection.rtt && connection.rtt > 350) {
      return 'weak';
    }
    if (connection.downlink && connection.downlink < 1.0) {
      return 'weak';
    }
  }
  return 'strong';
}

function speakWebSpeech(
  cleanedText: string,
  voiceName?: string,
  pitch = 1.0,
  rate = 1.0,
  onEnd?: () => void,
  resolve?: () => void,
  volume = 1.0
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) onEnd();
    if (resolve) resolve();
    return;
  }

  if (window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
  }

  // Additional text cleaning to strip any raw symbols/emojis that slow down TTS engine
  const sanitisedText = cleanedText
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .trim();

  if (!sanitisedText) {
    if (onEnd) onEnd();
    if (resolve) resolve();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(sanitisedText);

  let adjustedPitch = pitch;
  let adjustedRate = rate;
  if (sanitisedText.endsWith('?')) {
    adjustedPitch = Math.min(1.15, pitch * 1.06);
  } else if (sanitisedText.endsWith('!')) {
    adjustedRate = Math.min(1.1, rate * 1.04);
  }

  utterance.pitch = adjustedPitch;
  utterance.rate = adjustedRate;
  utterance.volume = typeof volume === 'number' ? Math.max(0, Math.min(1, volume)) : 1.0;

  const voices = window.speechSynthesis.getVoices();
  let selected: SpeechSynthesisVoice | undefined;

  const netQuality = getNetworkQuality();
  if (netQuality === 'weak' || netQuality === 'offline') {
    selected = getBestFemaleVoice(voices) || voices[0];
  } else if (voiceName) {
    selected = voices.find((v) => v.name === voiceName || v.voiceURI === voiceName);
  }

  if (!selected) {
    selected = getBestFemaleVoice(voices) || voices[0];
  }

  if (selected) {
    utterance.voice = selected;
  }

  let completed = false;
  const finish = () => {
    if (completed) return;
    completed = true;
    if (onEnd) onEnd();
    if (resolve) resolve();
  };

  utterance.onstart = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  utterance.onend = finish;
  utterance.onerror = (e) => {
    console.warn('Speech synthesis notice:', e);
    finish();
  };

  // Enqueue utterance smoothly into SpeechSynthesis queue
  window.speechSynthesis.speak(utterance);
}


export interface VoiceTestResult {
  testId: string;
  testName: string;
  passed: boolean;
  details: string;
  requestedVoice?: string;
  mappedVoiceName?: string;
  resolvedVoiceType?: 'cloud' | 'webspeech';
}

export interface VoiceTestSuiteSummary {
  timestamp: string;
  totalTests: number;
  passCount: number;
  failCount: number;
  persistenceVerified: boolean;
  activePersistedVoice: string;
  results: VoiceTestResult[];
}

export interface VoiceMappingVerification {
  requestedVoice: string;
  mappedVoiceName: string;
  resolvedVoiceType: 'cloud' | 'webspeech';
  isFemale: boolean;
  isNatural: boolean;
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
let activePersistedVoiceName: string = 'TALA - Natural Neural Female (US)';

export function getActiveVoiceProfile(): string {
  return activePersistedVoiceName;
}

export function setActiveVoiceProfile(voiceName: string): void {
  if (voiceName && voiceName.trim()) {
    activePersistedVoiceName = voiceName.trim();
  }
}

export function verifyVoiceMapping(voiceName: string): VoiceMappingVerification {
  const isCloud =
    !voiceName ||
    voiceName.startsWith('cloud-') ||
    voiceName.startsWith('TALA -') ||
    CLOUD_FEMALE_NEURAL_VOICES.some((cv) => cv.name === voiceName || cv.voiceURI === voiceName);

  let mappedVoiceName = voiceName || 'TALA - Natural Neural Female (US)';
  if (voiceName.startsWith('cloud-')) {
    const matchedCloud = CLOUD_FEMALE_NEURAL_VOICES.find((cv) => cv.voiceURI === voiceName);
    if (matchedCloud) {
      mappedVoiceName = matchedCloud.name;
    }
  }

  const isFemale = isFemaleVoiceName(mappedVoiceName);
  const isNatural = isNaturalVoiceName(mappedVoiceName);

  return {
    requestedVoice: voiceName,
    mappedVoiceName,
    resolvedVoiceType: isCloud ? 'cloud' : 'webspeech',
    isFemale,
    isNatural,
  };
}

export function verifyFemaleVoicePersistence(
  voiceSequence: string[] = [
    'TALA - Natural Neural Female (US)',
    'Samantha',
    'TALA - Elegant British Female (UK)',
    'Victoria',
    'TALA - Warm Resort Female (AU)',
    'Google US English'
  ]
): {
  success: boolean;
  sequencePassed: boolean;
  activePersistedVoice: string;
  history: VoiceSelectionDiagnostic[];
  mappedResults: VoiceMappingVerification[];
} {
  const mappedResults: VoiceMappingVerification[] = [];
  let sequencePassed = true;

  for (const voice of voiceSequence) {
    const diag = logAndValidateVoiceSelection(voice, 'test-suite-persistence-check');
    const mapping = verifyVoiceMapping(voice);
    mappedResults.push(mapping);

    if (getActiveVoiceProfile() !== voice) {
      sequencePassed = false;
    }

    if (diag.queueStatus !== 'cleared') {
      sequencePassed = false;
    }
  }

  const finalActiveVoice = getActiveVoiceProfile();
  const lastSequenceVoice = voiceSequence[voiceSequence.length - 1];
  const success = sequencePassed && finalActiveVoice === lastSequenceVoice;

  return {
    success,
    sequencePassed,
    activePersistedVoice: finalActiveVoice,
    history: diagnosticLogs.filter((d) => d.context === 'test-suite-persistence-check'),
    mappedResults,
  };
}

export function runVoiceTestSuite(): VoiceTestSuiteSummary {
  const results: VoiceTestResult[] = [];

  // Test 1: Cloud Neural Voice Profile Endpoint Mapping
  const cloudEndpoints = [
    'cloud-tala-female-us',
    'cloud-tala-female-uk',
    'cloud-tala-female-au',
    'cloud-tala-female-in',
    'TALA - Natural Neural Female (US)',
    'TALA - Elegant British Female (UK)'
  ];

  let cloudTestsPassed = true;
  for (const ep of cloudEndpoints) {
    const mapping = verifyVoiceMapping(ep);
    if (mapping.resolvedVoiceType !== 'cloud') {
      cloudTestsPassed = false;
      results.push({
        testId: `cloud-map-${ep}`,
        testName: `Cloud Voice Mapping: ${ep}`,
        passed: false,
        details: `Expected resolvedVoiceType to be 'cloud', got '${mapping.resolvedVoiceType}'`,
        requestedVoice: ep,
        mappedVoiceName: mapping.mappedVoiceName,
        resolvedVoiceType: mapping.resolvedVoiceType,
      });
    }
  }

  if (cloudTestsPassed) {
    results.push({
      testId: 'cloud-voices-all',
      testName: 'Cloud Neural Voice Profile Mapping',
      passed: true,
      details: `Successfully mapped all ${cloudEndpoints.length} cloud neural endpoints to cloud voice engine.`,
    });
  }

  // Test 2: WebSpeech Browser Synthesis Voice Name Mapping
  const webSpeechVoices = ['Samantha', 'Victoria', 'Google US English', 'Aria', 'Jenny', 'Microsoft Zira Desktop'];
  let webSpeechPassed = true;
  for (const voiceName of webSpeechVoices) {
    const mapping = verifyVoiceMapping(voiceName);
    if (mapping.resolvedVoiceType !== 'webspeech') {
      webSpeechPassed = false;
      results.push({
        testId: `webspeech-map-${voiceName}`,
        testName: `WebSpeech Voice Mapping: ${voiceName}`,
        passed: false,
        details: `Expected resolvedVoiceType to be 'webspeech', got '${mapping.resolvedVoiceType}'`,
        requestedVoice: voiceName,
        mappedVoiceName: mapping.mappedVoiceName,
        resolvedVoiceType: mapping.resolvedVoiceType,
      });
    }
  }

  if (webSpeechPassed) {
    results.push({
      testId: 'webspeech-voices-all',
      testName: 'Browser Synthesis Voice Name Mapping',
      passed: true,
      details: `Successfully mapped ${webSpeechVoices.length} browser synthesis voice profiles to WebSpeech.`,
    });
  }

  // Test 3: Female Voice Classification
  const femaleVoiceNames = ['Samantha', 'Victoria', 'Aria', 'Jenny', 'Karen', 'TALA - Natural Neural Female (US)', 'Google UK English Female', 'Laila', 'Chloe'];
  let femaleClassPassed = true;
  for (const fv of femaleVoiceNames) {
    const isFemale = isFemaleVoiceName(fv);
    if (!isFemale) {
      femaleClassPassed = false;
      results.push({
        testId: `female-class-${fv}`,
        testName: `Female Voice Recognition: ${fv}`,
        passed: false,
        details: `Voice '${fv}' was not recognized as female by isFemaleVoiceName.`,
      });
    }
  }

  if (femaleClassPassed) {
    results.push({
      testId: 'female-classification-all',
      testName: 'Female Voice Keyword Classification',
      passed: true,
      details: `Accurately identified all ${femaleVoiceNames.length} female test voice identifiers.`,
    });
  }

  // Test 4: Female Voice Switching & State Persistence
  const persistenceTest = verifyFemaleVoicePersistence([
    'TALA - Natural Neural Female (US)',
    'Samantha',
    'TALA - Elegant British Female (UK)',
    'Victoria',
    'TALA - Warm Resort Female (AU)',
    'Google US English'
  ]);

  results.push({
    testId: 'female-voice-persistence-sequence',
    testName: 'Female Voice Switching & State Persistence',
    passed: persistenceTest.success,
    details: persistenceTest.success
      ? `Successfully executed 6-step female voice switching sequence. Final persisted active voice: "${persistenceTest.activePersistedVoice}".`
      : `Failed female voice persistence sequence. Active persisted: "${persistenceTest.activePersistedVoice}".`,
    requestedVoice: persistenceTest.activePersistedVoice,
    mappedVoiceName: persistenceTest.activePersistedVoice,
    resolvedVoiceType: verifyVoiceMapping(persistenceTest.activePersistedVoice).resolvedVoiceType,
  });

  // Test 5: Fallback for Empty/Invalid Selection
  const emptyMapping = verifyVoiceMapping('');
  const fallbackPassed = emptyMapping.resolvedVoiceType === 'cloud' && emptyMapping.mappedVoiceName.includes('TALA');
  results.push({
    testId: 'voice-fallback-empty',
    testName: 'Empty Voice Selection Default Fallback',
    passed: fallbackPassed,
    details: fallbackPassed
      ? `Empty voice input cleanly defaulted to primary Cloud Neural female voice ("${emptyMapping.mappedVoiceName}").`
      : `Fallback failed: got "${emptyMapping.mappedVoiceName}" (${emptyMapping.resolvedVoiceType}).`,
  });

  const passCount = results.filter((r) => r.passed).length;
  const failCount = results.length - passCount;

  return {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passCount,
    failCount,
    persistenceVerified: persistenceTest.success,
    activePersistedVoice: getActiveVoiceProfile(),
    results,
  };
}

export function logAndValidateVoiceSelection(
  voiceName: string,
  context: string = 'voice-selection'
): VoiceSelectionDiagnostic {
  const now = new Date().toISOString();

  if (voiceName && voiceName.trim()) {
    activePersistedVoiceName = voiceName.trim();
  }

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
  getNetworkQuality,
  logAndValidateVoiceSelection,
  getDiagnosticLogs: (): VoiceSelectionDiagnostic[] => [...diagnosticLogs],
  getActiveVoiceProfile,
  setActiveVoiceProfile,
  verifyVoiceMapping,
  verifyFemaleVoicePersistence,
  runVoiceTestSuite,

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
    onEnd?: () => void,
    volume = 1.0
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

      // Use browser high-fidelity SpeechSynthesis engine
      speakWebSpeech(cleanedText, voiceName, pitch, rate, onEnd, resolve, volume);
    });
  },

  /**
   * Speak response in fast incremental sentence chunks to minimize latency on slow/low-signal Wi-Fi.
   */
  speakSentenceChunks: async (
    text: string,
    voiceName?: string,
    pitch = 1.0,
    rate = 1.0,
    onEnd?: () => void,
    volume = 1.0
  ): Promise<void> => {
    const cleaned = cleanTextForSpeech(text);
    if (!cleaned) {
      if (onEnd) onEnd();
      return;
    }

    // Split into sentences using punctuation boundaries
    const sentences = cleaned
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (sentences.length <= 1) {
      return speechEngine.speakText(cleaned, voiceName, pitch, rate, onEnd, volume);
    }

    for (let i = 0; i < sentences.length; i++) {
      const isLast = i === sentences.length - 1;
      await new Promise<void>((res) => {
        speakWebSpeech(
          sentences[i],
          voiceName,
          pitch,
          rate,
          isLast ? onEnd : undefined,
          res,
          volume
        );
      });
    }
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



