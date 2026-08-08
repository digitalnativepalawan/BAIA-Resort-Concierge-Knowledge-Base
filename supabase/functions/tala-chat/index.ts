import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { prompt, model, history, systemInstruction, openrouterApiKey } = body;

    const apiKey = openrouterApiKey || Deno.env.get("OPENROUTER_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OPENROUTER_API_KEY is not configured on Supabase Edge Function secrets." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const messages = [];

    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }

    if (Array.isArray(history)) {
      for (const item of history) {
        messages.push({
          role: item.role === "model" || item.role === "assistant" ? "assistant" : "user",
          content: item.text || item.content || "",
        });
      }
    }

    messages.push({ role: "user", content: prompt });

    const selectedModel = model || "openrouter/free";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://baiaresort.com",
        "X-Title": "TALA BAIA Resort Concierge",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `OpenRouter error (${response.status}): ${errorText}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const responseText = data?.choices?.[0]?.message?.content || "No response text generated.";

    return new Response(
      JSON.stringify({
        responseText,
        model: selectedModel,
        provider: "openrouter",
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal Edge Function Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
