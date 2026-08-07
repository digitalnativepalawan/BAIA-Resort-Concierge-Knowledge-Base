import type {
  AgentProfile,
  AgentChatRequest,
  AgentChatResponse,
  KnowledgeCategory,
  SkillId,
  PermissionId,
  AgentStatus,
} from './types';
import {
  getAgentBySlug,
  getAgent,
} from '../services/agentService';

// Resolve an agent from request (by ID or slug)
async function resolveAgent(
  agentId?: string,
  agentSlug?: string
): Promise<AgentProfile | null> {
  if (agentId) {
    const agent = await getAgent(agentId);
    return agent ? pocketBaseAgentToProfile(agent) : null;
  }
  if (agentSlug) {
    const agent = await getAgentBySlug(agentSlug);
    return agent ? pocketBaseAgentToProfile(agent) : null;
  }
  return null;
}

// Map a raw PocketBase agent record to an AgentProfile
export function pocketBaseAgentToProfile(raw: any): AgentProfile {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    role: raw.role || 'assistant',
    description: raw.description || '',
    systemPrompt: raw.system_prompt || '',
    model: {
      provider: 'openrouter',
      modelId: raw.model_id || 'openrouter/free',
      temperature: raw.temperature ?? 0.7,
    },
    voice: {
      enabled: raw.voice_enabled ?? true,
      language: raw.voice_language || 'en-US',
      genderPreference: raw.voice_gender || undefined,
      selectedVoiceName: raw.voice_name || undefined,
      pitch: raw.voice_pitch ?? 1.0,
      rate: raw.voice_rate ?? 1.0,
    },
    knowledge: {
      enabled: raw.knowledge_enabled ?? true,
      categories: (raw.knowledge_categories as KnowledgeCategory[]) || [
        'Property', 'Rooms', 'Food & Breakfast', 'Transportation',
        'Activities', 'San Vicente', 'Policies', 'Emergency', 'Other',
      ],
    },
    skills: (raw.skills as SkillId[]) || [],
    permissions: (raw.permissions as PermissionId[]) || [],
    status: (raw.status as AgentStatus) || 'online',
    guestFacing: raw.guest_facing ?? true,
    created: raw.created || new Date().toISOString(),
    updated: raw.updated || new Date().toISOString(),
  };
}

// Map an AgentProfile back to PocketBase record shape (snake_case)
export function agentProfileToPocketBase(profile: Partial<AgentProfile>): Record<string, any> {
  const record: Record<string, any> = {};
  if (profile.name !== undefined) record.name = profile.name;
  if (profile.slug !== undefined) record.slug = profile.slug;
  if (profile.role !== undefined) record.role = profile.role;
  if (profile.description !== undefined) record.description = profile.description;
  if (profile.systemPrompt !== undefined) record.system_prompt = profile.systemPrompt;
  if (profile.model !== undefined) {
    record.model_id = profile.model.modelId;
    record.temperature = profile.model.temperature;
  }
  if (profile.voice !== undefined) {
    record.voice_enabled = profile.voice.enabled;
    record.voice_language = profile.voice.language;
    record.voice_gender = profile.voice.genderPreference;
    record.voice_name = profile.voice.selectedVoiceName;
    record.voice_pitch = profile.voice.pitch;
    record.voice_rate = profile.voice.rate;
  }
  if (profile.knowledge !== undefined) {
    record.knowledge_enabled = profile.knowledge.enabled;
    record.knowledge_categories = profile.knowledge.categories;
  }
  if (profile.skills !== undefined) record.skills = profile.skills;
  if (profile.permissions !== undefined) record.permissions = profile.permissions;
  if (profile.status !== undefined) record.status = profile.status;
  if (profile.guestFacing !== undefined) record.guest_facing = profile.guestFacing;
  return record;
}

// Validate agent is in a usable state
function validateAgent(agent: AgentProfile): string[] {
  const errors: string[] = [];
  if (agent.status !== 'online') {
    errors.push(`Agent is not online (status: ${agent.status})`);
  }
  if (!agent.systemPrompt || agent.systemPrompt.trim().length === 0) {
    errors.push('Agent has no system prompt configured');
  }
  if (!agent.model?.modelId) {
    errors.push('Agent has no model configured');
  }
  return errors;
}

// Build a system prompt incorporating agent persona and knowledge categories
function buildSystemPrompt(
  agent: AgentProfile,
  knowledgeCategories: KnowledgeCategory[]
): string {
  const parts: string[] = [];

  parts.push(`You are ${agent.name}, ${agent.role}.`);
  if (agent.description) {
    parts.push(agent.description);
  }
  parts.push(agent.systemPrompt);

  if (knowledgeCategories.length > 0) {
    parts.push(
      `You have access to knowledge about: ${knowledgeCategories.join(', ')}.`
    );
  }

  return parts.join('\n\n');
}

// Call the OpenRouter API through the existing /api/chat backend
async function callChatBackend(
  agent: AgentProfile,
  sessionId: string,
  message: string,
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:3002';

  const payload = {
    message,
    sessionId,
    agentSlug: agent.slug,
    agentId: agent.id,
    ...(history && history.length > 0 ? { history } : {}),
  };

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Chat backend returned ${response.status}: ${errorBody}`
    );
  }

  const data = await response.json();
  return data.reply || data.message || 'No response received.';
}

// Main runtime entry point
export async function chat(
  request: AgentChatRequest
): Promise<AgentChatResponse> {
  const agent = await resolveAgent(request.agentId, request.agentSlug);
  if (!agent) {
    throw new Error('Agent not found');
  }

  const validationErrors = validateAgent(agent);
  if (validationErrors.length > 0) {
    throw new Error(`Agent validation failed: ${validationErrors.join('; ')}`);
  }

  const reply = await callChatBackend(
    agent,
    request.sessionId,
    request.message,
    request.history
  );

  return {
    reply,
    agentId: agent.id,
    sessionId: request.sessionId,
  };
}

export { resolveAgent, validateAgent, buildSystemPrompt };
