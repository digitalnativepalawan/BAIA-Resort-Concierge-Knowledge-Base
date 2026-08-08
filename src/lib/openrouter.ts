export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: { prompt: string; completion: string };
  is_free?: boolean;
}

export const openrouter = {
  fetchModels: async (): Promise<OpenRouterModel[]> => {
    try {
      const res = await fetch('/api/models');
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      return data.models || [];
    } catch (e) {
      console.warn('Failed to fetch models from server, returning fallback:', e);
      return [
        {
          id: 'openrouter/free',
          name: 'OpenRouter: Free Router',
          description: 'Auto-routes queries to top-performing zero-cost models.',
          is_free: true,
        },
      ];
    }
  },

  sendChatPrompt: async (params: {
    prompt: string;
    model?: string;
    openrouterApiKey?: string;
    customApiKey?: string;
    history?: any[];
    systemInstruction?: string;
  }): Promise<{ responseText: string; model: string }> => {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Network response error' }));
      throw new Error(err.error || `Server responded with ${res.status}`);
    }

    return await res.json();
  },
};
