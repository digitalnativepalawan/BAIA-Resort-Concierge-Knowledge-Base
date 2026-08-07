import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import PocketBase from 'pocketbase';

const POCKETBASE_URL = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';
const pb = new PocketBase(POCKETBASE_URL);

const DEFAULT_SYSTEM_INSTRUCTION =
  "You are TALA, the AI concierge for BAIA. You help guests with questions about their stay, the property, local transportation, food, activities, San Vicente, and information contained in the BAIA knowledge base. Speak naturally, warmly, clearly, and concisely. Prioritize information from the supplied BAIA knowledge base. Never invent property information when the knowledge base does not contain the answer. When appropriate, tell the guest that staff can assist.";

// Server-side cache for OpenRouter model catalog
let cachedModels: any[] = [];
let cacheTimestamp = 0;
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes

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

// Server-side knowledge grounding: fetch active knowledge docs from PocketBase
async function getGroundedKnowledgeBase(): Promise<string> {
  try {
    const records = await pb.collection('knowledge_documents').getFullList({
      filter: 'active=true',
      sort: '-created'
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'online',
      system: 'TALA Core Engine v2.5.0',
      timestamp: new Date().toISOString(),
      hasServerOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY),
      pocketbaseConnected: true
    });
  });

  // ==========================================
  // GUEST API ROUTES (server-side PocketBase)
  // ==========================================

  // Create a new conversation
  app.post('/api/guest/conversations', async (req, res) => {
    try {
      const { guest_label, room } = req.body;
      const record = await pb.collection('conversations').create({
        guest_label: guest_label || 'Guest',
        room: room || 'Main Villa',
        status: 'active'
      });
      res.json({ id: record.id, status: record.status });
    } catch (err: any) {
      console.error('[GUEST API] Failed to create conversation:', err);
      res.status(500).json({ error: err.message || 'Failed to create conversation' });
    }
  });

  // Save a message to a conversation
  app.post('/api/guest/messages', async (req, res) => {
    try {
      const { conversation_id, role, content, agent_id } = req.body;
      if (!conversation_id || !content) {
        return res.status(400).json({ error: 'conversation_id and content are required' });
      }
      const record = await pb.collection('messages').create({
        conversation: conversation_id,
        role: role || 'user',
        content,
        agent_id: agent_id || 'tala-concierge'
      });
      res.json({ id: record.id });
    } catch (err: any) {
      console.error('[GUEST API] Failed to save message:', err);
      res.status(500).json({ error: err.message || 'Failed to save message' });
    }
  });

  // List all conversations (admin)
  app.get('/api/guest/conversations', async (req, res) => {
    try {
      const records = await pb.collection('conversations').getFullList({
        sort: '-created'
      });
      const conversations = records.map((r: any) => ({
        id: r.id,
        guest_label: r.guest_label,
        room: r.room,
        status: r.status,
        created: r.created
      }));
      res.json({ conversations });
    } catch (err: any) {
      console.error('[GUEST API] Failed to list conversations:', err);
      res.status(500).json({ error: err.message || 'Failed to list conversations' });
    }
  });

  // Get messages for a conversation
  app.get('/api/guest/messages/:conversationId', async (req, res) => {
    try {
      const { conversationId } = req.params;
      const records = await pb.collection('messages').getFullList({
        filter: `conversation="${conversationId}"`,
        sort: 'created'
      });
      const messages = records.map((r: any) => ({
        id: r.id,
        role: r.role === 'assistant' ? 'model' : r.role,
        text: r.content,
        timestamp: new Date(r.created).toISOString()
      }));
      res.json({ messages });
    } catch (err: any) {
      console.error('[GUEST API] Failed to get messages:', err);
      res.status(500).json({ error: err.message || 'Failed to get messages' });
    }
  });

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

      // Always ensure 'openrouter/free' is at the top if present or prepend it
      const hasFreeRouter = normalizedList.some((m: any) => m.id === 'openrouter/free');
      if (!hasFreeRouter) {
        normalizedList.unshift(FALLBACK_MODELS[0]);
      } else {
        // Move openrouter/free to the very top
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
      const {
        openrouterApiKey,
        customApiKey,
        model,
        prompt,
        history,
        systemInstruction
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const activeSystemInstruction = systemInstruction && systemInstruction.trim()
        ? systemInstruction
        : DEFAULT_SYSTEM_INSTRUCTION;

      let rawKey = (openrouterApiKey && typeof openrouterApiKey === 'string' && openrouterApiKey.trim())
        ? openrouterApiKey
        : (customApiKey && typeof customApiKey === 'string' && customApiKey.trim() ? customApiKey : (process.env.OPENROUTER_API_KEY || ''));

      const apiKey = rawKey.replace(/^["'\s]+|["'\s]+$/g, '').trim();

      if (!apiKey) {
        return res.status(400).json({
          error: 'No OpenRouter API key available. Please configure your OpenRouter API key in Settings.'
        });
      }

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
          error: `OpenRouter gateway error (${openrouterResponse.status}): ${rawOpenRouterText.slice(0, 200)}`
        });
      }

      if (!openrouterResponse.ok || openrouterData.error) {
        const errDetail = typeof openrouterData.error === 'object'
          ? (openrouterData.error.message || JSON.stringify(openrouterData.error))
          : (openrouterData.error || `HTTP ${openrouterResponse.status}`);

        console.warn('[TALA OPENROUTER REJECTED]', errDetail);
        return res.status(openrouterResponse.status || 400).json({
          error: `OpenRouter API Error: ${errDetail}`
        });
      }

      const choice = openrouterData.choices?.[0];
      const responseText = choice?.message?.content || choice?.text || '';

      if (!responseText) {
        return res.status(500).json({ error: 'OpenRouter returned empty signal response.' });
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
        error: error.message || 'An error occurred while communicating with TALA AI core.'
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
