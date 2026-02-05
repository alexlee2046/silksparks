import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// ============ CORS 配置 ============

const ALLOWED_ORIGINS = [
  "https://silksparks.com",
  "https://www.silksparks.com",
  "http://localhost:3000",
];

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// ============ 类型定义 ============

interface UserBirthDataSummary {
  sunSign: string;
  moonSign?: string;
  risingSign?: string;
}

interface TarotCard {
  name: string;
  isReversed: boolean;
  position?: string; // "past" | "present" | "future" | "single"
  arcana?: string;
}

interface TarotPayload {
  cards: TarotCard[];
  question: string;
  spreadType?: string;
  userBirthData?: UserBirthDataSummary;
  historyContext?: string;
}

interface TarotFollowUpPayload {
  cards: TarotCard[];
  originalInterpretation: string;
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }>;
  followUpQuestion: string;
  userBirthData?: UserBirthDataSummary;
}

interface BirthChartPayload {
  name: string;
  planets: Record<string, string>;
  elements: Record<string, number>;
}

interface DailySparkPayload {
  sign?: string;
}

type AIPayload = TarotPayload | TarotFollowUpPayload | BirthChartPayload | DailySparkPayload;

interface AIRequest {
  type: "birth_chart" | "tarot" | "tarot_followup" | "daily_spark";
  payload: AIPayload;
  model?: string;
  locale?: "zh-CN" | "en-US";
  messages?: Array<{ role: string; content: string }>;
}

interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

interface AICallResult {
  text: string;
  usage?: TokenUsage;
}

// ============ 常量 ============

const REQUEST_TIMEOUT_MS = 30000; // 30 秒超时
const DEFAULT_DAILY_LIMIT = 50; // 每日请求限制 (认证用户)
const ANON_DAILY_LIMIT = 5; // 每日请求限制 (匿名用户)

/**
 * Hash IP address for privacy-preserving rate limiting
 * Uses a simple hash with daily salt to:
 * 1. Protect user privacy (no raw IPs stored)
 * 2. Rotate hashes daily (making tracking harder)
 */
function hashIP(ip: string): string {
  const today = new Date().toISOString().split("T")[0]; // Daily salt
  const input = `${ip}:${today}:silk-spark-salt`;
  // Simple hash using string manipulation (no crypto dependency)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `anon_${Math.abs(hash).toString(36)}`;
}

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

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

    // ============ 用户认证 + 速率限制 ============

    // 从 Authorization header 获取 user_id
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id ?? null;
    }

    // ============ 速率限制 ============

    // 获取客户端 IP (用于匿名用户限制)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";
    const ipHash = hashIP(clientIP);

    // 检查速率限制: 认证用户
    if (userId) {
      const { data: limitCheck } = await supabaseAdmin.rpc("check_ai_daily_limit", {
        p_user_id: userId,
        p_request_type: type,
        p_limit: DEFAULT_DAILY_LIMIT,
      });

      if (limitCheck === false) {
        console.warn(`[AI-Generate] Rate limit exceeded for user: ${userId}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Daily AI request limit exceeded. Please try again tomorrow.",
            errorCode: "RATE_LIMIT_EXCEEDED",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          },
        );
      }
    } else {
      // 检查速率限制: 匿名用户 (基于 IP 哈希)
      const { data: anonLimitCheck } = await supabaseAdmin.rpc("check_anon_rate_limit", {
        p_ip_hash: ipHash,
        p_request_type: type,
        p_limit: ANON_DAILY_LIMIT,
      });

      if (anonLimitCheck === false) {
        console.warn(`[AI-Generate] Anonymous rate limit exceeded for IP hash: ${ipHash}`);
        return new Response(
          JSON.stringify({
            success: false,
            error: "Anonymous request limit exceeded. Please sign in for more requests.",
            errorCode: "ANON_RATE_LIMIT_EXCEEDED",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          },
        );
      }

      // 记录匿名请求
      await supabaseAdmin.rpc("record_anon_request", {
        p_ip_hash: ipHash,
        p_request_type: type,
      });
    }

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

    console.log(`[AI-Generate] Request Type: ${type}, Locale: ${locale}, User: ${userId ?? "anonymous"}`);
    console.log(
      `[AI-Generate] Keys present - OpenRouter: ${!!openRouterKey}, Gemini: ${!!geminiKey}`,
    );

    let systemPrompt = "";
    let userPrompt = "";

    if (messages && Array.isArray(messages) && messages.length > 0) {
      console.log("[AI-Generate] Using provided 'messages' from request");
      const sysMsg = messages.find((m: { role: string }) => m.role === "system");
      const usrMsg = messages.find((m: { role: string }) => m.role === "user");
      systemPrompt = sysMsg ? sanitizeInput(sysMsg.content, 2000) : "";
      userPrompt = usrMsg ? sanitizeInput(usrMsg.content, 2000) : "";
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

    let result: AICallResult = { text: "" };
    let usedProvider = "";
    let usedModel = "";
    let isFallback = false;

    // Get configured provider (default to openrouter for backward compatibility)
    const configuredProvider = config.provider || "openrouter";
    console.log(`[AI-Generate] Configured provider: ${configuredProvider}`);

    // STRATEGY: Use configured provider, fallback to the other if available
    if (configuredProvider === "openrouter" && openRouterKey) {
      try {
        console.log("[AI-Generate] Attempting OpenRouter Provider...");
        const targetModel = model || config.model;
        if (!targetModel) {
          throw new Error("No model configured. Please set 'model' in Admin AI Config.");
        }
        result = await callOpenRouter(
          openRouterKey,
          targetModel,
          systemPrompt,
          userPrompt,
        );
        usedProvider = "openrouter";
        usedModel = targetModel;
      } catch (error: any) {
        console.warn(`[AI-Generate] OpenRouter Failed: ${error.message}`);

        // Fallback to Gemini if available
        if (geminiKey) {
          console.log("[AI-Generate] Falling back to Gemini Direct Provider...");
          const fallbackModel = config.gemini_model || "gemini-1.5-flash";
          result = await callGeminiDirect(
            geminiKey,
            systemPrompt,
            userPrompt,
            fallbackModel,
          );
          usedProvider = "gemini_direct";
          usedModel = fallbackModel;
          isFallback = true;
        } else {
          throw error;
        }
      }
    } else if (configuredProvider === "gemini" && geminiKey) {
      try {
        console.log("[AI-Generate] Using Gemini Direct Provider (Primary)...");
        const geminiModel = model || config.gemini_model || "gemini-1.5-flash";
        result = await callGeminiDirect(geminiKey, systemPrompt, userPrompt, geminiModel);
        usedProvider = "gemini_direct";
        usedModel = geminiModel;
      } catch (error: any) {
        console.warn(`[AI-Generate] Gemini Failed: ${error.message}`);

        // Fallback to OpenRouter if available
        if (openRouterKey) {
          console.log("[AI-Generate] Falling back to OpenRouter Provider...");
          const targetModel = config.model || "google/gemini-2.0-flash-exp:free";
          result = await callOpenRouter(
            openRouterKey,
            targetModel,
            systemPrompt,
            userPrompt,
          );
          usedProvider = "openrouter";
          usedModel = targetModel;
          isFallback = true;
        } else {
          throw error;
        }
      }
    } else if (openRouterKey) {
      // Fallback: configured provider key missing, try OpenRouter
      console.log("[AI-Generate] Using OpenRouter (fallback - configured key missing)...");
      const targetModel = model || config.model || "google/gemini-2.0-flash-exp:free";
      result = await callOpenRouter(openRouterKey, targetModel, systemPrompt, userPrompt);
      usedProvider = "openrouter";
      usedModel = targetModel;
    } else if (geminiKey) {
      // Fallback: configured provider key missing, try Gemini
      console.log("[AI-Generate] Using Gemini (fallback - configured key missing)...");
      const geminiModel = config.gemini_model || "gemini-1.5-flash";
      result = await callGeminiDirect(geminiKey, systemPrompt, userPrompt, geminiModel);
      usedProvider = "gemini_direct";
      usedModel = geminiModel;
    } else {
      throw new Error(
        "No AI API Keys configured. Please set AI keys in Admin System Settings.",
      );
    }

    const latencyMs = Date.now() - startTime;

    // ============ 记录使用量 ============
    if (userId) {
      await supabaseAdmin.from("ai_usage_logs").insert({
        user_id: userId,
        request_type: type,
        tokens_input: result.usage?.input ?? 0,
        tokens_output: result.usage?.output ?? 0,
        model: usedModel,
        provider: usedProvider,
        latency_ms: latencyMs,
        is_fallback: isFallback,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: { text: result.text },
        meta: {
          provider: usedProvider,
          model: usedModel,
          latencyMs,
          isFallback,
          tokenUsage: result.usage,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[AI-Generate] Global Error:", message);
    return new Response(
      JSON.stringify({ error: "AI service temporarily unavailable" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

/**
 * 带超时的 fetch 包装器
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Call OpenRouter API with Retry Logic
 * Returns text and token usage
 */
async function callOpenRouter(
  apiKey: string,
  model: string,
  system: string,
  user: string,
): Promise<AICallResult> {
  let attempts = 0;
  const maxAttempts = 2; // Reduced attempts to fail faster for fallback

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await fetchWithTimeout(
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
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
          throw new Error("OpenRouter returned an empty or invalid response.");
        }

        // Extract token usage from OpenRouter response
        const usage = data?.usage;
        const tokenUsage: TokenUsage | undefined = usage
          ? {
              input: usage.prompt_tokens ?? 0,
              output: usage.completion_tokens ?? 0,
              total: usage.total_tokens ?? 0,
            }
          : undefined;

        return { text: content, usage: tokenUsage };
      }

      // Handle Rate Limits (429) -> Immediate Throw to trigger fallback if available
      if (response.status === 429) {
        const errorText = await response.text();
        throw new Error(`Rate limit hit (429): ${errorText}`);
      }

      const error = await response.text();
      throw new Error(`OpenRouter API Error (${response.status}): ${error}`);
    } catch (error: unknown) {
      // 超时错误直接抛出，不重试
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`OpenRouter request timed out after ${REQUEST_TIMEOUT_MS}ms`);
      }
      if (attempts >= maxAttempts) throw error;
      // Delay before retry (if not 429, maybe network?)
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  throw new Error("OpenRouter failed after retries");
}

/**
 * Call Google Gemini Direct API
 * 使用原生 systemInstruction 格式
 * Returns text and token usage
 */
async function callGeminiDirect(
  apiKey: string,
  system: string,
  user: string,
  model: string = "gemini-1.5-flash",
): Promise<AICallResult> {
  const baseUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const endpoint = `${baseUrl}?key=${apiKey}`;

  const response = await fetchWithTimeout(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      // 使用 Gemini 原生 systemInstruction
      systemInstruction: {
        parts: [{ text: system }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: user }],
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

  // 安全地解析响应结构
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("[AI-Generate] Unexpected Gemini response:", JSON.stringify(data));
    throw new Error("Gemini returned an unexpected response structure");
  }

  // Extract token usage from Gemini usageMetadata
  const usageMetadata = data?.usageMetadata;
  const tokenUsage: TokenUsage | undefined = usageMetadata
    ? {
        input: usageMetadata.promptTokenCount ?? 0,
        output: usageMetadata.candidatesTokenCount ?? 0,
        total: usageMetadata.totalTokenCount ?? 0,
      }
    : undefined;

  return { text, usage: tokenUsage };
}

/**
 * 输入清洗 - 防止 prompt 注入
 */
function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== "string") return "";

  // 移除控制字符 (使用 Unicode 范围避免 eslint 警告)
  // eslint-disable-next-line no-control-regex
  const controlCharsRegex = /[\u0000-\u001F\u007F]/g;

  return input
    // 移除潜在的 prompt 注入模式 (英文)
    .replace(/ignore\s+(all\s+)?(previous\s+)?instructions?/gi, "[filtered]")
    .replace(/you\s+are\s+(now\s+)?a/gi, "[filtered]")
    .replace(/system\s*:/gi, "[filtered]")
    .replace(/assistant\s*:/gi, "[filtered]")
    // 中文 prompt 注入模式
    .replace(/忽略(之前|前面)?(的)?(所有)?(指令|说明|提示)/gi, "[filtered]")
    .replace(/忘记(之前|前面)?(的)?(所有)?(指令|说明|提示)/gi, "[filtered]")
    .replace(/无视(之前|前面)?(的)?(所有)?(指令|说明|提示)/gi, "[filtered]")
    .replace(/你(现在)?是(一个)?/gi, "[filtered]")
    .replace(/系统(提示|指令)\s*[:：]/gi, "[filtered]")
    .replace(/越狱(模式)?/gi, "[filtered]")
    .replace(/扮演(一个)?/gi, "[filtered]")
    .replace(/【系统】/g, "[filtered]")
    .replace(/【助手】/g, "[filtered]")
    .replace(/\[系统\]/g, "[filtered]")
    .replace(/\[助手\]/g, "[filtered]")
    // 移除控制字符
    .replace(controlCharsRegex, "")
    // 限制长度
    .slice(0, maxLength)
    .trim();
}

/**
 * Prompt Builder
 */
function buildPrompts(type: string, payload: AIPayload, locale: string) {
  const isZH = locale === "zh-CN";

  if (type === "tarot") {
    const tarotPayload = payload as TarotPayload;
    const cardDescriptions = tarotPayload.cards
      .map((c) => {
        const position = c.position ? ` [${c.position}]` : "";
        const reversed = c.isReversed ? " (Reversed)" : " (Upright)";
        return `${sanitizeInput(c.name, 50)}${reversed}${position}`;
      })
      .join("; ");
    const question = sanitizeInput(tarotPayload.question, 200);
    const spreadType = tarotPayload.spreadType || "single";

    // Build birth data context if available
    let birthContext = "";
    if (tarotPayload.userBirthData) {
      const bd = tarotPayload.userBirthData;
      birthContext = isZH
        ? `\n求问者星盘: 太阳${bd.sunSign}${bd.moonSign ? `, 月亮${bd.moonSign}` : ""}${bd.risingSign ? `, 上升${bd.risingSign}` : ""}`
        : `\nSeeker's astrology: Sun in ${bd.sunSign}${bd.moonSign ? `, Moon in ${bd.moonSign}` : ""}${bd.risingSign ? `, Rising ${bd.risingSign}` : ""}`;
    }

    // Build history context if available
    let historyContext = "";
    if (tarotPayload.historyContext) {
      historyContext = isZH
        ? `\n近期牌面趋势: ${sanitizeInput(tarotPayload.historyContext, 300)}`
        : `\nRecent card trends: ${sanitizeInput(tarotPayload.historyContext, 300)}`;
    }

    const system = isZH
      ? `你是一位精通塔罗牌解读的神秘主义专家，擅长结合求问者的星座特质给出个性化解读。

输出格式要求（JSON）:
{
  "coreMessage": "一句话核心启示（20字以内）",
  "interpretation": "详细解读（结合牌面象征、位置含义、正逆位影响）",
  "actionAdvice": "具体可执行的行动建议（2-3条）",
  "luckyElements": {
    "color": "幸运颜色",
    "number": "幸运数字(1-9)",
    "direction": "幸运方位",
    "crystal": "推荐水晶"
  }
}

解读风格：充满共情心，富有洞察力，避免过于负面的表述。`
      : `You are a mystical Tarot reader who combines card symbolism with the seeker's astrological profile for personalized readings.

Output format (JSON):
{
  "coreMessage": "One-sentence core insight (max 20 words)",
  "interpretation": "Detailed reading (card symbolism, positional meaning, upright/reversed significance)",
  "actionAdvice": "Specific actionable advice (2-3 items)",
  "luckyElements": {
    "color": "Lucky color",
    "number": "Lucky number (1-9)",
    "direction": "Lucky direction",
    "crystal": "Recommended crystal"
  }
}

Style: Empathetic, insightful, avoid overly negative phrasing.`;

    const user = isZH
      ? `牌阵类型: ${spreadType === "single" ? "单牌" : spreadType === "three-card" ? "三牌阵(过去-现在-未来)" : spreadType}
求问者的问题: "${question}"
抽到的牌: ${cardDescriptions}${birthContext}${historyContext}

请根据以上信息给出JSON格式的解读。`
      : `Spread type: ${spreadType === "single" ? "Single card" : spreadType === "three-card" ? "Three-card (Past-Present-Future)" : spreadType}
Seeker's question: "${question}"
Drawn cards: ${cardDescriptions}${birthContext}${historyContext}

Provide the reading in JSON format.`;

    return { systemPrompt: system, userPrompt: user };
  }

  if (type === "tarot_followup") {
    const followUpPayload = payload as TarotFollowUpPayload;
    const cardDescriptions = followUpPayload.cards
      .map((c) => {
        const position = c.position ? ` [${c.position}]` : "";
        const reversed = c.isReversed ? " (Reversed)" : " (Upright)";
        return `${sanitizeInput(c.name, 50)}${reversed}${position}`;
      })
      .join("; ");

    // Build conversation history
    const conversationStr = followUpPayload.conversationHistory
      .map((m) => `${m.role === "user" ? "Q" : "A"}: ${sanitizeInput(m.content, 300)}`)
      .join("\n");

    // Build birth data context if available
    let birthContext = "";
    if (followUpPayload.userBirthData) {
      const bd = followUpPayload.userBirthData;
      birthContext = isZH
        ? `\n求问者星盘: 太阳${bd.sunSign}${bd.moonSign ? `, 月亮${bd.moonSign}` : ""}${bd.risingSign ? `, 上升${bd.risingSign}` : ""}`
        : `\nSeeker's astrology: Sun in ${bd.sunSign}${bd.moonSign ? `, Moon in ${bd.moonSign}` : ""}${bd.risingSign ? `, Rising ${bd.risingSign}` : ""}`;
    }

    const system = isZH
      ? `你是一位精通塔罗牌解读的神秘主义专家。求问者已完成一次塔罗解读，现在有追问。
请基于原始牌面和之前的解读上下文，回答追问。回复应自然流畅，像是延续之前的对话。
不需要重复介绍牌面，直接回答问题即可。保持神秘而温暖的语调。`
      : `You are a mystical Tarot reader. The seeker has completed a reading and now has follow-up questions.
Answer based on the original cards and previous context. Be natural and conversational.
Don't repeat card introductions, answer directly. Maintain a mystical yet warm tone.`;

    const user = isZH
      ? `原始牌面: ${cardDescriptions}${birthContext}

原始解读: ${sanitizeInput(followUpPayload.originalInterpretation, 500)}

${conversationStr ? `之前的对话:\n${conversationStr}\n` : ""}
追问: ${sanitizeInput(followUpPayload.followUpQuestion, 200)}

请回答这个追问。`
      : `Original cards: ${cardDescriptions}${birthContext}

Original reading: ${sanitizeInput(followUpPayload.originalInterpretation, 500)}

${conversationStr ? `Previous conversation:\n${conversationStr}\n` : ""}
Follow-up question: ${sanitizeInput(followUpPayload.followUpQuestion, 200)}

Please answer this follow-up question.`;

    return { systemPrompt: system, userPrompt: user };
  }

  if (type === "birth_chart") {
    const chartPayload = payload as BirthChartPayload;
    const name = sanitizeInput(chartPayload.name, 50);

    const system = isZH
      ? "你是一位结合现代占星术与中国五行理论的命理大师。提供精准、激励人心且具有哲学深度的解读。"
      : "You are a master astrologer combining Western astrology with Eastern Five Elements. Provide accurate, inspiring, and philosophical insights.";
    const user = isZH
      ? `用户: ${name}。行星位置: ${JSON.stringify(chartPayload.planets)}。五行分布: ${JSON.stringify(chartPayload.elements)}。请根据这些数据提供性格深度剖析和未来运势建议。`
      : `User: ${name}. Planets: ${JSON.stringify(chartPayload.planets)}. Elements: ${JSON.stringify(chartPayload.elements)}. Provide deep character analysis and future guidance.`;
    return { systemPrompt: system, userPrompt: user };
  }

  if (type === "daily_spark") {
    const sparkPayload = payload as DailySparkPayload;
    const sign = sanitizeInput(sparkPayload.sign || "General", 20);

    const system = isZH
      ? "你是一位温柔的每日启示者。你的话语能为处于困惑中的人指引方向。"
      : "You are a gentle daily oracle. Your words guide those in need of light.";
    const user = isZH
      ? `用户的星座是: ${sign}。请给出一句充满智慧、简洁有力的今日启示（20字以内）。`
      : `Zodiac sign: ${sign}. Provide a wise, concise daily inspiration (max 20 words).`;
    return { systemPrompt: system, userPrompt: user };
  }

  throw new Error(`Invalid request type: ${type}`);
}
