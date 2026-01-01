/**
 * AI Service Utility Functions
 * Shared utilities used across AI providers
 */

/**
 * Extract a section from AI response text based on a keyword
 * Handles markdown formatting like **Keyword**:
 *
 * @param text - The AI response text to parse
 * @param keyword - The section header keyword to find
 * @returns The extracted section content, or null if not found
 */
export function extractSection(text: string, keyword: string): string | null {
  const regex = new RegExp(`\\*\\*${keyword}[^*]*\\*\\*[:\\s]*([^*]+)`, "i");
  const match = text.match(regex);
  return match && match[1] ? match[1].trim() : null;
}

/**
 * Sanitize user input to prevent prompt injection
 * Removes potentially malicious patterns and control characters
 *
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default: 500)
 * @returns Sanitized input string
 */
export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input || typeof input !== "string") return "";

  // Control character regex (Unicode range)
  // eslint-disable-next-line no-control-regex
  const controlCharsRegex = /[\u0000-\u001F\u007F]/g;

  return input
    // Remove potential prompt injection patterns
    .replace(/ignore\s+(all\s+)?(previous\s+)?instructions?/gi, "[filtered]")
    .replace(/you\s+are\s+(now\s+)?a/gi, "[filtered]")
    .replace(/system\s*:/gi, "[filtered]")
    .replace(/assistant\s*:/gi, "[filtered]")
    // Remove control characters
    .replace(controlCharsRegex, "")
    // Limit length
    .slice(0, maxLength)
    .trim();
}

/**
 * Format latency for display
 *
 * @param ms - Latency in milliseconds
 * @returns Formatted string like "1.2s" or "450ms"
 */
export function formatLatency(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${ms}ms`;
}

/**
 * Generate a cache key for AI responses
 *
 * @param prefix - Cache key prefix (e.g., "birth_chart", "tarot")
 * @param userId - User identifier
 * @param params - Additional parameters to include in the key
 * @returns A unique cache key string
 */
export function generateCacheKey(
  prefix: string,
  userId: string,
  params?: Record<string, string | number | boolean>,
): string {
  const paramStr = params
    ? Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join("_")
    : "";

  return `ai_${prefix}_${userId}${paramStr ? `_${paramStr}` : ""}`;
}

/**
 * Parse JSON from AI response text
 * Handles cases where the AI returns JSON wrapped in markdown code blocks
 *
 * @param text - The AI response text that may contain JSON
 * @returns Parsed JSON object, or null if parsing fails
 */
export function parseJSONFromText<T>(text: string): T | null {
  if (!text || typeof text !== "string") return null;

  try {
    // First try direct parsing
    return JSON.parse(text) as T;
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      try {
        return JSON.parse(jsonBlockMatch[1].trim()) as T;
      } catch {
        // Continue to next attempt
      }
    }

    // Try to find JSON object in text (starts with { ends with })
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch && jsonMatch[0]) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        // Parsing failed
      }
    }

    return null;
  }
}
