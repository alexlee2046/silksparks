import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabase";

/// <reference types="vite/client" />
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.warn("Gemini API Key is missing. AI features will not work.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Cache for settings to avoid fetching on every call
let aiConfigCache: {
  model: string;
  temperature: number;
  max_tokens: number;
} | null = null;
let aiPromptsCache: {
  daily_spark: string;
  tarot_interpretation: string;
  birth_chart_analysis: string;
} | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60 * 1000; // 1 minute cache

async function getAISettings() {
  const now = Date.now();
  if (aiConfigCache && aiPromptsCache && now - lastFetchTime < CACHE_TTL) {
    return { config: aiConfigCache, prompts: aiPromptsCache };
  }

  try {
    const { data: configData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "ai_config")
      .single();

    const { data: promptsData } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "ai_prompts")
      .single();

    if (configData) aiConfigCache = configData.value;
    if (promptsData) aiPromptsCache = promptsData.value;
    lastFetchTime = now;

    return { config: aiConfigCache, prompts: aiPromptsCache };
  } catch (error) {
    console.warn("Failed to fetch AI settings, using defaults:", error);
    // Return defaults if fetch fails
    return {
      config: { model: "gemini-pro", temperature: 0.7, max_tokens: 2048 },
      prompts: {
        daily_spark:
          "Act as a mystical astrology expert. Give me a short, one-sentence daily spark for {{sign}}. Max 20 words.",
        tarot_interpretation:
          "You are an expert Tarot reader. Question: {{question}}. Card: {{cardName}}. Provide 3-sentence interpretation.",
        birth_chart_analysis:
          "Analyze the birth chart for {{name}}. Planets: {{planets}}. Elements: {{elements}}. Provide 2-paragraph insight.",
      },
    };
  }
}

function interpolate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key] || "");
}

export const GeminiService = {
  async generateDailySpark(sign: string = "General"): Promise<string> {
    try {
      const { config, prompts } = await getAISettings();
      const model = genAI.getGenerativeModel({
        model: config?.model || "gemini-pro",
      });

      const prompt = interpolate(
        prompts?.daily_spark || "Give a daily spark for {{sign}}.",
        { sign },
      );
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating daily spark:", error);
      return "The stars are silent today. Look within for your answer.";
    }
  },

  async generateTarotInterpretation(
    cardName: string,
    question: string,
  ): Promise<string> {
    try {
      const { config, prompts } = await getAISettings();
      const model = genAI.getGenerativeModel({
        model: config?.model || "gemini-pro",
      });

      const prompt = interpolate(
        prompts?.tarot_interpretation ||
          "Card: {{cardName}}, Question: {{question}}",
        { cardName, question },
      );
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating tarot reading:", error);
      return "The cards are clouded. Meditate and try again later.";
    }
  },

  async generateBirthChartAnalysis(
    name: string,
    planets: any,
    elements: any,
  ): Promise<string> {
    try {
      const { config, prompts } = await getAISettings();
      const model = genAI.getGenerativeModel({
        model: config?.model || "gemini-pro",
      });

      const planetSummary = Object.entries(planets)
        .map(([k, v]) => `${k} in ${v}`)
        .join(", ");
      const elementSummary = Object.entries(elements)
        .map(([k, v]) => `${k}: ${v}%`)
        .join(", ");

      const prompt = interpolate(
        prompts?.birth_chart_analysis ||
          "Analyze {{name}}'s chart. Planets: {{planets}}. Elements: {{elements}}.",
        { name, planets: planetSummary, elements: elementSummary },
      );

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Error generating report:", error);
      return "The stars are aligning... please try again later to reveal your full cosmic blueprint.";
    }
  },

  // Utility to clear cache (useful after admin updates settings)
  clearCache() {
    aiConfigCache = null;
    aiPromptsCache = null;
    lastFetchTime = 0;
  },
};
