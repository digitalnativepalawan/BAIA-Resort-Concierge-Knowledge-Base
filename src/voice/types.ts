import { ChatMessage, GuestRequest } from '../types';

export type VoiceSessionState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'reconnecting'
  | 'error'
  | 'offline';

export interface PersistentSession {
  sessionId: string;
  conversationId: string;
  guestId?: string;
  guestLabel: string;
  room?: string;
  activeResort: string;
  messages: ChatMessage[];
  lastUserIntent?: string;
  pendingToolActions: any[];
  sessionStartedTime: string;
  lastActivityTime: string;
  connectionState: 'active' | 'reconnecting' | 'idle' | 'ended';
  preferences?: Record<string, any>;
}

export interface NetworkTelemetry {
  status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
  signalQuality: 'excellent' | 'good' | 'degraded' | 'poor' | 'offline' | 'unknown';
  rttMs: number | null;
  packetLossPct: number;
  audioBitrateBps: number;
  lastChecked: string;
}

export interface STTCallbacks {
  onStart?: () => void;
  onSpeechStart?: () => void;
  onInterimResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export interface TTSOptions {
  voiceName?: string;
  pitch?: number;
  rate?: number;
  onStart?: () => void;
  onSentence?: (sentence: string) => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}
