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
    name: 'Free Models Router',
    description: 'Auto-selects the best available free model on OpenRouter',
    is_free: true,
  },
  {
    id: 'google/gemini-2.5-flash:free',
    name: 'Google Gemini 2.5 Flash (Free)',
    description: 'Fast, highly accurate multimodal AI model',
    is_free: true,
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Meta Llama 3.3 70B (Free)',
    description: 'High intelligence open weights model',
    is_free: true,
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 (Free)',
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
    history?: any[];
    systemInstruction?: string;
  }): Promise<{ responseText: string; model: string }> => {
    // 1. Prefer Supabase Edge Function 'tala-chat'
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

    // 2. Client-side fallback to direct OpenRouter API if API key provided in settings
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
          model: params.model || 'openrouter/free',
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
      return { responseText, model: params.model || 'openrouter/free' };
    }

    throw new Error('Supabase is not connected and no client OpenRouter API Key was supplied.');
  },
};

