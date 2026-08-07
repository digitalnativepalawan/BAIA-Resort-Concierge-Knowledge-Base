import type {
  AgentProfile,
  AgentChatRequest,
  AgentChatResponse,
  AgentModelConfig,
  KnowledgeCategory,
  SkillId,
  PermissionId,
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
    return agent ? mapToProfile(agent) : null;
  }
  if (agentSlug) {
    const agent = await getAgentBySlug(agentSlug);
    return agent ? mapToProfile(agent) : null;
  }
  return null;
}

// Map a raw PocketBase agent record to an AgentProfile
function mapToProfile(raw: any): AgentProfile {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    role: raw.role || 'assistant',
    description: raw.description || '',
    systemPrompt: raw.system_prompt || '',
    model: {
      provider: 'openrouter',
      modelId: raw.model_id || 'openrouter/hunter-alpha',
      temperature: raw.temperature ?? 0.7,
    },
    voice: {
      enabled: raw.voice_enabled ?? true,
      speed: raw.voice_speed ?? 1.0,
      voiceId: raw.voice_id || undefined,
    },
    knowledge: {
      categories: (raw.knowledge_categories as KnowledgeCategory[]) || [
        'resort_info',
        'facilities',
        'dining',
        'activities',
        'booking',
        'policies',
        'local_area',
        'sustainability',
        'general',
      ],
      maxContextChunks: raw.knowledge_max_chunks ?? 8,
    },
    skills: (raw.skills as SkillId[]) || [],
    permissions: (raw.permissions as PermissionId[]) || [],
    status: raw.status || 'active',
    guestFacing: raw.guest_facing ?? true,
    created: raw.created || new Date().toISOString(),
    updated: raw.updated || new Date().toISOString(),
  };
}

// Validate agent is in a usable state
function validateAgent(agent: AgentProfile): string[] {
  const errors: string[] = [];
  if (agent.status !== 'active') {
    errors.push(`Agent is not active (status: ${agent.status})`);
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

export { resolveAgent, validateAgent, buildSystemPrompt, mapToProfile };
