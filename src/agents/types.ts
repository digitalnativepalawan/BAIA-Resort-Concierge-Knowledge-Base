// Agent model configuration (which LLM backend)
export interface AgentModelConfig {
  provider: 'openrouter';
  modelId: string;
  temperature: number;
  maxTokens?: number;
}

// Voice profile for TTS
export interface AgentVoiceProfile {
  voiceId?: string;          // e.g. OpenAI voice name
  speed: number;             // 0.25 – 4.0
  enabled: boolean;
}

// Knowledge scope for retrieval
export type KnowledgeCategory =
  | 'resort_info'
  | 'facilities'
  | 'dining'
  | 'activities'
  | 'booking'
  | 'policies'
  | 'local_area'
  | 'sustainability'
  | 'general';

export interface AgentKnowledgeConfig {
  categories: KnowledgeCategory[];
  embeddingModel?: string;
  maxContextChunks: number;
}

// Predefined skill identifiers
export type SkillId =
  | 'knowledge_search'
  | 'reservation_management'
  | 'conversation_management'
  | 'system_status';

export interface AgentSkill {
  id: SkillId;
  name: string;
  description: string;
  permissions: PermissionId[];
}

// Predefined permission identifiers
export type PermissionId =
  | 'read_knowledge'
  | 'write_knowledge'
  | 'manage_reservations'
  | 'view_guest_data'
  | 'manage_guest_data'
  | 'manage_conversations'
  | 'access_system'
  | 'manage_agents'
  | 'view_analytics'
  | 'export_data'
  | 'manage_settings'
  | 'manage_users';

export interface AgentPermission {
  id: PermissionId;
  name: string;
  description: string;
  level: 'read' | 'write' | 'admin';
}

// Core agent runtime status
export type AgentStatus = 'active' | 'inactive' | 'maintenance';

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
