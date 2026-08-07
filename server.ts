import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

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
      hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY)
    });
  });

  // TALA Voice Assistant Chat Endpoint
  app.post('/api/chat', async (req, res) => {
    try {
      const {
        provider = 'openrouter',
        openrouterApiKey,
        googleApiKey,
        customApiKey,
        model,
        prompt,
        history,
        systemInstruction
      } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const defaultSystemInstruction =
        "You are TALA (Tactical Artificial Intelligence Assistant), a highly advanced sci-fi AI interface created to deliver precise, intelligent, concise tactical assessments and answers. Maintain a serene, confident, and professional futuristic persona. Keep responses direct, elegant, and well-structured, formatted for both audio vocalization and HUD screen display. Avoid conversational fluff or robotic repetition.";

      const activeSystemInstruction = systemInstruction || defaultSystemInstruction;

      // ==========================================
      // 1. OPENROUTER PRIMARY ENGINE (DEFAULT)
      // ==========================================
      if (provider === 'openrouter') {
        let rawKey = (openrouterApiKey && typeof openrouterApiKey === 'string' && openrouterApiKey.trim())
          ? openrouterApiKey
          : (customApiKey && typeof customApiKey === 'string' && customApiKey.trim() ? customApiKey : (process.env.OPENROUTER_API_KEY || ''));

        const apiKey = rawKey.replace(/^["'\s]+|["'\s]+$/g, '').trim();

        if (!apiKey) {
          return res.status(400).json({
            error: 'No OpenRouter API key available. Please enter your OpenRouter API key in TALA Settings (CONFIG).'
          });
        }

        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
          { role: 'system', content: activeSystemInstruction }
        ];

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

        console.log(`[TALA OPENROUTER] Dispatching payload to OpenRouter model '${targetModel}'...`);

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
      }

      // ==========================================
      // 2. GOOGLE AI STUDIO ENGINE (BACKUP)
      // ==========================================
      let rawKey = (googleApiKey && typeof googleApiKey === 'string' && googleApiKey.trim())
        ? googleApiKey
        : (customApiKey && typeof customApiKey === 'string' && customApiKey.trim() ? customApiKey : (process.env.GEMINI_API_KEY || ''));

      const apiKey = rawKey.replace(/^["'\s]+|["'\s]+$/g, '').trim();

      if (!apiKey) {
        return res.status(400).json({
          error: 'No Google AI Studio API key available. Please enter your GEMINI_API_KEY in TALA Settings (CONFIG).'
        });
      }

      const ai = new GoogleGenAI({ apiKey });

      const formattedContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history)) {
        for (const item of history) {
          if (item && item.text && (item.role === 'user' || item.role === 'model')) {
            formattedContents.push({
              role: item.role,
              parts: [{ text: item.text }]
            });
          }
        }
      }

      formattedContents.push({
        role: 'user',
        parts: [{ text: prompt }]
      });

      const baseCandidates = [
        'gemini-1.5-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro'
      ];

      const candidateModels = model && typeof model === 'string'
        ? [model, ...baseCandidates.filter(m => m !== model)]
        : baseCandidates;

      let responseText = '';
      let usedModel = '';
      let lastError: any = null;

      for (const modelCandidate of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelCandidate,
            contents: formattedContents,
            config: {
              systemInstruction: activeSystemInstruction,
              temperature: 0.7,
            },
          });

          if (response && response.text) {
            responseText = response.text;
            usedModel = modelCandidate;
            break;
          }
        } catch (err: any) {
          console.warn(`[TALA GOOGLE] Model '${modelCandidate}' failed:`, err?.message || err);
          lastError = err;
        }
      }

      if (!responseText) {
        let availableModels: string[] = [];
        try {
          const listResponse = await ai.models.list();
          for await (const m of listResponse) {
            if (m.name) {
              availableModels.push(m.name.replace(/^models\//, ''));
            }
          }
        } catch (listErr: any) {
          console.warn('[TALA GOOGLE] Unable to fetch model list:', listErr?.message || listErr);
        }

        const errMsg = lastError?.message || 'Google AI Studio model candidate failed.';
        return res.status(404).json({
          error: `[GOOGLE MODEL REJECTED]: ${errMsg}`,
          availableModels
        });
      }

      return res.json({
        responseText,
        model: usedModel,
        provider: 'google',
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
