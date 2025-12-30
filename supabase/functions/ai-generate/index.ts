import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AIRequest {
  type: "birth_chart" | "tarot" | "daily_spark";
  payload: any;
  model?: string;
  locale?: "zh-CN" | "en-US";
  messages?: Array<{ role: string; content: string }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      type,
      payload,
      messages,
      model,
      locale = "zh-CN",
    } = (await req.json()) as AIRequest;

    // Initialize Admin Client to fetch secrets from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch AI Config from DB
    const { data: settingsData } = await supabaseAdmin
      .from("system_settings")
      .select("value")
      .eq("key", "ai_config")
      .single();

    const config = settingsData?.value || {};

    // Prioritize DB keys (for Admin testing), then Env vars
    const openRouterKey =
      config.openrouter_key || Deno.env.get("OPENROUTER_API_KEY");
    const geminiKey = config.gemini_key || Deno.env.get("GEMINI_API_KEY");

    console.log(`[AI-Generate] Request Type: ${type}, Locale: ${locale}`);
    console.log(
      `[AI-Generate] Keys present - OpenRouter: ${!!openRouterKey}, Gemini: ${!!geminiKey}`,
    );

    let systemPrompt = "";
    let userPrompt = "";

    if (messages && Array.isArray(messages) && messages.length > 0) {
      console.log("[AI-Generate] Using provided 'messages' from request");
      const sysMsg = messages.find((m: any) => m.role === "system");
      const usrMsg = messages.find((m: any) => m.role === "user");
      systemPrompt = sysMsg ? sysMsg.content : "";
      userPrompt = usrMsg ? usrMsg.content : "";
    } else {
      console.log("[AI-Generate] Building prompts internally based on payload");
      if (!payload && type !== "daily_spark") {
        throw new Error(
          "Payload is required when 'messages' are not provided.",
        );
      }
      const prompts = buildPrompts(type, payload, locale);
      systemPrompt = prompts.systemPrompt;
      userPrompt = prompts.userPrompt;
    }

    let resultText = "";
    let usedProvider = "";
    let usedModel = "";

    // STRATEGY: Try OpenRouter -> Fallback to Gemini Direct
    if (openRouterKey) {
      try {
        console.log("[AI-Generate] Attempting OpenRouter Provider...");
        // Use configured model or default
        const targetModel =
          model || config.model || "google/gemini-2.0-flash-exp:free";
        resultText = await callOpenRouter(
          openRouterKey,
          targetModel,
          systemPrompt,
          userPrompt,
        );
        usedProvider = "openrouter";
        usedModel = targetModel;
      } catch (error: any) {
        console.warn(`[AI-Generate] OpenRouter Failed: ${error.message}`);

        // Fallback check
        if (geminiKey) {
          console.log(
            "[AI-Generate] Falling back to Gemini Direct Provider...",
          );
          resultText = await callGeminiDirect(
            geminiKey,
            systemPrompt,
            userPrompt,
          );
          usedProvider = "gemini_direct";
          usedModel = "gemini-1.5-flash";
        } else {
          // No fallback available
          throw error;
        }
      }
    } else if (geminiKey) {
      console.log("[AI-Generate] Using Gemini Direct Provider (Primary)...");
      resultText = await callGeminiDirect(geminiKey, systemPrompt, userPrompt);
      usedProvider = "gemini_direct";
      usedModel = "gemini-1.5-flash";
    } else {
      throw new Error(
        "No AI API Keys configured. Please set AI keys in Admin System Settings.",
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { text: resultText },
        meta: {
          provider: usedProvider,
          model: usedModel,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("[AI-Generate] Global Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * Call OpenRouter API with Retry Logic
 */
async function callOpenRouter(
  apiKey: string,
  model: string,
  system: string,
  user: string,
) {
  let attempts = 0;
  const maxAttempts = 2; // Reduced attempts to fail faster for fallback

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://silksparks.com",
            "X-Title": "Silk & Spark AI",
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: system },
              { role: "user", content: user },
            ],
            temperature: 0.7,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (!data.choices || data.choices.length === 0) {
          throw new Error("OpenRouter returned an empty response.");
        }
        return data.choices[0].message.content;
      }

      // Handle Rate Limits (429) -> Immediate Throw to trigger fallback if available
      if (response.status === 429) {
        const errorText = await response.text();
        throw new Error(`Rate limit hit (429): ${errorText}`);
      }

      const error = await response.text();
      throw new Error(`OpenRouter API Error (${response.status}): ${error}`);
    } catch (error) {
      if (attempts >= maxAttempts) throw error;
      // Delay before retry (if not 429, maybe network?)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("OpenRouter failed after retries");
}

/**
 * Call Google Gemini Direct API
 */
async function callGeminiDirect(apiKey: string, system: string, user: string) {
  const baseUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
  const endpoint = `${baseUrl}?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${system}\n\nUser Request: ${user}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    const message = errorData?.error?.message || "Unknown Gemini error";
    throw new Error(`Gemini Direct API Error (${response.status}): ${message}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Prompt Builder
 */
function buildPrompts(type: string, payload: any, locale: string) {
  const isZH = locale === "zh-CN";

  if (type === "tarot") {
    const cardNames = payload.cards
      .map((c: any) => `${c.name}${c.isReversed ? " (Reversed)" : ""}`)
      .join(", ");
    const system = isZH
      ? "你是一位精通塔罗牌解读的神秘主义专家。请根据抽到的牌面给出深刻、直觉性的解读。回复应充满共情心，富有洞察力。"
      : "You are a mystical Tarot reader. Provide deep, intuitive interpretations for the drawn cards. Be empathetic and insightful.";
    const user = isZH
      ? `求问者的问题是: "${payload.question}"。抽到的牌是: ${cardNames}。请结合这些牌给出详细分析、背景意义和具体的行动建议。`
      : `Seeker's Question: "${payload.question}". Drawn Cards: ${cardNames}. Provide detailed analysis and actionable advice.`;
    return { systemPrompt: system, userPrompt: user };
  }

  if (type === "birth_chart") {
    const system = isZH
      ? "你是一位结合现代占星术与中国五行理论的命理大师。提供精准、激励人心且具有哲学深度的解读。"
      : "You are a master astrologer combining Western astrology with Eastern Five Elements. Provide accurate, inspiring, and philosophical insights.";
    const user = isZH
      ? `用户: ${payload.name}。行星位置: ${JSON.stringify(payload.planets)}。五行分布: ${JSON.stringify(payload.elements)}。请根据这些数据提供性格深度剖析和未来运势建议。`
      : `User: ${payload.name}. Planets: ${JSON.stringify(payload.planets)}. Elements: ${JSON.stringify(payload.elements)}. Provide deep character analysis and future guidance.`;
    return { systemPrompt: system, userPrompt: user };
  }

  if (type === "daily_spark") {
    const system = isZH
      ? "你是一位温柔的每日启示者。你的话语能为处于困惑中的人指引方向。"
      : "You are a gentle daily oracle. Your words guide those in need of light.";
    const user = isZH
      ? `用户的星座是: ${payload.sign}。请给出一句充满智慧、简洁有力的今日启示（20字以内）。`
      : `Zodiac sign: ${payload.sign}. Provide a wise, concise daily inspiration (max 20 words).`;
    return { systemPrompt: system, userPrompt: user };
  }

  throw new Error(`Invalid request type: ${type}`);
}
