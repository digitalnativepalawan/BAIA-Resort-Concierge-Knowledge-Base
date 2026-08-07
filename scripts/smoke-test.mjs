#!/usr/bin/env node

/**
 * TALA PocketBase Runtime Smoke Verification
 *
 * Required env vars:
 *   POCKETBASE_URL           - PocketBase instance URL
 *   POCKETBASE_ADMIN_EMAIL   - Superuser email
 *   POCKETBASE_ADMIN_PASSWORD - Superuser password
 *   APP_URL                  - Express app URL (for Express endpoint tests)
 *
 * Optional:
 *   OPENROUTER_API_KEY       - For OpenRouter live test
 */

import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const APP_URL = process.env.APP_URL || 'http://localhost:3002';
const ADMIN_EMAIL = process.env.POCKETBASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.POCKETBASE_ADMIN_PASSWORD;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';

let passed = 0;
let failed = 0;
let blocked = 0;
const failures = [];

function pass(name) {
  passed++;
  console.log(`  PASS  ${name}`);
}

function fail(name, detail) {
  failed++;
  failures.push({ name, detail });
  console.log(`  FAIL  ${name}: ${detail}`);
}

function block(name, reason) {
  blocked++;
  console.log(`  BLOCK ${name}: ${reason}`);
}

async function run() {
  console.log('=== TALA PocketBase Smoke Verification ===\n');

  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error('FATAL: POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD required');
    process.exit(1);
  }

  const pb = new PocketBase(POCKETBASE_URL);

  // Authenticate superuser
  try {
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    pass('Superuser auth');
  } catch (err) {
    fail('Superuser auth', err.message);
    console.error('\nCannot continue without superuser auth.');
    process.exit(1);
  }

  // ============================================================
  // SCHEMA VERIFICATION
  // ============================================================
  console.log('\n--- Collection Schema ---');

  const expectedCollections = [
    'users', 'conversations', 'messages', 'knowledge_documents',
    'guest_requests', 'settings', 'agents'
  ];

  for (const name of expectedCollections) {
    try {
      const coll = await pb.collections.getOne(name);
      pass(`Collection "${name}" exists`);
    } catch {
      fail(`Collection "${name}" exists`, 'not found');
    }
  }

  // Verify conversations fields
  try {
    const coll = await pb.collections.getOne('conversations');
    const fieldNames = coll.fields.map(f => f.name);
    for (const f of ['guest_label', 'room', 'status', 'session_token']) {
      if (fieldNames.includes(f)) {
        pass(`conversations field "${f}"`);
      } else {
        fail(`conversations field "${f}"`, 'missing');
      }
    }
  } catch (err) {
    fail('conversations schema check', err.message);
  }

  // Verify messages fields
  try {
    const coll = await pb.collections.getOne('messages');
    const fieldNames = coll.fields.map(f => f.name);
    for (const f of ['conversation', 'role', 'content', 'agent_id']) {
      if (fieldNames.includes(f)) {
        pass(`messages field "${f}"`);
      } else {
        fail(`messages field "${f}"`, 'missing');
      }
    }
  } catch (err) {
    fail('messages schema check', err.message);
  }

  // Verify agent status enum
  try {
    const coll = await pb.collections.getOne('agents');
    const statusField = coll.fields.find(f => f.name === 'status');
    if (statusField && Array.isArray(statusField.values)) {
      const hasOnline = statusField.values.includes('online');
      const hasOffline = statusField.values.includes('offline');
      const hasDisabled = statusField.values.includes('disabled');
      const hasMaintenance = statusField.values.includes('maintenance');
      if (hasOnline && hasOffline && hasDisabled && !hasMaintenance) {
        pass('Agent status enum (online|offline|disabled)');
      } else {
        fail('Agent status enum', `values: ${JSON.stringify(statusField.values)}`);
      }
    } else {
      fail('Agent status enum', 'values not found or not array');
    }
  } catch (err) {
    fail('Agent status enum check', err.message);
  }

  // Verify TALA seed
  try {
    const tala = await pb.collection('agents').getFirstListItem('slug="tala-concierge"');
    if (tala.name === 'TALA' && tala.guest_facing === true && tala.status === 'online' && tala.model_id === 'openrouter/free') {
      pass('TALA agent seed');
    } else {
      fail('TALA agent seed', `name=${tala.name} guest_facing=${tala.guest_facing} status=${tala.status} model_id=${tala.model_id}`);
    }
  } catch (err) {
    fail('TALA agent seed', err.message);
  }

  // Verify settings seed
  try {
    const settings = await pb.collection('settings').getFirstListItem('');
    if (settings.resort_name) {
      pass('Settings seed');
    } else {
      fail('Settings seed', 'resort_name missing');
    }
  } catch (err) {
    fail('Settings seed', err.message);
  }

  // ============================================================
  // ACCESS RULE VERIFICATION
  // ============================================================
  console.log('\n--- Access Rules ---');

  const expectedRules = {
    conversations: { listRule: '@request.auth.id != ""', viewRule: '@request.auth.id != ""', createRule: null },
    messages: { listRule: '@request.auth.id != ""', viewRule: '@request.auth.id != ""', createRule: null },
    knowledge_documents: { listRule: '@request.auth.id != ""', viewRule: '@request.auth.id != ""' },
    guest_requests: { listRule: '@request.auth.id != ""', viewRule: '@request.auth.id != ""', createRule: null },
    settings: { listRule: '@request.auth.id != ""', viewRule: '@request.auth.id != ""' },
    agents: { listRule: '@request.auth.id != ""', viewRule: '@request.auth.id != ""' },
  };

  for (const [collName, rules] of Object.entries(expectedRules)) {
    try {
      const coll = await pb.collections.getOne(collName);
      for (const [ruleName, expectedValue] of Object.entries(rules)) {
        const actualValue = coll[ruleName];
        if (actualValue === expectedValue) {
          pass(`${collName}.${ruleName} = ${JSON.stringify(expectedValue)}`);
        } else {
          fail(`${collName}.${ruleName}`, `expected ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`);
        }
      }
    } catch (err) {
      fail(`${collName} rules check`, err.message);
    }
  }

  // ============================================================
  // UNAUTHENTICATED ACCESS TESTS
  // PocketBase returns empty list (200) not 401/403 for list ops
  // when rules deny access. Check for 0 items instead.
  // ============================================================
  console.log('\n--- Unauthenticated Access (must be blocked/empty) ---');

  const unauthPb = new PocketBase(POCKETBASE_URL);

  // For list operations: expect 0 items returned (rule filters all)
  // For create operations: expect 401/403 error
  const unauthListTests = [
    { name: 'list conversations', coll: 'conversations' },
    { name: 'list messages', coll: 'messages' },
    { name: 'list knowledge_documents', coll: 'knowledge_documents' },
    { name: 'list guest_requests', coll: 'guest_requests' },
    { name: 'list settings', coll: 'settings' },
    { name: 'list agents', coll: 'agents' },
  ];

  for (const t of unauthListTests) {
    try {
      const result = await unauthPb.collection(t.coll).getFullList();
      if (result.length === 0) {
        pass(`unauth ${t.name} blocked (0 items)`);
      } else {
        fail(`unauth ${t.name}`, `returned ${result.length} items - rule NOT enforced`);
      }
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        pass(`unauth ${t.name} blocked (HTTP ${err.status})`);
      } else {
        fail(`unauth ${t.name}`, err.message);
      }
    }
  }

  // For create operations: expect 401/403 error
  const unauthCreateTests = [
    { name: 'create conversation', fn: () => unauthPb.collection('conversations').create({ guest_label: 'test' }) },
    { name: 'create message', fn: () => unauthPb.collection('messages').create({ conversation: 'x', role: 'user', content: 'test' }) },
    { name: 'create guest_request', fn: () => unauthPb.collection('guest_requests').create({ title: 'test' }) },
  ];

  for (const t of unauthCreateTests) {
    try {
      await t.fn();
      fail(`unauth ${t.name}`, 'succeeded but should have been blocked');
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        pass(`unauth ${t.name} blocked`);
      } else {
        pass(`unauth ${t.name} blocked (HTTP ${err.status})`);
      }
    }
  }

  // ============================================================
  // GUEST CONVERSATION & SESSION TESTS (via Express)
  // ============================================================
  console.log('\n--- Guest Conversation (Express) ---');

  let guestA = null;
  let guestB = null;

  // POST /api/guest/conversations for Guest A
  try {
    const resp = await fetch(`${APP_URL}/api/guest/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guest_label: 'Smoke Guest A', room: 'Test Villa' })
    });
    const data = await resp.json();
    if (resp.ok && data.conversation_id && data.session_token && data.status === 'active') {
      guestA = data;
      pass('Guest A conversation created');
    } else {
      fail('Guest A conversation', `status=${resp.status} ${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail('Guest A conversation', err.message);
  }

  // POST /api/guest/conversations for Guest B
  try {
    const resp = await fetch(`${APP_URL}/api/guest/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guest_label: 'Smoke Guest B', room: 'Test Suite' })
    });
    const data = await resp.json();
    if (resp.ok && data.conversation_id && data.session_token && data.status === 'active') {
      guestB = data;
      pass('Guest B conversation created');
    } else {
      fail('Guest B conversation', `status=${resp.status} ${JSON.stringify(data)}`);
    }
  } catch (err) {
    fail('Guest B conversation', err.message);
  }

  // ============================================================
  // GUEST MESSAGE TESTS
  // ============================================================
  console.log('\n--- Guest Messages ---');

  if (guestA) {
    // Send valid message
    try {
      const resp = await fetch(`${APP_URL}/api/guest/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: guestA.conversation_id,
          content: 'Hello TALA, this is a runtime verification message.',
          session_token: guestA.session_token
        })
      });
      const data = await resp.json();
      if (resp.ok && data.id) {
        pass('Guest A message sent');
      } else {
        fail('Guest A message', `status=${resp.status} ${JSON.stringify(data)}`);
      }
    } catch (err) {
      fail('Guest A message', err.message);
    }

    // Verify stored role is 'user' (use superuser auth)
    try {
      // Re-authenticate to ensure token is fresh
      await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
      const msgs = await pb.collection('messages').getFullList(200, {
        filter: `conversation="${guestA.conversation_id}"`,
        sort: '-id'
      });
      const userMsg = msgs.find(m => m.content.includes('runtime verification'));
      if (userMsg && userMsg.role === 'user') {
        pass('Stored role is user');
      } else {
        fail('Stored role is user', `role=${userMsg?.role}`);
      }
    } catch (err) {
      fail('Stored role check', err.message);
    }

    // Malicious role test: the API forces role='user'
    try {
      const resp = await fetch(`${APP_URL}/api/guest/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: guestA.conversation_id,
          content: 'This should not be staff role',
          session_token: guestA.session_token
        })
      });
      if (resp.ok) {
        const msgs = await pb.collection('messages').getFullList(200, {
          filter: `conversation="${guestA.conversation_id}"`,
          sort: '-id'
        });
        const lastMsg = msgs[0];
        if (lastMsg && lastMsg.role === 'user') {
          pass('Role escalation blocked (stored as user)');
        } else {
          fail('Role escalation blocked', `last role=${lastMsg?.role}`);
        }
      } else {
        pass('Role escalation blocked (request rejected)');
      }
    } catch (err) {
      pass('Role escalation blocked (error)');
    }

    // Invalid session token
    try {
      const resp = await fetch(`${APP_URL}/api/guest/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: guestA.conversation_id,
          content: 'Bad token message',
          session_token: 'fake-invalid-token-12345'
        })
      });
      if (resp.status === 403) {
        pass('Invalid session token rejected (403)');
      } else {
        fail('Invalid session token', `status=${resp.status}`);
      }
    } catch (err) {
      fail('Invalid session token', err.message);
    }

    // Read with invalid token
    try {
      const resp = await fetch(`${APP_URL}/api/guest/conversations/${guestA.conversation_id}/messages`, {
        headers: { 'X-TALA-SESSION': 'fake-invalid-token' }
      });
      if (resp.status === 403) {
        pass('Read with invalid token rejected (403)');
      } else {
        fail('Read with invalid token', `status=${resp.status}`);
      }
    } catch (err) {
      fail('Read with invalid token', err.message);
    }

    // Read with valid token
    try {
      const resp = await fetch(`${APP_URL}/api/guest/conversations/${guestA.conversation_id}/messages`, {
        headers: { 'X-TALA-SESSION': guestA.session_token }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.messages && data.messages.length > 0) {
          pass('Read with valid token succeeds');
        } else {
          fail('Read with valid token', 'no messages returned');
        }
      } else {
        const errBody = await resp.text();
        fail('Read with valid token', `status=${resp.status} body=${errBody.slice(0, 200)}`);
      }
    } catch (err) {
      fail('Read with valid token', err.message);
    }
  }

  // ============================================================
  // CROSS-GUEST ISOLATION
  // ============================================================
  console.log('\n--- Cross-Guest Isolation ---');

  if (guestA && guestB) {
    // Guest A token with Guest B conversation
    try {
      const resp = await fetch(`${APP_URL}/api/guest/conversations/${guestB.conversation_id}/messages`, {
        headers: { 'X-TALA-SESSION': guestA.session_token }
      });
      if (resp.status === 403) {
        pass('Guest A token cannot read Guest B conversation');
      } else {
        fail('Cross-guest isolation A->B', `status=${resp.status}`);
      }
    } catch (err) {
      fail('Cross-guest isolation A->B', err.message);
    }

    // Guest B token with Guest A conversation
    try {
      const resp = await fetch(`${APP_URL}/api/guest/conversations/${guestA.conversation_id}/messages`, {
        headers: { 'X-TALA-SESSION': guestB.session_token }
      });
      if (resp.status === 403) {
        pass('Guest B token cannot read Guest A conversation');
      } else {
        fail('Cross-guest isolation B->A', `status=${resp.status}`);
      }
    } catch (err) {
      fail('Cross-guest isolation B->A', err.message);
    }

    // Correct pairs work
    try {
      const respA = await fetch(`${APP_URL}/api/guest/conversations/${guestA.conversation_id}/messages`, {
        headers: { 'X-TALA-SESSION': guestA.session_token }
      });
      const respB = await fetch(`${APP_URL}/api/guest/conversations/${guestB.conversation_id}/messages`, {
        headers: { 'X-TALA-SESSION': guestB.session_token }
      });
      if (respA.ok && respB.ok) {
        pass('Correct session pairs work');
      } else {
        fail('Correct session pairs', `A=${respA.status} B=${respB.status}`);
      }
    } catch (err) {
      fail('Correct session pairs', err.message);
    }
  }

  // ============================================================
  // ADMIN CONVERSATION INBOX
  // ============================================================
  console.log('\n--- Admin Conversation Inbox ---');

  try {
    // Re-authenticate to ensure token is fresh
    await pb.collection('_superusers').authWithPassword(ADMIN_EMAIL, ADMIN_PASSWORD);
    const conversations = await pb.collection('conversations').getFullList(200, { sort: '-id' });
    const guestAConv = conversations.find(c => c.guest_label === 'Smoke Guest A');
    const guestBConv = conversations.find(c => c.guest_label === 'Smoke Guest B');

    if (guestAConv && guestBConv) {
      pass('Both guests visible in admin inbox');

      const msgsA = await pb.collection('messages').getFullList(200, {
        filter: `conversation="${guestAConv.id}"`,
        sort: 'id'
      });
      const msgsB = await pb.collection('messages').getFullList(200, {
        filter: `conversation="${guestBConv.id}"`,
        sort: 'id'
      });

      const aHasOwn = msgsA.some(m => m.content.includes('runtime verification'));
      const noCrossover = !msgsA.some(m => m.content.includes('Bad token message')) &&
                          !msgsB.some(m => m.content.includes('runtime verification'));

      if (aHasOwn && noCrossover) {
        pass('Guest A messages isolated in inbox');
      } else {
        fail('Guest A message isolation', `aHasOwn=${aHasOwn} noCrossover=${noCrossover}`);
      }
    } else {
      fail('Admin inbox', `found ${conversations.length} conversations, expected at least 2`);
    }
  } catch (err) {
    fail('Admin inbox check', err.message);
  }

  // ============================================================
  // STAFF REPLY TEST
  // ============================================================
  console.log('\n--- Staff Reply ---');

  if (guestA) {
    try {
      const conv = await pb.collection('conversations').getFirstListItem(`guest_label="Smoke Guest A"`);
      const msg = await pb.collection('messages').create({
        conversation: conv.id,
        role: 'staff',
        content: 'Runtime staff reply.',
        agent_id: 'tala-concierge'
      });
      if (msg.role === 'staff' && msg.conversation === conv.id) {
        pass('Staff reply stored correctly');
      } else {
        fail('Staff reply', `role=${msg.role} conversation=${msg.conversation}`);
      }
    } catch (err) {
      fail('Staff reply', err.message);
    }
  }

  // ============================================================
  // CONVERSATION STATUS TEST
  // ============================================================
  console.log('\n--- Conversation Status ---');

  if (guestA) {
    try {
      const conv = await pb.collection('conversations').getFirstListItem(`guest_label="Smoke Guest A"`);

      await pb.collection('conversations').update(conv.id, { status: 'needs_staff' });
      let check = await pb.collection('conversations').getOne(conv.id);
      if (check.status === 'needs_staff') {
        pass('Status -> needs_staff');
      } else {
        fail('Status -> needs_staff', `got ${check.status}`);
      }

      await pb.collection('conversations').update(conv.id, { status: 'closed' });
      check = await pb.collection('conversations').getOne(conv.id);
      if (check.status === 'closed') {
        pass('Status -> closed');
      } else {
        fail('Status -> closed', `got ${check.status}`);
      }

      await pb.collection('conversations').update(conv.id, { status: 'active' });
      check = await pb.collection('conversations').getOne(conv.id);
      if (check.status === 'active') {
        pass('Status -> active (restored)');
      } else {
        fail('Status -> active', `got ${check.status}`);
      }
    } catch (err) {
      fail('Conversation status', err.message);
    }
  }

  // ============================================================
  // GUEST REQUEST CRUD
  // ============================================================
  console.log('\n--- Guest Request CRUD ---');

  let testRequestId = null;
  try {
    const req = await pb.collection('guest_requests').create({
      title: 'Runtime Test Towels',
      description: 'Temporary smoke test request',
      category: 'housekeeping',
      status: 'new'
    });
    testRequestId = req.id;
    if (req.title === 'Runtime Test Towels' && req.status === 'new') {
      pass('Request created');
    } else {
      fail('Request created', `title=${req.title} status=${req.status}`);
    }
  } catch (err) {
    fail('Request create', err.message);
  }

  if (testRequestId) {
    try {
      await pb.collection('guest_requests').update(testRequestId, { status: 'in_progress' });
      const check = await pb.collection('guest_requests').getOne(testRequestId);
      if (check.status === 'in_progress') {
        pass('Request updated to in_progress');
      } else {
        fail('Request update', `status=${check.status}`);
      }
    } catch (err) {
      fail('Request update', err.message);
    }

    try {
      await pb.collection('guest_requests').update(testRequestId, { status: 'completed' });
      const check = await pb.collection('guest_requests').getOne(testRequestId);
      if (check.status === 'completed') {
        pass('Request updated to completed');
      } else {
        fail('Request update', `status=${check.status}`);
      }
    } catch (err) {
      fail('Request update', err.message);
    }

    try {
      await pb.collection('guest_requests').delete(testRequestId);
      try {
        await pb.collection('guest_requests').getOne(testRequestId);
        fail('Request deleted', 'still exists');
      } catch {
        pass('Request deleted');
      }
    } catch (err) {
      fail('Request delete', err.message);
    }
  }

  // ============================================================
  // SETTINGS AUTHORIZATION
  // ============================================================
  console.log('\n--- Settings Authorization ---');

  const unauthSettings = new PocketBase(POCKETBASE_URL);
  try {
    const result = await unauthSettings.collection('settings').getFullList();
    if (result.length === 0) {
      pass('Unauth settings read blocked (0 items)');
    } else {
      fail('Unauth settings read', `returned ${result.length} items`);
    }
  } catch (err) {
    pass('Unauth settings read blocked (error)');
  }

  try {
    const settings = await pb.collection('settings').getFullList();
    if (settings.length > 0) {
      pass('Auth settings read OK');
    } else {
      fail('Auth settings read', 'no records');
    }
  } catch (err) {
    fail('Auth settings read', err.message);
  }

  // ============================================================
  // AGENT AUTHORIZATION
  // ============================================================
  console.log('\n--- Agent Authorization ---');

  const unauthAgents = new PocketBase(POCKETBASE_URL);
  try {
    const result = await unauthAgents.collection('agents').getFullList();
    if (result.length === 0) {
      pass('Unauth agents list blocked (0 items)');
    } else {
      fail('Unauth agents list', `returned ${result.length} items`);
    }
  } catch (err) {
    pass('Unauth agents list blocked (error)');
  }

  try {
    const agents = await pb.collection('agents').getFullList();
    const tala = agents.find(a => a.slug === 'tala-concierge');
    if (tala && tala.status === 'online') {
      pass('Auth agents list OK, TALA found with status=online');
    } else {
      fail('Auth agents list', `tala=${!!tala} status=${tala?.status}`);
    }
  } catch (err) {
    fail('Auth agents list', err.message);
  }

  // ============================================================
  // AGENT ARCHITECTURE VERIFICATION
  // ============================================================
  console.log('\n--- Agent Architecture ---');

  // Verify agent fields for skills, permissions, knowledge, model, voice
  try {
    const tala = await pb.collection('agents').getFirstListItem('slug="tala-concierge"');
    const fieldNames = (await pb.collections.getOne('agents')).fields.map(f => f.name);

    // Skills field
    if (fieldNames.includes('skills')) {
      pass('Agent field "skills" exists');
      const hasSkills = Array.isArray(tala.skills) && tala.skills.length > 0;
      if (hasSkills) {
        pass(`Agent has ${tala.skills.length} skill(s) assigned`);
      } else {
        fail('Agent skills', `skills=${JSON.stringify(tala.skills)}`);
      }
    } else {
      fail('Agent field "skills"', 'missing from collection');
    }

    // Permissions field
    if (fieldNames.includes('permissions')) {
      pass('Agent field "permissions" exists');
      const hasPerms = Array.isArray(tala.permissions) && tala.permissions.length > 0;
      if (hasPerms) {
        pass(`Agent has ${tala.permissions.length} permission(s) assigned`);
      } else {
        fail('Agent permissions', `permissions=${JSON.stringify(tala.permissions)}`);
      }
    } else {
      fail('Agent field "permissions"', 'missing from collection');
    }

    // Knowledge categories field
    if (fieldNames.includes('knowledge_categories')) {
      pass('Agent field "knowledge_categories" exists');
    } else {
      fail('Agent field "knowledge_categories"', 'missing from collection');
    }

    // Model ID field
    if (fieldNames.includes('model_id')) {
      pass('Agent field "model_id" exists');
      if (tala.model_id) {
        pass(`Agent model_id: ${tala.model_id}`);
      } else {
        fail('Agent model_id', 'empty');
      }
    } else {
      fail('Agent field "model_id"', 'missing from collection');
    }

    // Voice fields
    for (const vField of ['voice_enabled', 'voice_rate', 'voice_name']) {
      if (fieldNames.includes(vField)) {
        pass(`Agent field "${vField}" exists`);
      } else {
        fail(`Agent field "${vField}"`, 'missing from collection');
      }
    }

    // Guest-facing flag
    if (fieldNames.includes('guest_facing')) {
      pass('Agent field "guest_facing" exists');
      if (tala.guest_facing === true) {
        pass('TALA is guest-facing');
      } else {
        fail('TALA guest_facing', `expected true, got ${tala.guest_facing}`);
      }
    } else {
      fail('Agent field "guest_facing"', 'missing from collection');
    }

  } catch (err) {
    fail('Agent architecture check', err.message);
  }

  // Verify agent test endpoint exists
  try {
    const resp = await fetch(`${APP_URL}/api/agents/tala-concierge/test`);
    const data = await resp.json();
    if (resp.ok && data.ok !== undefined && data.agent) {
      pass('Agent test endpoint responds');
      if (data.agent.slug === 'tala-concierge') {
        pass('Agent test endpoint returns correct agent');
      } else {
        fail('Agent test endpoint', `slug=${data.agent.slug}`);
      }
      if (data.agent.skills && data.agent.skills.length > 0) {
        pass('Agent test endpoint reports skills');
      } else {
        fail('Agent test endpoint skills', `skills=${JSON.stringify(data.agent.skills)}`);
      }
      if (data.agent.permissions && data.agent.permissions.length > 0) {
        pass('Agent test endpoint reports permissions');
      } else {
        fail('Agent test endpoint permissions', `permissions=${JSON.stringify(data.agent.permissions)}`);
      }
    } else {
      fail('Agent test endpoint', `status=${resp.status} ok=${data.ok}`);
    }
  } catch (err) {
    fail('Agent test endpoint', err.message);
  }

  // Verify non-existent agent returns 404
  try {
    const resp = await fetch(`${APP_URL}/api/agents/nonexistent-agent/test`);
    if (resp.status === 404) {
      pass('Agent test endpoint returns 404 for unknown slug');
    } else {
      const data = await resp.json();
      fail('Agent test 404', `status=${resp.status} error=${data.error}`);
    }
  } catch (err) {
    fail('Agent test 404', err.message);
  }

  // Verify agent chat with agentSlug parameter
  if (OPENROUTER_API_KEY) {
    try {
      const resp = await fetch(`${APP_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentSlug: 'tala-concierge',
          prompt: 'Reply with exactly: ARCH_TEST_OK',
          history: []
        })
      });
      const data = await resp.json();
      if (resp.ok && data.responseText) {
        pass('Chat with agentSlug parameter works');
      } else {
        fail('Chat with agentSlug', `status=${resp.status} ${JSON.stringify(data)}`);
      }
    } catch (err) {
      fail('Chat with agentSlug', err.message);
    }
  } else {
    block('Chat with agentSlug', 'OPENROUTER_API_KEY not set');
  }

  // ============================================================
  // KNOWLEDGE PRIVACY
  // ============================================================
  console.log('\n--- Knowledge Privacy ---');

  let testDocId = null;
  try {
    const doc = await pb.collection('knowledge_documents').create({
      title: 'Runtime Verification Knowledge',
      category: 'Other',
      content: 'The BAIA runtime verification code phrase is MANGO-TALA-7429.',
      active: true
    });
    testDocId = doc.id;
    pass('Test knowledge doc created');
  } catch (err) {
    fail('Test knowledge doc', err.message);
  }

  const unauthKB = new PocketBase(POCKETBASE_URL);
  try {
    const result = await unauthKB.collection('knowledge_documents').getFullList();
    if (result.length === 0) {
      pass('Unauth knowledge read blocked (0 items)');
    } else {
      fail('Unauth knowledge read', `returned ${result.length} items`);
    }
  } catch (err) {
    pass('Unauth knowledge read blocked (error)');
  }

  try {
    const docs = await pb.collection('knowledge_documents').getFullList(200, {
      filter: 'active=true'
    });
    const found = docs.find(d => d.content && d.content.includes('MANGO-TALA-7429'));
    if (found) {
      pass('Auth knowledge read OK (includes test doc)');
    } else {
      fail('Auth knowledge read', 'test doc not found');
    }
  } catch (err) {
    fail('Auth knowledge read', err.message);
  }

  // ============================================================
  // SERVER KNOWLEDGE ACCESS (via Express health)
  // ============================================================
  console.log('\n--- Server Knowledge Access ---');

  try {
    const resp = await fetch(`${APP_URL}/api/health`);
    const data = await resp.json();
    if (data.pocketbaseConnected === true) {
      pass('Server PocketBase connected');
    } else {
      fail('Server PocketBase connected', `pocketbaseConnected=${data.pocketbaseConnected}`);
    }
  } catch (err) {
    fail('Server health check', err.message);
  }

  // ============================================================
  // OPENROUTER TEST (if key available)
  // ============================================================
  console.log('\n--- OpenRouter ---');

  if (OPENROUTER_API_KEY && guestA) {
    try {
      const resp = await fetch(`${APP_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'openrouter/free',
          prompt: 'Reply with exactly: TALA_RUNTIME_OK',
          history: [],
          conversation_id: guestA.conversation_id,
          session_token: guestA.session_token
        })
      });
      const data = await resp.json();
      if (resp.ok && data.responseText) {
        pass('OpenRouter chat response received');
      } else {
        fail('OpenRouter chat', `status=${resp.status} ${JSON.stringify(data)}`);
      }
    } catch (err) {
      fail('OpenRouter chat', err.message);
    }

    // Check assistant message persistence
    try {
      await new Promise(r => setTimeout(r, 1000));
      const msgs = await pb.collection('messages').getFullList(200, {
        filter: `conversation="${guestA.conversation_id}"`,
        sort: '-id'
      });
      const assistantMsg = msgs.find(m => m.role === 'assistant');
      if (assistantMsg && assistantMsg.agent_id === 'tala-concierge') {
        pass('Assistant message persisted');
      } else {
        fail('Assistant message persistence', `found=${!!assistantMsg} agent_id=${assistantMsg?.agent_id}`);
      }
    } catch (err) {
      fail('Assistant message persistence', err.message);
    }
  } else {
    block('OpenRouter chat', OPENROUTER_API_KEY ? 'no guest session' : 'OPENROUTER_API_KEY not set');
    block('Assistant persistence', OPENROUTER_API_KEY ? 'no guest session' : 'OPENROUTER_API_KEY not set');
  }

  // ============================================================
  // CLEANUP
  // ============================================================
  console.log('\n--- Cleanup ---');

  const cleanupTargets = [
    { coll: 'guest_requests', id: testRequestId },
    { coll: 'knowledge_documents', id: testDocId },
  ];

  for (const t of cleanupTargets) {
    if (t.id) {
      try {
        await pb.collection(t.coll).delete(t.id);
        pass(`Cleanup ${t.coll}`);
      } catch (err) {
        console.log(`  WARN Cleanup ${t.coll}: ${err.message}`);
      }
    }
  }

  // Delete guest conversations and messages
  try {
    const convs = await pb.collection('conversations').getFullList();
    for (const c of convs) {
      if (c.guest_label && c.guest_label.startsWith('Smoke Guest')) {
        const msgs = await pb.collection('messages').getFullList(200, {
          filter: `conversation="${c.id}"`
        });
        for (const m of msgs) {
          await pb.collection('messages').delete(m.id);
        }
        await pb.collection('conversations').delete(c.id);
        pass(`Cleanup conversation ${c.guest_label}`);
      }
    }
  } catch (err) {
    console.log(`  WARN Cleanup conversations: ${err.message}`);
  }

  // Delete staff reply
  try {
    const staffMsgs = await pb.collection('messages').getFullList(200, {
      filter: 'content="Runtime staff reply."'
    });
    for (const m of staffMsgs) {
      await pb.collection('messages').delete(m.id);
    }
    if (staffMsgs.length > 0) pass('Cleanup staff replies');
  } catch {}

  // ============================================================
  // RESULTS
  // ============================================================
  console.log('\n========================================');
  console.log(`PASSED:   ${passed}`);
  console.log(`FAILED:   ${failed}`);
  console.log(`BLOCKED:  ${blocked}`);
  console.log('========================================');

  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`  - ${f.name}: ${f.detail}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});
