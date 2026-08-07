export type TalaState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

export type ApiProvider = 'openrouter' | 'google';

export interface ModelOption {
  id: string;
  name: string;
  tier: 'free' | 'paid' | 'ultra-fast';
  provider: ApiProvider;
  description?: string;
}

export interface TelemetryLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'listening' | 'processing' | 'speaking' | 'error' | 'success' | 'system';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface VoiceOption {
  name: string;
  lang: string;
  default: boolean;
  voiceURI: string;
  gender: 'female' | 'male' | 'unknown';
}

export interface TalaSettings {
  pitch: number;
  rate: number;
  selectedVoiceName: string;
  apiProvider: ApiProvider;
  openrouterApiKey: string;
  googleApiKey: string;
  selectedOpenRouterModel: string;
  selectedGoogleModel: string;
  customApiKey?: string; // Backwards compatibility alias
  systemInstruction: string;
  autoSpeak: boolean;
  soundEnabled: boolean;
  continuousListening: boolean;
  useHybridNeural: boolean;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  size: number;
  content: string;
  type: string;
  uploadedAt: string;
}
