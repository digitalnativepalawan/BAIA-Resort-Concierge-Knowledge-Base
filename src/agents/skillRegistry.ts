import type { AgentSkill, SkillId, PermissionId } from './types';

const SKILLS: Record<SkillId, AgentSkill> = {
  'knowledge.search': {
    id: 'knowledge.search',
    name: 'Knowledge Search',
    description: 'Search and retrieve information from the knowledge base',
    permissions: ['knowledge.read'],
  },
  'guest_request.create': {
    id: 'guest_request.create',
    name: 'Guest Request Create',
    description: 'Create guest service requests',
    permissions: ['guest_requests.create'],
  },
  'conversation.reply': {
    id: 'conversation.reply',
    name: 'Conversation Reply',
    description: 'Reply to guest conversations',
    permissions: ['conversations.reply'],
  },
  'system.status': {
    id: 'system.status',
    name: 'System Status',
    description: 'Check system health and operational status',
    permissions: ['system.status.read'],
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
