export type TalaState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

export interface OpenRouterPricing {
  prompt: string | number;
  completion: string | number;
  request?: string | number;
  image?: string | number;
}

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: OpenRouterPricing;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
  supported_parameters?: string[];
  is_free: boolean;
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
  isNatural?: boolean;
}

export interface TalaSettings {
  pitch: number;
  rate: number;
  volume?: number;
  selectedVoiceName: string;
  openrouterApiKey: string;
  selectedOpenRouterModel: string;
  customApiKey?: string; // Backwards compatibility alias
  ollamaHost?: string; // Local machine Ollama endpoint (default http://localhost:11434)
  systemInstruction: string;
  autoSpeak: boolean;
  soundEnabled: boolean;
  continuousListening: boolean;
  useHybridNeural: boolean;
}

export type KnowledgeCategory = 
  | 'Property'
  | 'Rooms'
  | 'Amenities'
  | 'Food & Breakfast'
  | 'House Rules'
  | 'Check-in & Checkout'
  | 'Transportation'
  | 'Tours & Activities'
  | 'Local Area'
  | 'Housekeeping'
  | 'Maintenance'
  | 'Policies'
  | 'Emergency Information'
  | 'Other';

export type KnowledgeProcessingStatus = 
  | 'Selected'
  | 'Uploading'
  | 'Parsing'
  | 'Classifying'
  | 'Chunking'
  | 'Embedding'
  | 'Ready'
  | 'Needs Review'
  | 'Error';

export interface KnowledgeFile {
  id: string;
  name: string;
  size: number;
  content: string;
  type: string;
  fileType?: string; // 'PDF' | 'TXT' | 'MD' | 'JSON' | 'DOCX' | 'CSV'
  uploadedAt: string;
  lastUpdated?: string;
  category?: KnowledgeCategory;
  description?: string;
  status?: KnowledgeProcessingStatus;
  chunkCount?: number;
  embeddingStatus?: string;
  embeddingProvider?: string;
  errorMessage?: string;
  chunks?: string[];
}

export type GuestRequestCategory = 
  | 'housekeeping'
  | 'transportation'
  | 'food'
  | 'maintenance'
  | 'activity'
  | 'general';

export type GuestRequestStatus = 
  | 'new'
  | 'in_progress'
  | 'needs_staff'
  | 'completed';

export interface GuestRequest {
  id: string;
  title: string;
  description: string;
  category: GuestRequestCategory;
  guestLabel?: string;
  room?: string;
  status: GuestRequestStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationSession {
  id: string;
  guestLabel: string;
  room?: string;
  lastMessage: string;
  lastTimestamp: string;
  status: 'active' | 'needs_staff' | 'closed';
  messageCount: number;
  messages: ChatMessage[];
}

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  photoURL?: string;
}

