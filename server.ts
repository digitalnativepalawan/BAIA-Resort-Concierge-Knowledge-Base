import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import PocketBase from 'pocketbase';

// Server-side PocketBase config (NOT exposed to frontend via VITE_)
const POCKETBASE_URL = process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(POCKETBASE_URL);

const DEFAULT_SYSTEM_INSTRUCTION =
  "You are TALA, the AI concierge for BAIA. You help guests with questions about their stay, the property, local transportation, food, activities, San Vicente, and information contained in the BAIA knowledge base. Speak naturally, warmly, clearly, and concisely. Prioritize information from the supplied BAIA knowledge base. Never invent property information when the knowledge base does not contain the answer. When appropriate, tell the guest that staff can assist.";

// Server-side cache for OpenRouter model catalog
let cachedModels: any[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 20 * 60 * 1000;

// PocketBase health status cache
let pbLastHealthy = false;
let pbLastCheck = 0;
const PB_HEALTH_TTL_MS = 30 * 1000; // 30 seconds

// Fallback catalog if OpenRouter model list endpoint is unreachable and cache is empty
const FALLBACK_MODELS = [
  {
    id: 'openrouter/free',
    name: 'OpenRouter: Free Router',
    description: 'Auto-routes queries to top-performing zero-cost models on OpenRouter.',
    context_length: 128000,
    pricing: { prompt: '0', completion: '0' },
    architecture: { modality: 'text->text' },
    supported_parameters: ['temperature', 'top_p', 'max_tokens'],
    is_free: true
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Meta Llama 3.3 70B Instruct (Free)',
    description: 'High-intelligence 70B open model with zero cost on OpenRouter.',
    context_length: 131072,
    pricing: { prompt: '0', completion: '0' },
    architecture: { modality: 'text->text' },
    supported_parameters: ['temperature', 'top_p'],
    is_free: true
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 (Free)',
    description: 'Reasoning model from DeepSeek available for free testing.',
    context_length: 64000,
    pricing: { prompt: '0', completion: '0' },
    architecture: { modality: 'text->text' },
    supported_parameters: ['temperature'],
    is_free: true
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Anthropic: Claude 3.5 Haiku',
    description: 'Fast, precise, highly intelligent conversational model.',
    context_length: 200000,
    pricing: { prompt: '0.000001', completion: '0.000005' },
    architecture: { modality: 'text->text' },
    supported_parameters: ['temperature', 'top_p'],
    is_free: false
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'OpenAI: GPT-4o Mini',
    description: 'Lightweight, rapid OpenAI model.',
    context_length: 128000,
    pricing: { prompt: '0.00000015', completion: '0.0000006' },
    architecture: { modality: 'text->text' },
    supported_parameters: ['temperature', 'top_p'],
    is_free: false
  }
];

// Check PocketBase health (cached)
async function checkPocketBaseHealth(): Promise<boolean> {
  const now = Date.now();
  if (now - pbLastCheck < PB_HEALTH_TTL_MS) {
    return pbLastHealthy;
  }
  try {
    await pb.health.check();
    pbLastHealthy = true;
  } catch {
    pbLastHealthy = false;
  }
  pbLastCheck = now;
  return pbLastHealthy;
}

// Server-side PocketBase admin auth (cached, refreshed as needed)
async function ensureServerAuth(): Promise<boolean> {
  if (pb.authStore.isValid) return true;
  const email = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;
  if (!email || !password) {
    console.warn('[TALA SERVER] POCKETBASE_ADMIN_EMAIL/PASSWORD not configured');
    return false;
  }
  try {
    await pb.collection('_superusers').authWithPassword(email, password);
    return true;
  } catch (err: any) {
    console.warn('[TALA SERVER] PocketBase superuser auth failed:', err.message);
    return false;
  }
}

// Server-side knowledge grounding: fetch active knowledge docs from PocketBase
async function getGroundedKnowledgeBase(): Promise<string> {
  try {
    const authenticated = await ensureServerAuth();
    if (!authenticated) {
      console.warn('[TALA KNOWLEDGE] Cannot authenticate to PocketBase');
      return '';
    }

    const records = await pb.collection('knowledge_documents').getFullList(200, {
      filter: 'active=true',
      sort: '-id'
    });

    if (records.length === 0) return '';

    const docsText = records
      .filter((r: any) => r.content)
      .map((r: any, idx: number) => `--- GROUNDED DOCUMENT ${idx + 1} (${r.category || 'General'}): ${r.title} ---\n${r.content}`)
      .join('\n\n');

    return docsText ? `\n\n=== BAIA GROUNDING KNOWLEDGE BASE ===\nThe administrator has supplied the following reference documents:\n\n${docsText}\n\n=== CONCIERGE DIRECTIVES ===\n1. Answer guest queries by prioritizing context from the BAIA GROUNDING KNOWLEDGE BASE provided above.\n2. When asked about property information, San Vicente, transportation, amenities, food, or activities contained in these documents, give accurate, direct, warm, structured answers based on document text.\n3. Never invent property details not present in the knowledge base. When appropriate, state that resort staff can assist.` : '';
  } catch (err) {
    console.warn('[TALA KNOWLEDGE] Failed to fetch knowledge base:', err);
    return '';
  }
}

// Validate guest session token for a conversation
async function validateGuestSession(conversationId: string, sessionToken: string): Promise<boolean> {
  if (!conversationId || !sessionToken) return false;
  try {
    const authenticated = await ensureServerAuth();
    if (!authenticated) return false;

    const record = await pb.collection('conversations').getOne(conversationId);
    return record.session_token === sessionToken;
  } catch {
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.use(express.json({ limit: '10mb' }));

  // API Health Check (real PocketBase health)
  app.get('/api/health', async (_req, res) => {
    const pbConnected = await checkPocketBaseHealth();
    res.json({
      status: pbConnected ? 'online' : 'degraded',
      system: 'TALA Core Engine v2.5.0',
      timestamp: new Date().toISOString(),
      openrouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
      pocketbaseConnected: pbConnected
    });
  });

  // ==========================================
  // GUEST API ROUTES (server-side PocketBase)
  // ==========================================

  // Create a new guest conversation with session token
  app.post('/api/guest/conversations', async (req, res) => {
    try {
      const authenticated = await ensureServerAuth();
      if (!authenticated) {
        return res.status(503).json({ error: 'TALA is temporarily unavailable. Please contact resort staff.' });
      }

      const { guest_label, room } = req.body;
      const sessionToken = crypto.randomBytes(32).toString('hex');

      const record = await pb.collection('conversations').create({
        guest_label: guest_label || 'Guest',
        room: room || 'Main Villa',
        status: 'active',
        session_token: sessionToken
      });
      res.json({ conversation_id: record.id, session_token: sessionToken, status: record.status });
    } catch (err: any) {
      console.error('[GUEST API] Failed to create conversation:', err);
      res.status(500).json({ error: 'TALA is temporarily unavailable. Please contact resort staff.' });
    }
  });

  // Save a guest message (role forced to 'user')
  app.post('/api/guest/messages', async (req, res) => {
    try {
      const { conversation_id, content, session_token } = req.body;
      if (!conversation_id || !content || !session_token) {
        return res.status(400).json({ error: 'conversation_id, content, and session_token are required' });
      }

      // Validate session token
      const valid = await validateGuestSession(conversation_id, session_token);
      if (!valid) {
        return res.status(403).json({ error: 'Invalid session token' });
      }

      const authenticated = await ensureServerAuth();
      if (!authenticated) {
        return res.status(503).json({ error: 'TALA is temporarily unavailable. Please contact resort staff.' });
      }

      // Force role to 'user' - never trust guest-supplied role
      const record = await pb.collection('messages').create({
        conversation: conversation_id,
        role: 'user',
        content,
        agent_id: 'tala-concierge'
      });
      res.json({ id: record.id });
    } catch (err: any) {
      console.error('[GUEST API] Failed to save message:', err);
      res.status(500).json({ error: 'TALA is temporarily unavailable. Please contact resort staff.' });
    }
  });

  // Get messages for a conversation (requires valid session token)
  app.get('/api/guest/conversations/:conversationId/messages', async (req, res) => {
    try {
      const { conversationId } = req.params;
      const sessionToken = req.headers['x-tala-session'] as string;

      if (!sessionToken) {
        return res.status(403).json({ error: 'Session token required' });
      }

      const valid = await validateGuestSession(conversationId, sessionToken);
      if (!valid) {
        return res.status(403).json({ error: 'Invalid session token' });
      }

      const authenticated = await ensureServerAuth();
      if (!authenticated) {
        return res.status(503).json({ error: 'TALA is temporarily unavailable. Please contact resort staff.' });
      }

      const records = await pb.collection('messages').getFullList(200, {
        filter: `conversation="${conversationId}"`
      });
      const messages = records.map((r: any) => ({
        id: r.id,
        role: r.role === 'assistant' ? 'model' : r.role,
        text: r.content,
      }));
      res.json({ messages });
    } catch (err: any) {
      console.error('[GUEST API] Failed to get messages:', err);
      res.status(500).json({ error: 'TALA is temporarily unavailable. Please contact resort staff.' });
    }
  });

  // NOTE: GET /api/guest/conversations (list all) REMOVED - use admin PocketBase access instead
  // NOTE: POST /api/guest/messages with arbitrary role REMOVED - role is forced to 'user' above

  // OpenRouter Model Catalog Endpoint with Server-Side Caching
  app.get('/api/models', async (req, res) => {
    const now = Date.now();
    if (cachedModels.length > 0 && now - cacheTimestamp < CACHE_TTL_MS) {
      return res.json({ models: cachedModels, cached: true, timestamp: new Date(cacheTimestamp).toISOString() });
    }

    try {
      console.log('[TALA MODELS] Fetching live model catalog from OpenRouter API...');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (process.env.OPENROUTER_API_KEY) {
        headers['Authorization'] = `Bearer ${process.env.OPENROUTER_API_KEY.replace(/^["'\s]+|["'\s]+$/g, '').trim()}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`OpenRouter models API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawList = Array.isArray(data.data) ? data.data : [];

      if (rawList.length === 0) {
        throw new Error('Empty model array received from OpenRouter');
      }

      const normalizedList = rawList.map((m: any) => {
        const promptPrice = Number(m.pricing?.prompt || 0);
        const completionPrice = Number(m.pricing?.completion || 0);
        const isFree =
          (promptPrice === 0 && completionPrice === 0) ||
          m.id === 'openrouter/free' ||
          (typeof m.id === 'string' && m.id.endsWith(':free'));

        return {
          id: m.id,
          name: m.name || m.id,
          description: m.description || '',
          context_length: m.context_length || 4096,
          pricing: {
            prompt: m.pricing?.prompt ?? '0',
            completion: m.pricing?.completion ?? '0',
            request: m.pricing?.request ?? '0',
            image: m.pricing?.image ?? '0'
          },
          architecture: m.architecture || {},
          supported_parameters: m.supported_parameters || [],
          is_free: isFree
        };
      });

      const hasFreeRouter = normalizedList.some((m: any) => m.id === 'openrouter/free');
      if (!hasFreeRouter) {
        normalizedList.unshift(FALLBACK_MODELS[0]);
      } else {
        normalizedList.sort((a: any, b: any) => {
          if (a.id === 'openrouter/free') return -1;
          if (b.id === 'openrouter/free') return 1;
          return 0;
        });
      }

      cachedModels = normalizedList;
      cacheTimestamp = now;

      return res.json({ models: cachedModels, cached: false, timestamp: new Date(cacheTimestamp).toISOString() });
    } catch (err: any) {
      console.warn('[TALA MODELS FETCH FAILED]', err.message);
      if (cachedModels.length > 0) {
        return res.json({ models: cachedModels, cached: true, stale: true, timestamp: new Date(cacheTimestamp).toISOString() });
      }
      return res.json({ models: FALLBACK_MODELS, cached: false, fallback: true, timestamp: new Date().toISOString() });
    }
  });

  // TALA Voice Assistant Chat Endpoint (OpenRouter Gateway)
  app.post('/api/chat', async (req, res) => {
    try {
      const { model, prompt, history, systemInstruction, conversation_id, session_token } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      // Server-only API key: do NOT accept browser-supplied keys
      const apiKey = (process.env.OPENROUTER_API_KEY || '').replace(/^["'\s]+|["'\s]+$/g, '').trim();

      if (!apiKey) {
        console.error('[TALA CHAT] OPENROUTER_API_KEY not configured on server');
        return res.status(503).json({
          error: 'TALA is temporarily unavailable. Please contact resort staff.'
        });
      }

      const activeSystemInstruction = systemInstruction && systemInstruction.trim()
        ? systemInstruction
        : DEFAULT_SYSTEM_INSTRUCTION;

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: activeSystemInstruction }
      ];

      // Server-side knowledge grounding: append knowledge base docs to system instruction
      const knowledgeBase = await getGroundedKnowledgeBase();
      if (knowledgeBase) {
        messages[0].content += knowledgeBase;
      }

      if (Array.isArray(history)) {
        for (const item of history) {
          if (item && item.text && (item.role === 'user' || item.role === 'model' || item.role === 'assistant')) {
            messages.push({
              role: item.role === 'model' ? 'assistant' : item.role,
              content: item.text
            });
          }
        }
      }

      messages.push({ role: 'user', content: prompt });

      const targetModel = model || 'openrouter/free';

      console.log(`[TALA OPENROUTER] Dispatching payload to model '${targetModel}'...`);

      const openrouterHeaders = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'TALA Voice Assistant'
      };

      const openrouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: openrouterHeaders,
        body: JSON.stringify({
          model: targetModel,
          messages,
          temperature: 0.7
        })
      });

      const rawOpenRouterText = await openrouterResponse.text();
      let openrouterData: any = {};
      try {
        openrouterData = JSON.parse(rawOpenRouterText);
      } catch (e) {
        console.error('[TALA OPENROUTER PARSE ERROR]', rawOpenRouterText.slice(0, 300));
        return res.status(502).json({
          error: 'TALA is temporarily unavailable. Please contact resort staff.'
        });
      }

      if (!openrouterResponse.ok || openrouterData.error) {
        const errDetail = typeof openrouterData.error === 'object'
          ? (openrouterData.error.message || JSON.stringify(openrouterData.error))
          : (openrouterData.error || `HTTP ${openrouterResponse.status}`);

        console.warn('[TALA OPENROUTER REJECTED]', errDetail);
        return res.status(502).json({
          error: 'TALA is temporarily unavailable. Please contact resort staff.'
        });
      }

      const choice = openrouterData.choices?.[0];
      const responseText = choice?.message?.content || choice?.text || '';

      if (!responseText) {
        return res.status(500).json({ error: 'TALA is temporarily unavailable. Please contact resort staff.' });
      }

      // Server-side: persist assistant response to PocketBase if conversation context provided
      if (conversation_id && session_token) {
        try {
          const valid = await validateGuestSession(conversation_id, session_token);
          if (valid) {
            const authenticated = await ensureServerAuth();
            if (authenticated) {
              await pb.collection('messages').create({
                conversation: conversation_id,
                role: 'assistant',
                content: responseText,
                agent_id: 'tala-concierge'
              });
            }
          }
        } catch (persistErr) {
          console.warn('[TALA CHAT] Failed to persist assistant message:', persistErr);
        }
      }

      return res.json({
        responseText,
        model: openrouterData.model || targetModel,
        provider: 'openrouter',
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('[TALA API ERROR]', error);
      return res.status(500).json({
        error: 'TALA is temporarily unavailable. Please contact resort staff.'
      });
    }
  });

  // Vite middleware for development / static server for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TALA SERVER ONLINE] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
