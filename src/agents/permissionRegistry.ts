import type { AgentPermission, PermissionId } from './types';

const PERMISSIONS: Record<PermissionId, AgentPermission> = {
  'knowledge.read': {
    id: 'knowledge.read',
    name: 'Read Knowledge',
    description: 'Access and search the knowledge base',
    level: 'read',
  },
  'guest_requests.create': {
    id: 'guest_requests.create',
    name: 'Create Guest Requests',
    description: 'Create guest service requests',
    level: 'write',
  },
  'guest_requests.read': {
    id: 'guest_requests.read',
    name: 'Read Guest Requests',
    description: 'View guest service requests',
    level: 'read',
  },
  'guest_requests.update': {
    id: 'guest_requests.update',
    name: 'Update Guest Requests',
    description: 'Update guest service request status',
    level: 'write',
  },
  'conversations.read': {
    id: 'conversations.read',
    name: 'Read Conversations',
    description: 'Access chat session history',
    level: 'read',
  },
  'conversations.reply': {
    id: 'conversations.reply',
    name: 'Reply to Conversations',
    description: 'Send replies in guest conversations',
    level: 'write',
  },
  'settings.read': {
    id: 'settings.read',
    name: 'Read Settings',
    description: 'View system settings',
    level: 'read',
  },
  'settings.update': {
    id: 'settings.update',
    name: 'Update Settings',
    description: 'Modify system settings',
    level: 'admin',
  },
  'agents.read': {
    id: 'agents.read',
    name: 'Read Agents',
    description: 'View agent profiles and configurations',
    level: 'read',
  },
  'agents.update': {
    id: 'agents.update',
    name: 'Update Agents',
    description: 'Modify agent profiles and configurations',
    level: 'admin',
  },
  'system.status.read': {
    id: 'system.status.read',
    name: 'Read System Status',
    description: 'View system health and diagnostics',
    level: 'read',
  },
  'tools.execute': {
    id: 'tools.execute',
    name: 'Execute Tools',
    description: 'Execute external tools and integrations',
    level: 'admin',
  },
};

export function getPermissionById(id: PermissionId): AgentPermission | undefined {
  return PERMISSIONS[id];
}

export function getPermissionsByIds(ids: PermissionId[]): AgentPermission[] {
  return ids.map((id) => PERMISSIONS[id]).filter(Boolean);
}

export function getAllPermissions(): AgentPermission[] {
  return Object.values(PERMISSIONS);
}

export function hasPermission(
  agentPermissions: PermissionId[],
  required: PermissionId
): boolean {
  return agentPermissions.includes(required);
}

export function hasAnyPermission(
  agentPermissions: PermissionId[],
  required: PermissionId[]
): boolean {
  return required.some((p) => agentPermissions.includes(p));
}

export function hasAllPermissions(
  agentPermissions: PermissionId[],
  required: PermissionId[]
): boolean {
  return required.every((p) => agentPermissions.includes(p));
}

export function assertPermission(
  agentPermissions: PermissionId[],
  required: PermissionId
): void {
  if (!hasPermission(agentPermissions, required)) {
    throw new Error(`Missing required permission: ${required}`);
  }
}

export function getPermissionLevelHierarchy(): Record<string, number> {
  return { read: 1, write: 2, admin: 3 };
}

export function validatePermissionIds(ids: string[]): {
  valid: PermissionId[];
  invalid: string[];
} {
  const valid: PermissionId[] = [];
  const invalid: string[] = [];
  for (const id of ids) {
    if (id in PERMISSIONS) {
      valid.push(id as PermissionId);
    } else {
      invalid.push(id);
    }
  }
  return { valid, invalid };
}
