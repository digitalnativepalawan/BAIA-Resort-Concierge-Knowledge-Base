import type { AgentPermission, PermissionId } from './types';

const PERMISSIONS: Record<PermissionId, AgentPermission> = {
  read_knowledge: {
    id: 'read_knowledge',
    name: 'Read Knowledge',
    description: 'Access and search the knowledge base',
    level: 'read',
  },
  write_knowledge: {
    id: 'write_knowledge',
    name: 'Write Knowledge',
    description: 'Create and modify knowledge base entries',
    level: 'write',
  },
  manage_reservations: {
    id: 'manage_reservations',
    name: 'Manage Reservations',
    description: 'Create, update, and cancel reservations',
    level: 'write',
  },
  view_guest_data: {
    id: 'view_guest_data',
    name: 'View Guest Data',
    description: 'Access guest profile and booking information',
    level: 'read',
  },
  manage_guest_data: {
    id: 'manage_guest_data',
    name: 'Manage Guest Data',
    description: 'Modify guest profiles and preferences',
    level: 'write',
  },
  manage_conversations: {
    id: 'manage_conversations',
    name: 'Manage Conversations',
    description: 'Access and manage chat sessions',
    level: 'write',
  },
  access_system: {
    id: 'access_system',
    name: 'Access System',
    description: 'View system health and diagnostics',
    level: 'read',
  },
  manage_agents: {
    id: 'manage_agents',
    name: 'Manage Agents',
    description: 'Create, edit, and delete agent profiles',
    level: 'admin',
  },
  view_analytics: {
    id: 'view_analytics',
    name: 'View Analytics',
    description: 'Access usage and performance analytics',
    level: 'read',
  },
  export_data: {
    id: 'export_data',
    name: 'Export Data',
    description: 'Export conversations and knowledge data',
    level: 'write',
  },
  manage_settings: {
    id: 'manage_settings',
    name: 'Manage Settings',
    description: 'Modify system and agent settings',
    level: 'admin',
  },
  manage_users: {
    id: 'manage_users',
    name: 'Manage Users',
    description: 'Create and manage admin user accounts',
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
