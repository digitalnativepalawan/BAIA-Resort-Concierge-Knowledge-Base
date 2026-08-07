import { pb } from '../lib/pocketbase';

export interface Agent {
  id: string;
  name: string;
  slug: string;
  role: string;
  description: string;
  system_prompt: string;
  model_id: string;
  temperature: number;
  voice_enabled: boolean;
  voice_language: string;
  voice_gender: string;
  voice_name: string;
  voice_pitch: number;
  voice_rate: number;
  knowledge_enabled: boolean;
  knowledge_categories: string[];
  skills: any[];
  permissions: string[];
  status: 'online' | 'offline' | 'maintenance';
  guest_facing: boolean;
}

function pbRecordToAgent(record: any): Agent {
  return {
    id: record.id,
    name: record.name || '',
    slug: record.slug || '',
    role: record.role || '',
    description: record.description || '',
    system_prompt: record.system_prompt || '',
    model_id: record.model_id || 'openrouter/free',
    temperature: record.temperature || 0.7,
    voice_enabled: record.voice_enabled ?? true,
    voice_language: record.voice_language || 'en-US',
    voice_gender: record.voice_gender || 'female',
    voice_name: record.voice_name || '',
    voice_pitch: record.voice_pitch || 1.05,
    voice_rate: record.voice_rate || 1.05,
    knowledge_enabled: record.knowledge_enabled ?? true,
    knowledge_categories: record.knowledge_categories || [],
    skills: record.skills || [],
    permissions: record.permissions || [],
    status: record.status || 'online',
    guest_facing: record.guest_facing ?? true
  };
}

export const agentService = {
  getAgents: async (): Promise<Agent[]> => {
    try {
      const records = await pb.collection('agents').getFullList({
        sort: '-created'
      });
      return records.map(pbRecordToAgent);
    } catch (err) {
      console.warn('PocketBase: Failed to get agents:', err);
      return [];
    }
  },

  getAgent: async (id: string): Promise<Agent | null> => {
    try {
      const record = await pb.collection('agents').getOne(id);
      return pbRecordToAgent(record);
    } catch (err) {
      console.warn('PocketBase: Failed to get agent:', err);
      return null;
    }
  },

  getDefaultGuestAgent: async (): Promise<Agent | null> => {
    try {
      const record = await pb.collection('agents').getFirstListItem('slug="tala-concierge"');
      return pbRecordToAgent(record);
    } catch (err) {
      console.warn('PocketBase: Failed to get default guest agent:', err);
      return null;
    }
  },

  createAgent: async (agent: Partial<Agent>): Promise<Agent | null> => {
    try {
      const record = await pb.collection('agents').create({
        name: agent.name || 'New Agent',
        slug: agent.slug || `agent-${Date.now()}`,
        role: agent.role || '',
        description: agent.description || '',
        system_prompt: agent.system_prompt || '',
        model_id: agent.model_id || 'openrouter/free',
        temperature: agent.temperature || 0.7,
        voice_enabled: agent.voice_enabled ?? true,
        voice_language: agent.voice_language || 'en-US',
        voice_gender: agent.voice_gender || 'female',
        voice_name: agent.voice_name || '',
        voice_pitch: agent.voice_pitch || 1.05,
        voice_rate: agent.voice_rate || 1.05,
        knowledge_enabled: agent.knowledge_enabled ?? true,
        knowledge_categories: agent.knowledge_categories || [],
        skills: agent.skills || [],
        permissions: agent.permissions || [],
        status: agent.status || 'online',
        guest_facing: agent.guest_facing ?? false
      });
      return pbRecordToAgent(record);
    } catch (err) {
      console.warn('PocketBase: Failed to create agent:', err);
      return null;
    }
  },

  updateAgent: async (id: string, updates: Partial<Agent>): Promise<Agent | null> => {
    try {
      const record = await pb.collection('agents').update(id, updates);
      return pbRecordToAgent(record);
    } catch (err) {
      console.warn('PocketBase: Failed to update agent:', err);
      return null;
    }
  },

  setAgentStatus: async (id: string, status: Agent['status']): Promise<boolean> => {
    try {
      await pb.collection('agents').update(id, { status });
      return true;
    } catch (err) {
      console.warn('PocketBase: Failed to set agent status:', err);
      return false;
    }
  }
};
