import { supabase, isSupabaseConfigured } from './supabase';

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt: string; completion: string };
  is_free?: boolean;
}

const DEFAULT_FALLBACK_MODELS: OpenRouterModel[] = [
  {
    id: 'openrouter/free',
    name: 'Free Models Router (OpenRouter)',
    description: 'Auto-selects the best available free model on OpenRouter',
    is_free: true,
  },
  {
    id: 'ollama/llama3.2',
    name: 'Ollama Local: Llama 3.2 (http://localhost:11434)',
    description: 'Runs locally on your machine via Ollama local server',
    is_free: true,
  },
  {
    id: 'ollama/mistral',
    name: 'Ollama Local: Mistral (http://localhost:11434)',
    description: 'Runs locally on your machine via Ollama local server',
    is_free: true,
  },
  {
    id: 'ollama/phi3',
    name: 'Ollama Local: Phi 3 (http://localhost:11434)',
    description: 'Lightweight local model running via Ollama',
    is_free: true,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Meta Llama 3.3 70B (Free OpenRouter)',
    description: 'High intelligence open weights model',
    is_free: true,
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 (Free OpenRouter)',
    description: 'Advanced reasoning model with step-by-step logic',
    is_free: true,
  }
];

export const openrouter = {
  fetchModels: async (): Promise<OpenRouterModel[]> => {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase.functions.invoke('tala-models');
        if (!error && data && Array.isArray(data.models)) {
          return data.models;
        }
      }
    } catch (e) {
      console.warn('Supabase edge function tala-models call failed, using fallback catalog:', e);
    }
    return DEFAULT_FALLBACK_MODELS;
  },

  sendChatPrompt: async (params: {
    prompt: string;
    model?: string;
    openrouterApiKey?: string;
    customApiKey?: string;
    ollamaHost?: string;
    history?: any[];
    systemInstruction?: string;
  }): Promise<{ responseText: string; model: string }> => {
    const selectedModel = params.model || 'openrouter/free';

    // Handle Local Ollama Machine Models
    if (selectedModel.startsWith('ollama') || selectedModel.includes('ollama')) {
      const host = (params.ollamaHost || 'http://localhost:11434').replace(/\/$/, '');
      const rawModelName = selectedModel.replace(/^ollama\//, '') || 'llama3.2';

      const messages = [];
      if (params.systemInstruction) {
        messages.push({ role: 'system', content: params.systemInstruction });
      }
      if (Array.isArray(params.history)) {
        for (const item of params.history) {
          messages.push({
            role: item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user',
            content: item.text || item.content || '',
          });
        }
      }
      messages.push({ role: 'user', content: params.prompt });

      try {
        // Attempt OpenAI-compatible Chat Completions endpoint on Ollama
        const res = await fetch(`${host}/v1/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: rawModelName,
            messages,
            temperature: 0.7,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const responseText = data?.choices?.[0]?.message?.content || 'No response generated from Ollama.';
          return { responseText, model: `Ollama Local (${rawModelName})` };
        }
      } catch (err) {
        // Direct Ollama native API fallback /api/chat
        try {
          const res2 = await fetch(`${host}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: rawModelName,
              messages,
              stream: false,
            }),
          });
          if (res2.ok) {
            const data2 = await res2.json();
            const responseText = data2?.message?.content || 'No response generated from Ollama.';
            return { responseText, model: `Ollama Local (${rawModelName})` };
          }
        } catch (err2) {
          throw new Error(`Unable to reach local Ollama server at ${host}. Please ensure Ollama is running ('ollama run ${rawModelName}').`);
        }
      }
      throw new Error(`Ollama model execution failed at ${host}.`);
    }

    // 1. Prefer Supabase Edge Function 'tala-chat' for OpenRouter
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.functions.invoke('tala-chat', {
        body: params,
      });

      if (error) {
        throw new Error(error.message || 'Supabase Edge Function tala-chat error');
      }
      if (data?.error) {
        throw new Error(data.error);
      }
      return data;
    }

    // 2. Client-side direct OpenRouter API call
    const directKey = params.openrouterApiKey || params.customApiKey;
    if (directKey) {
      const messages = [];
      if (params.systemInstruction) {
        messages.push({ role: 'system', content: params.systemInstruction });
      }
      if (Array.isArray(params.history)) {
        for (const item of params.history) {
          messages.push({
            role: item.role === 'model' || item.role === 'assistant' ? 'assistant' : 'user',
            content: item.text || item.content || '',
          });
        }
      }
      messages.push({ role: 'user', content: params.prompt });

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${directKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://baiaresort.com',
          'X-Title': 'TALA BAIA Resort Concierge',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || `OpenRouter API returned status ${res.status}`);
      }

      const data = await res.json();
      const responseText = data?.choices?.[0]?.message?.content || 'No response generated.';
      return { responseText, model: selectedModel };
    }

    throw new Error('Supabase is not connected and no client OpenRouter API Key was supplied.');
  },
};

