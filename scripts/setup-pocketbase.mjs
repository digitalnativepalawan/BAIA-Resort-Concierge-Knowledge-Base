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

const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@baia-resort.com';
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD || 'admin123456';

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

  // Authenticate as admin
  try {
    await pb.admins.authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    console.log('Authenticated as admin.\n');
  } catch (err) {
    console.error(`ERROR: Admin authentication failed for ${ADMIN_EMAIL}.`);
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
      }
    ],
    indexes: []
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
    indexes: []
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
    indexes: []
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
    indexes: []
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
          values: ['online', 'offline', 'maintenance'],
          maxSelect: 1
        }
      },
      {
        name: 'guest_facing',
        type: 'bool',
        required: false
      }
    ],
    indexes: []
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

  console.log('\n=== Setup Complete ===');
  console.log('Collections created: users, conversations, messages, knowledge_documents, guest_requests, settings, agents');
  console.log('Default TALA agent and settings seeded.');
  console.log('\nAccess rules have been set. You can configure additional rules via the PocketBase Admin UI.');
}

setup().catch((err) => {
  console.error('\nSetup failed:', err);
  process.exit(1);
});
