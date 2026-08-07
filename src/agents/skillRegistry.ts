import type { AgentSkill, SkillId, PermissionId } from './types';

const SKILLS: Record<SkillId, AgentSkill> = {
  knowledge_search: {
    id: 'knowledge_search',
    name: 'Knowledge Search',
    description: 'Search and retrieve information from the knowledge base',
    permissions: ['read_knowledge'],
  },
  reservation_management: {
    id: 'reservation_management',
    name: 'Reservation Management',
    description: 'Create, view, and manage guest reservations',
    permissions: ['manage_reservations', 'view_guest_data'],
  },
  conversation_management: {
    id: 'conversation_management',
    name: 'Conversation Management',
    description: 'Manage chat sessions and message history',
    permissions: ['manage_conversations', 'view_guest_data'],
  },
  system_status: {
    id: 'system_status',
    name: 'System Status',
    description: 'Check system health and operational status',
    permissions: ['access_system'],
  },
};

export function getSkillById(id: SkillId): AgentSkill | undefined {
  return SKILLS[id];
}

export function getSkillsByIds(ids: SkillId[]): AgentSkill[] {
  return ids.map((id) => SKILLS[id]).filter(Boolean);
}

export function getAllSkills(): AgentSkill[] {
  return Object.values(SKILLS);
}

export function getSkillPermissions(skillIds: SkillId[]): PermissionId[] {
  const perms = new Set<PermissionId>();
  for (const id of skillIds) {
    const skill = SKILLS[id];
    if (skill) {
      for (const p of skill.permissions) {
        perms.add(p);
      }
    }
  }
  return Array.from(perms);
}

export function validateSkillIds(ids: string[]): {
  valid: SkillId[];
  invalid: string[];
} {
  const valid: SkillId[] = [];
  const invalid: string[] = [];
  for (const id of ids) {
    if (id in SKILLS) {
      valid.push(id as SkillId);
    } else {
      invalid.push(id);
    }
  }
  return { valid, invalid };
}
