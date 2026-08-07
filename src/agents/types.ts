// Agent model configuration (which LLM backend)
export interface AgentModelConfig {
  provider: 'openrouter';
  modelId: string;
  temperature: number;
}

// Voice profile for TTS (browser SpeechSynthesis)
export interface AgentVoiceProfile {
  enabled: boolean;
  language: string;
  genderPreference?: 'female' | 'male' | 'neutral';
  accent?: string;
  selectedVoiceName?: string;
  pitch?: number;
  rate?: number;
  autoSpeak?: boolean;
}

// Knowledge scope - must match PocketBase knowledge_documents collection exactly
export type KnowledgeCategory =
  | 'Property'
  | 'Rooms'
  | 'Food & Breakfast'
  | 'Transportation'
  | 'Activities'
  | 'San Vicente'
  | 'Policies'
  | 'Emergency'
  | 'Other';

export interface AgentKnowledgeConfig {
  enabled: boolean;
  categories: KnowledgeCategory[];
}

// Predefined skill identifiers (dot notation)
export type SkillId =
  | 'knowledge.search'
  | 'guest_request.create'
  | 'conversation.reply'
  | 'system.status';

export interface AgentSkill {
  id: SkillId;
  name: string;
  description: string;
  permissions: PermissionId[];
}

// Predefined permission identifiers (dot notation)
export type PermissionId =
  | 'knowledge.read'
  | 'guest_requests.create'
  | 'guest_requests.read'
  | 'guest_requests.update'
  | 'conversations.read'
  | 'conversations.reply'
  | 'settings.read'
  | 'settings.update'
  | 'agents.read'
  | 'agents.update'
  | 'system.status.read'
  | 'tools.execute';

export interface AgentPermission {
  id: PermissionId;
  name: string;
  description: string;
  level: 'read' | 'write' | 'admin';
}

// Core agent runtime status - canonical values only
export type AgentStatus = 'online' | 'offline' | 'disabled';

// What we expose to the frontend and runtime
export interface AgentProfile {
  id: string;
  slug: string;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  model: AgentModelConfig;
  voice: AgentVoiceProfile;
  knowledge: AgentKnowledgeConfig;
  skills: SkillId[];
  permissions: PermissionId[];
  status: AgentStatus;
  guestFacing: boolean;
  created: string;
  updated: string;
}

// Runtime request shape
export interface AgentChatRequest {
  agentId?: string;
  agentSlug?: string;
  sessionId: string;
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

// Runtime response shape
export interface AgentChatResponse {
  reply: string;
  agentId: string;
  sessionId: string;
}

// Activity log entry for agents
export interface AgentActivity {
  id: string;
  agentId: string;
  type: 'chat' | 'config_change' | 'status_change';
  message: string;
  timestamp: string;
}

// Validation error shape
export interface AgentValidationError {
  field: string;
  message: string;
}
