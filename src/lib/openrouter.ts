import { supabase, isSupabaseConfigured } from './supabase';
import { knowledgeService } from '../services/knowledgeService';
import { requestService } from '../services/requestService';
import { GuestRequest, GuestRequestCategory } from '../types';

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

function generateGroundedLocalResponse(prompt: string, contextRoom = 'Villa 101'): { responseText: string; model: string } {
  const query = prompt.toLowerCase();

  // 1. Agentic Housekeeping Dispatch
  if (
    query.includes('towel') ||
    query.includes('linen') ||
    query.includes('pillow') ||
    query.includes('blanket') ||
    query.includes('toiletries') ||
    query.includes('shampoo') ||
    query.includes('soap') ||
    query.includes('water bottle') ||
    query.includes('clean room') ||
    query.includes('housekeeping')
  ) {
    const newReq: GuestRequest = {
      id: `req-${Date.now()}`,
      title: 'Housekeeping & Amenities Request',
      description: `Guest requested: "${prompt}"`,
      category: 'housekeeping',
      guestLabel: 'Guest',
      room: contextRoom,
      status: 'new',
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    requestService.saveRequest(newReq);
    return {
      responseText: `Mabuhay! I would be delighted to take care of that for you. I've logged a housekeeping request for your villa for ${prompt}, and our team will deliver it shortly.`,
      model: 'TALA Local Grounded Brain (Agentic Dispatch)'
    };
  }

  // 2. Agentic Maintenance Dispatch
  if (
    query.includes('aircon') ||
    query.includes('ac not') ||
    query.includes('leaking') ||
    query.includes('hot water') ||
    query.includes('shower') ||
    query.includes('broken') ||
    query.includes('plumbing') ||
    query.includes('light bulb') ||
    query.includes('electricity') ||
    query.includes('outlet')
  ) {
    const newReq: GuestRequest = {
      id: `req-${Date.now()}`,
      title: 'Maintenance Engineering Request',
      description: `Guest reported: "${prompt}"`,
      category: 'maintenance',
      guestLabel: 'Guest',
      room: contextRoom,
      status: 'new',
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    requestService.saveRequest(newReq);
    return {
      responseText: `I apologize for any discomfort! I have immediately notified our on-duty resort engineering team. A technician will visit your villa in just a few minutes to assist you.`,
      model: 'TALA Local Grounded Brain (Agentic Dispatch)'
    };
  }

  // 3. Agentic Dining & Room Service
  if (
    query.includes('order food') ||
    query.includes('room service') ||
    query.includes('breakfast in bed') ||
    query.includes('ice bucket') ||
    query.includes('cocktail') ||
    query.includes('dinner reservation')
  ) {
    const newReq: GuestRequest = {
      id: `req-${Date.now()}`,
      title: 'Dining / Room Service Order',
      description: `Guest order: "${prompt}"`,
      category: 'food',
      guestLabel: 'Guest',
      room: contextRoom,
      status: 'new',
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    requestService.saveRequest(newReq);
    return {
      responseText: `Wonderful choice! I've placed your order directly with the kitchen at BAIA Ocean Table. It will be prepared fresh and delivered to your villa in about 20 minutes.`,
      model: 'TALA Local Grounded Brain (Agentic Dispatch)'
    };
  }

  // 4. Agentic Transportation & Buggy
  if (
    query.includes('buggy') ||
    query.includes('golf cart') ||
    query.includes('ride to') ||
    query.includes('airport shuttle') ||
    query.includes('van transfer') ||
    query.includes('airport pickup') ||
    query.includes('flight')
  ) {
    const newReq: GuestRequest = {
      id: `req-${Date.now()}`,
      title: 'Transportation / Buggy Request',
      description: `Guest request: "${prompt}"`,
      category: 'transportation',
      guestLabel: 'Guest',
      room: contextRoom,
      status: 'new',
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    requestService.saveRequest(newReq);
    return {
      responseText: `With pleasure! I have arranged a resort transfer for you. A friendly driver will arrive at your villa entrance in about 5 minutes.`,
      model: 'TALA Local Grounded Brain (Agentic Dispatch)'
    };
  }

  // 5. Grounded RAG Knowledge Retrieval
  const snippets = knowledgeService.searchKnowledge(prompt, 2);
  if (snippets && snippets.trim().length > 0) {
    const cleanSnippet = snippets
      .replace(/\[Source:[^\]]+\]:\s*/g, '')
      .replace(/Question:[^\n]+\n/g, '')
      .replace(/Keywords:[^\n]+\n/g, '')
      .replace(/Confirmed Answer:\s*/g, '')
      .split('\n\n')[0]
      .trim();

    return {
      responseText: cleanSnippet.length > 250 ? cleanSnippet.slice(0, 250) + '...' : cleanSnippet,
      model: 'TALA Local Grounded Brain (Grounded RAG)'
    };
  }

  // 6. Direct Operational Questions
  if (query.includes('wifi') || query.includes('wi-fi') || query.includes('internet') || query.includes('password')) {
    return {
      responseText: `Our complimentary high-speed fiber Wi-Fi is "BAIA_Guest_5G" and the password is "LongBeachParadise2026". It is available throughout the resort and on the beach.`,
      model: 'TALA Local Grounded Brain'
    };
  }

  if (query.includes('breakfast') || query.includes('morning food')) {
    return {
      responseText: `Breakfast is served daily at BAIA Ocean Table from 6:30 AM to 10:30 AM with fresh tropical fruit, bakery delights, and Filipino specialties.`,
      model: 'TALA Local Grounded Brain'
    };
  }

  if (query.includes('check-in') || query.includes('checkin') || query.includes('check-out') || query.includes('checkout')) {
    return {
      responseText: `Check-in begins at 2:00 PM and check-out is at 12:00 PM. Please let me know if you would like complimentary luggage storage or a late check-out arrangement!`,
      model: 'TALA Local Grounded Brain'
    };
  }

  // 7. Conversational Warm Fallback
  return {
    responseText: `Mabuhay! I am TALA, your BAIA Resort Palawan concierge. How can I make your stay wonderful with villa services, dining, or island adventures today?`,
    model: 'TALA Local Grounded Brain'
  };
}

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
          console.warn(`Local Ollama server unreachable at ${host}, falling back to Grounded Local Brain.`);
        }
      }
    }

    // 1. Prefer Supabase Edge Function 'tala-chat' for OpenRouter
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.functions.invoke('tala-chat', {
          body: params,
        });

        if (!error && data && data.responseText) {
          return data;
        }
      } catch (e) {
        console.warn('Supabase edge function tala-chat call failed, checking client key or local brain:', e);
      }
    }

    // 2. Client-side direct OpenRouter API call
    const directKey = params.openrouterApiKey || params.customApiKey;
    if (directKey && directKey.trim().length > 0) {
      try {
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
            'Authorization': `Bearer ${directKey.trim()}`,
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

        if (res.ok) {
          const data = await res.json();
          const responseText = data?.choices?.[0]?.message?.content || 'No response generated.';
          return { responseText, model: selectedModel };
        }
      } catch (err) {
        console.warn('Direct OpenRouter call failed, falling back to local grounded concierge:', err);
      }
    }

    // 3. Resilient Grounded Local Brain Fallback (Zero crash, Agentic RAG)
    return generateGroundedLocalResponse(params.prompt);
  },
};

