import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_MODELS = [
  {
    id: 'openrouter/free',
    name: 'Free Models Router (OpenRouter)',
    description: 'Auto-selects the best available free model on OpenRouter',
    context_length: 128000,
    pricing: { prompt: '0', completion: '0' }
  },
  {
    id: 'ollama/llama3.2',
    name: 'Ollama Local: Llama 3.2 (http://localhost:11434)',
    description: 'Runs locally on your machine via Ollama local server',
    context_length: 128000,
    pricing: { prompt: '0', completion: '0' }
  },
  {
    id: 'ollama/mistral',
    name: 'Ollama Local: Mistral (http://localhost:11434)',
    description: 'Runs locally on your machine via Ollama local server',
    context_length: 32768,
    pricing: { prompt: '0', completion: '0' }
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct:free',
    name: 'Meta Llama 3.3 70B (Free OpenRouter)',
    description: 'High intelligence open weights model',
    context_length: 131072,
    pricing: { prompt: '0', completion: '0' }
  },
  {
    id: 'deepseek/deepseek-r1:free',
    name: 'DeepSeek R1 (Free OpenRouter)',
    description: 'Advanced reasoning model with step-by-step logic',
    context_length: 16384,
    pricing: { prompt: '0', completion: '0' }
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl:free',
    name: 'NVIDIA Nemotron Nano 12B (Free OpenRouter)',
    description: 'NVIDIA optimized lightweight vision-language model',
    context_length: 128000,
    pricing: { prompt: '0', completion: '0' }
  },
  {
    id: 'qwen/qwen-2.5-72b-instruct:free',
    name: 'Qwen 2.5 72B Instruct (Free OpenRouter)',
    description: 'Strong multilingual knowledge model',
    context_length: 32768,
    pricing: { prompt: '0', completion: '0' }
  }
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENROUTER_API_KEY");
    if (apiKey) {
      const res = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { "Authorization": `Bearer ${apiKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.data)) {
          const freeModels = data.data
            .filter((m: any) => m.id?.endsWith(':free') || m.id === 'openrouter/free')
            .map((m: any) => ({
              id: m.id,
              name: m.name || m.id,
              description: m.description || '',
              context_length: m.context_length || 16384,
              pricing: m.pricing || { prompt: '0', completion: '0' }
            }));

          if (freeModels.length > 0) {
            return new Response(
              JSON.stringify({ models: freeModels }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ models: DEFAULT_MODELS }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ models: DEFAULT_MODELS }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
