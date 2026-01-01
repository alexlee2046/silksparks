/**
 * TarotService - 塔罗牌核心服务
 * 提供种子机制、洗牌算法、正逆位判断等功能
 */

import seedrandom from "seedrandom";
import tarotData from "../src/data/tarot_cards.json";
import type { TarotCard } from "./ai/types";

// ============ 常量配置 ============

/** 逆位概率 (35%，更符合传统塔罗) */
const REVERSED_PROBABILITY = 0.35;

/** 每日塔罗展示的牌数 */
export const DAILY_DISPLAY_COUNT = 7;

/** 三张牌阵展示的牌数 */
export const SPREAD_DISPLAY_COUNT = 9;

// ============ 种子生成 ============

/**
 * 生成每日塔罗的种子
 * 同一天同一用户结果一致
 */
export function getDailyCardSeed(userId: string | null, date: Date): string {
  const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD
  const userKey = userId || "anonymous";
  return `daily:${userKey}:${dateStr}`;
}

/**
 * 生成牌阵的种子
 * 每次抽取都是独立的，使用时间戳
 */
export function getSpreadSeed(userId: string | null): string {
  const userKey = userId || "anonymous";
  return `spread:${userKey}:${Date.now()}`;
}

/**
 * 字符串哈希函数 (cyrb53)
 * 用于生成额外的种子变体
 */
export function hashString(str: string): number {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

// ============ 洗牌算法 ============

/**
 * 使用 Fisher-Yates 算法洗牌
 * 基于种子确保结果可复现
 */
export function shuffleDeck(seed: string): number[] {
  const rng = seedrandom(seed);
  const deck = Array.from({ length: tarotData.length }, (_, i) => i);

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const temp = deck[i];
    deck[i] = deck[j] as number;
    deck[j] = temp as number;
  }

  return deck;
}

/**
 * 从洗好的牌堆中选取指定数量的牌用于展示
 */
export function getDisplayCards(
  shuffledDeck: number[],
  count: number
): number[] {
  return shuffledDeck.slice(0, count);
}

// ============ 选牌和正逆位 ============

/**
 * 判断是否逆位 (35% 概率)
 */
export function isCardReversed(seed: string, cardIndex: number): boolean {
  const rng = seedrandom(`${seed}:reversed:${cardIndex}`);
  return rng() < REVERSED_PROBABILITY;
}

/**
 * 根据索引获取牌面数据
 */
export function getCardByIndex(index: number): (typeof tarotData)[0] | null {
  return tarotData[index] ?? null;
}

/**
 * 构建完整的塔罗牌对象
 */
export function buildTarotCard(
  index: number,
  seed: string,
  position?: "past" | "present" | "future" | "single"
): TarotCard | null {
  const cardData = getCardByIndex(index);
  if (!cardData) return null;

  return {
    id: cardData.id,
    name: cardData.name,
    arcana: cardData.arcana as "Major" | "Minor",
    suit: cardData.suit ?? undefined,
    image: cardData.image,
    isReversed: isCardReversed(seed, index),
    position,
  };
}

// ============ 每日塔罗专用 ============

export interface DailyTarotResult {
  /** 洗牌后的牌堆 (完整78张) */
  shuffledDeck: number[];
  /** 展示给用户选择的牌 (7张) */
  displayCards: number[];
  /** 种子值，用于后续正逆位判断 */
  seed: string;
}

/**
 * 初始化每日塔罗
 * 返回洗好的牌堆和展示牌
 */
export function initDailyTarot(
  userId: string | null,
  date: Date = new Date()
): DailyTarotResult {
  const seed = getDailyCardSeed(userId, date);
  const shuffledDeck = shuffleDeck(seed);
  const displayCards = getDisplayCards(shuffledDeck, DAILY_DISPLAY_COUNT);

  return {
    shuffledDeck,
    displayCards,
    seed,
  };
}

/**
 * 用户选择一张牌后，构建完整的牌对象
 */
export function selectDailyCard(
  seed: string,
  selectedIndex: number
): TarotCard | null {
  return buildTarotCard(selectedIndex, seed, "single");
}

// ============ 三张牌阵专用 ============

export interface SpreadTarotResult {
  shuffledDeck: number[];
  displayCards: number[];
  seed: string;
}

/**
 * 初始化三张牌阵
 */
export function initSpreadTarot(userId: string | null): SpreadTarotResult {
  const seed = getSpreadSeed(userId);
  const shuffledDeck = shuffleDeck(seed);
  const displayCards = getDisplayCards(shuffledDeck, SPREAD_DISPLAY_COUNT);

  return {
    shuffledDeck,
    displayCards,
    seed,
  };
}

/**
 * 用户选择三张牌后，构建完整的牌对象数组
 */
export function selectSpreadCards(
  seed: string,
  selectedIndices: number[]
): TarotCard[] {
  const positions: ("past" | "present" | "future")[] = [
    "past",
    "present",
    "future",
  ];

  return selectedIndices
    .map((index, i) => buildTarotCard(index, seed, positions[i]))
    .filter((card): card is TarotCard => card !== null);
}

// ============ 牌面信息辅助 ============

export interface CardKeywords {
  upright: string[];
  reversed: string[];
}

/** 获取牌面关键词 (用于AI解读增强) */
export function getCardKeywords(cardId: string): string[] {
  const card = tarotData.find((c) => c.id === cardId);
  return card?.keywords ?? [];
}

/** 获取整副牌的总数 */
export function getTotalCardCount(): number {
  return tarotData.length;
}

/** 导出原始牌组数据 (只读) */
export { tarotData };
