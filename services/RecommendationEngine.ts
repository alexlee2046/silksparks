import { supabase } from "./supabase";
import type { TarotCard, LuckyElements } from "./ai/types";
import { getElementFromDate } from "../lib/ZodiacUtils";

/** 前端使用的产品接口 */
export interface Product {
  id: string;
  name: string; // Mapped from title
  title?: string;
  price: number;
  description: string;
  image: string; // Mapped from image_url
  image_url?: string;
  tags?: string[];
  score?: number;
}

/** 数据库返回的产品记录 */
interface DbProduct {
  id: string;
  title: string;
  price: number;
  description: string | null;
  image_url: string | null;
  is_featured?: boolean;
  product_tags?: Array<{
    tags: { name: string } | null;
  }>;
}

/** 带评分的产品 */
interface ScoredProduct extends Product {
  score: number;
}

// ============ 塔罗牌元素映射 ============

/** 塔罗牌套牌到元素/属性的映射 */
const SUIT_KEYWORDS: Record<string, string[]> = {
  wands: ["fire", "passion", "energy", "creativity", "motivation", "action"],
  cups: ["water", "emotion", "love", "intuition", "relationship", "healing"],
  swords: ["air", "mind", "clarity", "truth", "communication", "intellect"],
  pentacles: ["earth", "material", "wealth", "stability", "grounding", "prosperity"],
};

/** 大阿尔卡那牌到属性的映射 */
const MAJOR_ARCANA_KEYWORDS: Record<string, string[]> = {
  "The Fool": ["new beginnings", "adventure", "freedom"],
  "The Magician": ["manifestation", "power", "skill"],
  "The High Priestess": ["intuition", "mystery", "inner wisdom"],
  "The Empress": ["abundance", "fertility", "nurturing"],
  "The Emperor": ["authority", "structure", "protection"],
  "The Hierophant": ["tradition", "spiritual guidance", "wisdom"],
  "The Lovers": ["love", "harmony", "relationships"],
  "The Chariot": ["victory", "determination", "willpower"],
  "Strength": ["courage", "inner strength", "patience"],
  "The Hermit": ["introspection", "solitude", "guidance"],
  "Wheel of Fortune": ["luck", "cycles", "destiny"],
  "Justice": ["fairness", "truth", "balance"],
  "The Hanged Man": ["surrender", "new perspective", "letting go"],
  "Death": ["transformation", "endings", "change"],
  "Temperance": ["balance", "moderation", "patience"],
  "The Devil": ["shadow", "release", "temptation"],
  "The Tower": ["upheaval", "breakthrough", "revelation"],
  "The Star": ["hope", "inspiration", "renewal"],
  "The Moon": ["illusion", "intuition", "dreams"],
  "The Sun": ["joy", "success", "vitality"],
  "Judgement": ["rebirth", "calling", "absolution"],
  "The World": ["completion", "achievement", "fulfillment"],
};

// ============ 产品缓存 ============
interface ProductCache<T = DbProduct> {
  data: T[];
  timestamp: number;
}

let productsCache: ProductCache<DbProduct> | null = null;
let featuredCache: ProductCache<DbProduct> | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 分钟

function isCacheValid(cache: ProductCache | null): boolean {
  return cache !== null && Date.now() - cache.timestamp < CACHE_TTL;
}

/** 清除所有产品缓存 */
export function invalidateProductCache(): void {
  productsCache = null;
  featuredCache = null;
}

async function fetchProductsWithTags(): Promise<DbProduct[]> {
  // 检查缓存
  if (isCacheValid(productsCache)) {
    return productsCache!.data;
  }

  // 从数据库获取
  const { data, error } = await supabase.from("products").select(`
    id,
    title,
    price,
    description,
    image_url,
    product_tags (
      tags (
        name
      )
    )
  `);

  if (error || !data) {
    console.error("[RecommendationEngine] Error fetching products:", error);
    return [];
  }

  // 更新缓存
  productsCache = {
    data: data as DbProduct[],
    timestamp: Date.now(),
  };

  return data as DbProduct[];
}

export const RecommendationEngine = {
  async getRecommendations(
    text: string,
    limit: number = 3,
  ): Promise<Product[]> {
    const lowerText = text.toLowerCase();

    // 使用缓存获取产品数据
    const productsData = await fetchProductsWithTags();

    if (productsData.length === 0) {
      return [];
    }

    // Process and Score
    const scoredProducts: ScoredProduct[] = productsData.map((p) => {
      let score = 0;
      const tags: string[] =
        p.product_tags?.map((pt) => pt.tags?.name.toLowerCase() ?? "").filter(Boolean) || [];

      // Keyword matching in tags
      tags.forEach((tag) => {
        if (lowerText.includes(tag)) score += 5;
      });

      // Keyword matching in title/description
      if (p.title.toLowerCase().includes(lowerText)) score += 3;
      if (p.description?.toLowerCase().includes(lowerText)) score += 1;

      // Map to frontend interface
      return {
        id: p.id,
        name: p.title,
        price: p.price,
        description: p.description ?? "",
        image: p.image_url ?? "",
        tags,
        score,
      };
    });

    // Sort and limit
    const sorted = scoredProducts
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Fallback logic: Ensure we always return 'limit' items if possible
    let finalRecs: ScoredProduct[] = [...sorted];

    if (finalRecs.length < limit) {
      // Find items not already in the list
      const existingIds = new Set(finalRecs.map((p) => p.id));
      const remaining = scoredProducts.filter((p) => !existingIds.has(p.id));

      // Shuffle remaining items to keep it dynamic
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = remaining[i];
        remaining[i] = remaining[j];
        remaining[j] = temp;
      }

      finalRecs = [
        ...finalRecs,
        ...remaining.slice(0, limit - finalRecs.length),
      ];
    }

    return finalRecs;
  },

  // Personalized recommendations based on User Profile
  async getPersonalizedRecs(
    userProfile: { birthData?: { date?: Date | string | null } } | null,
    limit: number = 3,
  ): Promise<Product[]> {
    let searchTerm = "protection"; // Default fallback

    // 使用共享的 ZodiacUtils 获取元素
    if (userProfile?.birthData?.date) {
      const date = new Date(userProfile.birthData.date);
      searchTerm = getElementFromDate(date);
    }

    return this.getRecommendations(searchTerm, limit);
  },

  // Get featured products for homepage (with caching)
  async getFeaturedProducts(limit: number = 4): Promise<Product[]> {
    /** 映射数据库产品到前端产品 */
    const mapToProduct = (p: DbProduct): Product => ({
      id: p.id,
      name: p.title,
      title: p.title,
      price: p.price,
      description: p.description ?? "",
      image: p.image_url ?? "",
      image_url: p.image_url ?? "",
    });

    // 检查缓存
    if (isCacheValid(featuredCache)) {
      return featuredCache!.data.slice(0, limit).map(mapToProduct);
    }

    const { data, error } = await supabase
      .from("products")
      .select("id, title, price, description, image_url")
      .eq("is_featured", true)
      .limit(20); // 缓存更多以备不同 limit 请求

    if (error || !data) {
      // Fallback: 使用产品缓存
      const allProducts = await fetchProductsWithTags();
      return allProducts.slice(0, limit).map(mapToProduct);
    }

    // 更新缓存
    featuredCache = {
      data: data as DbProduct[],
      timestamp: Date.now(),
    };

    return (data as DbProduct[]).slice(0, limit).map(mapToProduct);
  },

  /**
   * 基于塔罗牌面和幸运元素推荐产品
   * 结合牌面象征意义、套牌元素、幸运水晶等进行智能匹配
   */
  async getTarotBasedRecommendations(
    cards: TarotCard[],
    luckyElements?: LuckyElements,
    limit: number = 3,
  ): Promise<Product[]> {
    const productsData = await fetchProductsWithTags();

    if (productsData.length === 0) {
      return [];
    }

    // 收集所有相关关键词
    const keywords: string[] = [];

    // 1. 从牌面提取关键词
    cards.forEach((card) => {
      // 大阿尔卡那
      if (card.arcana === "Major" && MAJOR_ARCANA_KEYWORDS[card.name]) {
        keywords.push(...MAJOR_ARCANA_KEYWORDS[card.name]);
      }

      // 小阿尔卡那 - 根据套牌
      if (card.arcana === "Minor" && card.suit) {
        const suitLower = card.suit.toLowerCase();
        if (SUIT_KEYWORDS[suitLower]) {
          keywords.push(...SUIT_KEYWORDS[suitLower]);
        }
      }

      // 逆位调整 - 添加对立/阴影相关词
      if (card.isReversed) {
        keywords.push("shadow", "healing", "release", "balance");
      }
    });

    // 2. 从幸运元素提取关键词
    if (luckyElements) {
      if (luckyElements.crystal) {
        keywords.push(luckyElements.crystal.toLowerCase());
      }
      if (luckyElements.color) {
        keywords.push(luckyElements.color.toLowerCase());
      }
    }

    // 去重
    const uniqueKeywords = [...new Set(keywords.map((k) => k.toLowerCase()))];

    // 评分产品
    const scoredProducts: ScoredProduct[] = productsData.map((p) => {
      let score = 0;
      const tags: string[] =
        p.product_tags?.map((pt) => pt.tags?.name?.toLowerCase() ?? "").filter(Boolean) || [];
      const titleLower = p.title?.toLowerCase() ?? "";
      const descLower = p.description?.toLowerCase() ?? "";

      // 关键词匹配
      uniqueKeywords.forEach((keyword) => {
        // 标签完全匹配 (高分)
        if (tags.includes(keyword)) {
          score += 10;
        }
        // 标签部分匹配
        else if (tags.some((t) => t.includes(keyword) || keyword.includes(t))) {
          score += 5;
        }

        // 标题匹配
        if (titleLower.includes(keyword)) {
          score += 4;
        }

        // 描述匹配
        if (descLower.includes(keyword)) {
          score += 2;
        }
      });

      // 幸运水晶特殊加分
      if (luckyElements?.crystal) {
        const crystalLower = luckyElements.crystal.toLowerCase();
        if (titleLower.includes(crystalLower)) {
          score += 15; // 强匹配
        }
        if (tags.some((t) => t.includes(crystalLower))) {
          score += 12;
        }
      }

      return {
        id: p.id,
        name: p.title,
        price: p.price,
        description: p.description ?? "",
        image: p.image_url ?? "",
        tags,
        score,
      };
    });

    // 排序并返回
    const sorted = scoredProducts
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Fallback: 如果匹配不足，补充随机产品
    if (sorted.length < limit) {
      const existingIds = new Set(sorted.map((p) => p.id));
      const remaining = scoredProducts.filter((p) => !existingIds.has(p.id));

      // 随机打乱
      for (let i = remaining.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = remaining[i];
        remaining[i] = remaining[j];
        remaining[j] = temp;
      }

      return [
        ...sorted,
        ...remaining.slice(0, limit - sorted.length),
      ];
    }

    return sorted;
  },
};
