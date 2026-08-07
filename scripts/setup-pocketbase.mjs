#!/usr/bin/env node

/**
 * PocketBase Collection Setup Script for TALA Resort Concierge
 *
 * Run this script AFTER starting PocketBase and creating an admin superuser.
 *
 * Usage:
 *   node scripts/setup-pocketbase.mjs
 *
 * Prerequisites:
 *   1. PocketBase running at http://127.0.0.1:8090
 *   2. Admin superuser created via PocketBase admin UI
 *   3. Set POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD env vars
 */

import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.POCKETBASE_URL || process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('ERROR: POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set.');
  console.error('  export POCKETBASE_ADMIN_EMAIL="your-email"');
  console.error('  export POCKETBASE_ADMIN_PASSWORD="your-password"');
  process.exit(1);
}

const pb = new PocketBase(POCKETBASE_URL);

async function createCollectionIfNotExists(name, config) {
  try {
    const existing = await pb.collections.getOne(name);
    console.log(`  [SKIP] Collection "${name}" already exists.`);
    return existing;
  } catch (e) {
    // Collection doesn't exist, create it
  }

  try {
    const result = await pb.collections.create(config);
    console.log(`  [OK] Created collection "${name}".`);
    return result;
  } catch (err) {
    console.error(`  [ERROR] Failed to create collection "${name}":`, err.message);
    throw err;
  }
}

/**
 * Update collection access rules using PocketBase top-level rule fields.
 *
 * PocketBase semantics:
 *   null  = locked (superuser only)
 *   ""    = public
 *   "str" = conditional rule
 *
 * @param {string} collectionName
 * @param {Object} rules - { list, view, create, update, delete }
 */
async function setupAccessRules(collectionName, rules) {
  // PocketBase SDK expects top-level fields: listRule, viewRule, createRule, updateRule, deleteRule
  // false maps to null (locked/superuser only), NOT empty string (public)
  const updatePayload = {
    listRule:   rules.list   === false ? null : (rules.list   ?? null),
    viewRule:   rules.view   === false ? null : (rules.view   ?? null),
    createRule: rules.create === false ? null : (rules.create ?? null),
    updateRule: rules.update === false ? null : (rules.update ?? null),
    deleteRule: rules.delete === false ? null : (rules.delete ?? null),
  };

  try {
    await pb.collections.update(collectionName, updatePayload);
  } catch (err) {
    console.error(`  [ERROR] Failed to update rules for "${collectionName}":`, err.message);
    process.exit(1);
  }

  // Verify by fetching the collection back and comparing actual values
  let updated;
  try {
    updated = await pb.collections.getOne(collectionName);
  } catch (err) {
    console.error(`  [ERROR] Failed to verify rules for "${collectionName}":`, err.message);
    process.exit(1);
  }

  const actualRules = {
    listRule: updated.listRule,
    viewRule: updated.viewRule,
    createRule: updated.createRule,
    updateRule: updated.updateRule,
    deleteRule: updated.deleteRule,
  };

  let failed = false;
  for (const [key, expected] of Object.entries(updatePayload)) {
    const actual = actualRules[key];
    // null === null, "" === "", string === string
    if (actual !== expected) {
      console.error(`  [FAIL] "${collectionName}" ${key}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      failed = true;
    }
  }

  if (failed) {
    console.error(`  [FATAL] Rule verification failed for "${collectionName}". Aborting.`);
    process.exit(1);
  }

  console.log(`  [OK] Rules verified for "${collectionName}".`);
}

async function setup() {
  console.log('=== TALA PocketBase Collection Setup ===');
  console.log(`Connecting to PocketBase at ${POCKETBASE_URL}...`);

  try {
    await pb.health.check();
    console.log('PocketBase is healthy.\n');
  } catch (err) {
    console.error('ERROR: Cannot connect to PocketBase. Is it running?');
    console.error('Start PocketBase: ./pocketbase serve --http=0.0.0.0:8090');
    process.exit(1);
  }

  // Authenticate as superuser
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('Authenticated as superuser.\n');
  } catch (err) {
    console.error(`ERROR: Superuser authentication failed for ${ADMIN_EMAIL}.`);
    console.error('Create a superuser first via PocketBase admin UI at http://127.0.0.1:8090/_/');
    process.exit(1);
  }

  console.log('Creating collections...\n');

  // 1. Users collection (extends built-in _auth collection)
  await createCollectionIfNotExists('users', {
    name: 'users',
    type: 'auth',
    system: false,
    fields: [
      {
        name: 'name',
        type: 'text',
        required: false,
        options: { min: 0, max: 255 }
      },
      {
        name: 'role',
        type: 'select',
        required: false,
        options: {
          values: ['owner', 'manager', 'staff'],
          maxSelect: 1
        }
      }
    ],
    indexes: [],
    options: {
      allowEmailAuth: true,
      allowOAuth2Auth: false,
      allowUsernameAuth: true,
      exceptEmailDomains: [],
      minPasswordLength: 8,
      requireEmail: false
    }
  });

  // 2. Conversations collection
  await createCollectionIfNotExists('conversations', {
    name: 'conversations',
    type: 'base',
    system: false,
    fields: [
      {
        name: 'guest_label',
        type: 'text',
        required: false,
        options: { min: 0, max: 255 }
      },
      {
        name: 'room',
        type: 'text',
        required: false,
        options: { min: 0, max: 100 }
      },
      {
        name: 'status',
        type: 'select',
        required: false,
        options: {
          values: ['active', 'needs_staff', 'closed'],
          maxSelect: 1
        }
      },
      {
        name: 'session_token',
        type: 'text',
        required: false,
        options: { min: 0, max: 64 }
      }
    ],
    indexes: ['created', 'session_token']
  });

  // 3. Messages collection
  await createCollectionIfNotExists('messages', {
    name: 'messages',
    type: 'base',
    system: false,
    fields: [
      {
        name: 'conversation',
        type: 'relation',
        required: true,
        options: {
          collectionId: 'conversations',
          maxSelect: 1,
          cascadeDelete: true
        }
      },
      {
        name: 'role',
        type: 'select',
        required: true,
        options: {
          values: ['user', 'assistant', 'staff', 'system'],
          maxSelect: 1
        }
      },
      {
        name: 'content',
        type: 'text',
        required: true,
        options: { min: 1 }
      },
      {
        name: 'agent_id',
        type: 'text',
        required: false,
        options: { min: 0, max: 100 }
      }
    ],
    indexes: ['conversation', 'created']
  });

  // 4. Knowledge documents collection
  await createCollectionIfNotExists('knowledge_documents', {
    name: 'knowledge_documents',
    type: 'base',
    system: false,
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true,
        options: { min: 1, max: 255 }
      },
      {
        name: 'category',
        type: 'select',
        required: false,
        options: {
          values: [
            'Property', 'Rooms', 'Food & Breakfast', 'Transportation',
            'Activities', 'San Vicente', 'Policies', 'Emergency', 'Other'
          ],
          maxSelect: 1
        }
      },
      {
        name: 'content',
        type: 'text',
        required: false
      },
      {
        name: 'source_type',
        type: 'select',
        required: false,
        options: {
          values: ['text', 'markdown', 'csv', 'json', 'file', 'manual'],
          maxSelect: 1
        }
      },
      {
        name: 'active',
        type: 'bool',
        required: false
      }
    ],
    indexes: ['category', 'active']
  });

  // 5. Guest requests collection
  await createCollectionIfNotExists('guest_requests', {
    name: 'guest_requests',
    type: 'base',
    system: false,
    fields: [
      {
        name: 'title',
        type: 'text',
        required: true,
        options: { min: 1, max: 255 }
      },
      {
        name: 'description',
        type: 'text',
        required: false
      },
      {
        name: 'category',
        type: 'select',
        required: false,
        options: {
          values: ['housekeeping', 'transportation', 'food', 'maintenance', 'activity', 'general'],
          maxSelect: 1
        }
      },
      {
        name: 'guest_label',
        type: 'text',
        required: false,
        options: { min: 0, max: 255 }
      },
      {
        name: 'room',
        type: 'text',
        required: false,
        options: { min: 0, max: 100 }
      },
      {
        name: 'status',
        type: 'select',
        required: false,
        options: {
          values: ['new', 'in_progress', 'needs_staff', 'completed'],
          maxSelect: 1
        }
      },
      {
        name: 'conversation',
        type: 'relation',
        required: false,
        options: {
          collectionId: 'conversations',
          maxSelect: 1,
          cascadeDelete: 'set_null'
        }
      }
    ],
    indexes: ['category', 'status', 'created']
  });

  // 6. Settings collection (singleton - single record)
  await createCollectionIfNotExists('settings', {
    name: 'settings',
    type: 'base',
    system: false,
    fields: [
      {
        name: 'resort_name',
        type: 'text',
        required: false,
        options: { min: 0, max: 255 }
      },
      {
        name: 'default_model',
        type: 'text',
        required: false,
        options: { min: 0, max: 255 }
      },
      {
        name: 'system_prompt',
        type: 'text',
        required: false
      },
      {
        name: 'voice_profile',
        type: 'json',
        required: false
      },
      {
        name: 'temperature',
        type: 'number',
        required: false,
        options: { min: 0, max: 2 }
      },
      {
        name: 'auto_speak',
        type: 'bool',
        required: false
      },
      {
        name: 'continuous_listening',
        type: 'bool',
        required: false
      },
      {
        name: 'sound_enabled',
        type: 'bool',
        required: false
      }
    ],
    indexes: []
  });

  // 7. Agents collection
  await createCollectionIfNotExists('agents', {
    name: 'agents',
    type: 'base',
    system: false,
    fields: [
      {
        name: 'name',
        type: 'text',
        required: true,
        options: { min: 1, max: 255 }
      },
      {
        name: 'slug',
        type: 'text',
        required: true,
        options: { min: 1, max: 100 }
      },
      {
        name: 'role',
        type: 'text',
        required: false,
        options: { min: 0, max: 255 }
      },
      {
        name: 'description',
        type: 'text',
        required: false
      },
      {
        name: 'system_prompt',
        type: 'text',
        required: false
      },
      {
        name: 'model_id',
        type: 'text',
        required: false,
        options: { min: 0, max: 255 }
      },
      {
        name: 'temperature',
        type: 'number',
        required: false,
        options: { min: 0, max: 2 }
      },
      {
        name: 'voice_enabled',
        type: 'bool',
        required: false
      },
      {
        name: 'voice_language',
        type: 'text',
        required: false,
        options: { min: 0, max: 10 }
      },
      {
        name: 'voice_gender',
        type: 'text',
        required: false,
        options: { min: 0, max: 20 }
      },
      {
        name: 'voice_name',
        type: 'text',
        required: false,
        options: { min: 0, max: 255 }
      },
      {
        name: 'voice_pitch',
        type: 'number',
        required: false,
        options: { min: 0, max: 2 }
      },
      {
        name: 'voice_rate',
        type: 'number',
        required: false,
        options: { min: 0, max: 3 }
      },
      {
        name: 'knowledge_enabled',
        type: 'bool',
        required: false
      },
      {
        name: 'knowledge_categories',
        type: 'json',
        required: false
      },
      {
        name: 'skills',
        type: 'json',
        required: false
      },
      {
        name: 'permissions',
        type: 'json',
        required: false
      },
      {
        name: 'status',
        type: 'select',
        required: false,
        options: {
          values: ['online', 'offline', 'disabled'],
          maxSelect: 1
        }
      },
      {
        name: 'guest_facing',
        type: 'bool',
        required: false
      }
    ],
    indexes: ['slug']
  });

  // Seed default TALA agent
  try {
    const existing = await pb.collection('agents').getFirstListItem('slug="tala-concierge"');
    console.log('  [SKIP] Default TALA agent already exists.');
  } catch (e) {
    await pb.collection('agents').create({
      name: 'TALA',
      slug: 'tala-concierge',
      role: 'BAIA Resort Concierge',
      description: 'The primary AI concierge agent for BAIA Resort San Vicente.',
      system_prompt: "You are TALA, the AI concierge for BAIA Resort. You help guests with questions about their stay, the property, local transportation, food, activities, San Vicente, and information contained in the BAIA knowledge base. Speak naturally, warmly, clearly, and concisely. Prioritize information from the supplied BAIA knowledge base. Never invent property information when the knowledge base does not contain the answer. When appropriate, tell the guest that staff can assist.",
      model_id: 'openrouter/free',
      temperature: 0.7,
      voice_enabled: true,
      voice_language: 'en-US',
      voice_gender: 'female',
      voice_name: '',
      voice_pitch: 1.05,
      voice_rate: 1.05,
      knowledge_enabled: true,
      knowledge_categories: ['Property', 'Rooms', 'Food & Breakfast', 'Transportation', 'Activities', 'San Vicente', 'Policies', 'Emergency'],
      skills: [],
      permissions: ['chat', 'voice', 'knowledge'],
      status: 'online',
      guest_facing: true
    });
    console.log('  [OK] Created default TALA agent.');
  }

  // Seed default settings
  try {
    const existing = await pb.collection('settings').getFirstListItem('');
    console.log('  [SKIP] Settings record already exists.');
  } catch (e) {
    await pb.collection('settings').create({
      resort_name: 'BAIA Resort San Vicente',
      default_model: 'openrouter/free',
      system_prompt: "You are TALA, the AI concierge for BAIA Resort. You help guests with questions about their stay, the property, local transportation, food, activities, San Vicente, and information contained in the BAIA knowledge base. Speak naturally, warmly, clearly, and concisely. Prioritize information from the supplied BAIA knowledge base. Never invent property information when the knowledge base does not contain the answer. When appropriate, tell the guest that staff can assist.",
      voice_profile: {
        pitch: 1.05,
        rate: 1.05,
        selectedVoiceName: ''
      },
      temperature: 0.7,
      auto_speak: true,
      continuous_listening: false,
      sound_enabled: true
    });
    console.log('  [OK] Created default settings record.');
  }

  // 8. Configure access rules (PRIVATE by default)
  // PocketBase rule semantics: null = locked/superuser, "" = public, "rule" = conditional
  console.log('\nConfiguring access rules...\n');

  // users: authenticated self OR owner/manager
  await setupAccessRules('users', {
    list: '@request.auth.id != "" && (id = @request.auth.id || @request.auth.role = "owner" || @request.auth.role = "manager")',
    view: '@request.auth.id != "" && (id = @request.auth.id || @request.auth.role = "owner" || @request.auth.role = "manager")',
    create: false,
    update: '@request.auth.id != "" && (id = @request.auth.id || @request.auth.role = "owner")',
    delete: '@request.auth.role = "owner"'
  });

  // conversations: authenticated only, no public access, no public create (server creates via superuser)
  await setupAccessRules('conversations', {
    list: '@request.auth.id != ""',
    view: '@request.auth.id != ""',
    create: false,
    update: '@request.auth.id != ""',
    delete: '@request.auth.role = "owner" || @request.auth.role = "manager"'
  });

  // messages: authenticated only, no public access, no public create (server creates via superuser)
  await setupAccessRules('messages', {
    list: '@request.auth.id != ""',
    view: '@request.auth.id != ""',
    create: false,
    update: '@request.auth.id != ""',
    delete: '@request.auth.role = "owner" || @request.auth.role = "manager"'
  });

  // knowledge_documents: authenticated only
  await setupAccessRules('knowledge_documents', {
    list: '@request.auth.id != ""',
    view: '@request.auth.id != ""',
    create: '@request.auth.id != ""',
    update: '@request.auth.id != ""',
    delete: '@request.auth.id != ""'
  });

  // guest_requests: authenticated only, no public access, no public create (server creates via superuser)
  await setupAccessRules('guest_requests', {
    list: '@request.auth.id != ""',
    view: '@request.auth.id != ""',
    create: false,
    update: '@request.auth.id != ""',
    delete: '@request.auth.id != ""'
  });

  // settings: authenticated read, owner/manager write
  await setupAccessRules('settings', {
    list: '@request.auth.id != ""',
    view: '@request.auth.id != ""',
    create: '@request.auth.role = "owner" || @request.auth.role = "manager"',
    update: '@request.auth.role = "owner" || @request.auth.role = "manager"',
    delete: '@request.auth.role = "owner"'
  });

  // agents: authenticated read, owner/manager write
  await setupAccessRules('agents', {
    list: '@request.auth.id != ""',
    view: '@request.auth.id != ""',
    create: '@request.auth.role = "owner" || @request.auth.role = "manager"',
    update: '@request.auth.role = "owner" || @request.auth.role = "manager"',
    delete: '@request.auth.role = "owner"'
  });

  console.log('\n=== Setup Complete ===');
  console.log('Collections created: users, conversations, messages, knowledge_documents, guest_requests, settings, agents');
  console.log('Default TALA agent and settings seeded.');
  console.log('Access rules configured: ALL collections are PRIVATE (authenticated only).');
  console.log('Guest access routes through Express server-side endpoints only.');
}

setup().catch((err) => {
  console.error('\nSetup failed:', err);
  process.exit(1);
});
