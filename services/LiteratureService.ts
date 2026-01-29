/**
 * Literature Service
 *
 * Service for retrieving relevant classical literature quotes
 * based on BaZi chart analysis.
 */

import type { QuoteSelectionCriteria, LiteratureQuote } from "../lib/literature/types";
import { ALL_QUOTES } from "../lib/literature/quotes";
import type { BaZiChart } from "../lib/bazi/types";

/**
 * Get season from month branch
 */
function getSeasonFromMonthBranch(
  branch: string
): "spring" | "summer" | "autumn" | "winter" {
  const springBranches = ["寅", "卯", "辰"];
  const summerBranches = ["巳", "午", "未"];
  const autumnBranches = ["申", "酉", "戌"];
  // const winterBranches = ["亥", "子", "丑"];

  if (springBranches.includes(branch)) return "spring";
  if (summerBranches.includes(branch)) return "summer";
  if (autumnBranches.includes(branch)) return "autumn";
  return "winter";
}

/**
 * Calculate relevance score for a quote
 */
function calculateRelevanceScore(
  quote: LiteratureQuote,
  criteria: QuoteSelectionCriteria
): number {
  let score = 0;

  // Day master match (highest priority)
  if (criteria.dayMaster && quote.applicableDayMasters?.includes(criteria.dayMaster)) {
    score += 50;
  }

  // Element match
  if (criteria.element && quote.applicableElements?.includes(criteria.element)) {
    score += 30;
  }

  // Ten god match
  if (criteria.tenGod && quote.applicableTenGods?.includes(criteria.tenGod)) {
    score += 25;
  }

  // Strength match
  if (criteria.strength && quote.applicableStrengths?.includes(criteria.strength)) {
    score += 20;
  }

  // Season match
  if (criteria.season && quote.applicableSeasons?.includes(criteria.season)) {
    score += 15;
  }

  // Category match
  if (criteria.category && quote.category === criteria.category) {
    score += 10;
  }

  // General quotes get a small base score
  if (quote.category === "general") {
    score += 5;
  }

  return score;
}

export const LiteratureService = {
  /**
   * Get relevant quotes based on selection criteria
   */
  getRelevantQuotes(
    criteria: QuoteSelectionCriteria
  ): LiteratureQuote[] {
    const maxQuotes = criteria.maxQuotes || 3;

    // Score all quotes
    const scoredQuotes = ALL_QUOTES.map((quote) => ({
      quote,
      score: calculateRelevanceScore(quote, criteria),
    }));

    // Filter quotes with score > 0 and sort by score
    const relevantQuotes = scoredQuotes
      .filter((sq) => sq.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxQuotes)
      .map((sq) => sq.quote);

    // If no relevant quotes found, return general quotes
    if (relevantQuotes.length === 0) {
      return ALL_QUOTES.filter((q) => q.category === "general").slice(
        0,
        maxQuotes
      );
    }

    return relevantQuotes;
  },

  /**
   * Get quotes for a BaZi chart
   */
  getQuotesForChart(chart: BaZiChart, maxQuotes = 3): LiteratureQuote[] {
    const dayMaster = chart.dayMaster.stem;
    const element = chart.dayMaster.element;
    const strength = chart.dayMaster.strength;
    const season = getSeasonFromMonthBranch(chart.fourPillars.month.branch);

    // Get dominant ten god if available
    const dominantTenGod = chart.tenGods.dominant;

    return this.getRelevantQuotes({
      dayMaster,
      element,
      tenGod: dominantTenGod,
      strength,
      season,
      maxQuotes,
    });
  },

  /**
   * Get quotes specifically for day master
   */
  getDayMasterQuotes(
    dayMaster: BaZiChart["dayMaster"]["stem"],
    maxQuotes = 2
  ): LiteratureQuote[] {
    return this.getRelevantQuotes({
      dayMaster,
      category: "day_master",
      maxQuotes,
    });
  },

  /**
   * Get quotes for a specific ten god
   */
  getTenGodQuotes(
    tenGod: LiteratureQuote["applicableTenGods"] extends (infer T)[]
      ? T
      : never,
    maxQuotes = 2
  ): LiteratureQuote[] {
    return this.getRelevantQuotes({
      tenGod,
      category: "ten_gods",
      maxQuotes,
    });
  },

  /**
   * Get quotes for element and season combination
   */
  getSeasonalQuotes(
    element: BaZiChart["dayMaster"]["element"],
    season: "spring" | "summer" | "autumn" | "winter",
    maxQuotes = 2
  ): LiteratureQuote[] {
    return this.getRelevantQuotes({
      element,
      season,
      category: "wu_xing",
      maxQuotes,
    });
  },

  /**
   * Get strength-related quotes
   */
  getStrengthQuotes(
    strength: BaZiChart["dayMaster"]["strength"],
    maxQuotes = 2
  ): LiteratureQuote[] {
    return this.getRelevantQuotes({
      strength,
      category: "strength",
      maxQuotes,
    });
  },

  /**
   * Get a random general wisdom quote
   */
  getRandomWisdomQuote(): LiteratureQuote {
    const generalQuotes = ALL_QUOTES.filter((q) => q.category === "general");
    const randomIndex = Math.floor(Math.random() * generalQuotes.length);
    // Return first quote as fallback if somehow array is empty
    return generalQuotes[randomIndex] ?? generalQuotes[0] ?? ALL_QUOTES[0]!;
  },

  /**
   * Format quote for display (mixed mode: original + translation)
   */
  formatQuoteForDisplay(quote: LiteratureQuote): string {
    return `《${quote.source}》${quote.chapter ? `·${quote.chapter}` : ""}云：「${quote.originalText}」\n\n${quote.translation}`;
  },

  /**
   * Get total quotes count
   */
  getTotalQuotesCount(): number {
    return ALL_QUOTES.length;
  },
};

export default LiteratureService;
