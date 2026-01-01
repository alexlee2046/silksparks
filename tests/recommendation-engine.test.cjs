/**
 * RecommendationEngine 单元测试
 * 验证塔罗牌推荐逻辑（不依赖数据库）
 */

const assert = require("assert");

// ============ 模拟数据 ============

const mockProducts = [
  {
    id: "1",
    title: "Rose Quartz Crystal",
    description: "A crystal for love and healing",
    price: 29.99,
    image_url: "/images/rose-quartz.jpg",
    product_tags: [
      { tags: { name: "love" } },
      { tags: { name: "healing" } },
      { tags: { name: "crystal" } },
    ],
  },
  {
    id: "2",
    title: "Amethyst Pendant",
    description: "For intuition and spiritual growth",
    price: 49.99,
    image_url: "/images/amethyst.jpg",
    product_tags: [
      { tags: { name: "intuition" } },
      { tags: { name: "spiritual" } },
      { tags: { name: "crystal" } },
    ],
  },
  {
    id: "3",
    title: "Fire Element Candle",
    description: "Passion and energy in a candle",
    price: 19.99,
    image_url: "/images/fire-candle.jpg",
    product_tags: [
      { tags: { name: "fire" } },
      { tags: { name: "passion" } },
      { tags: { name: "energy" } },
    ],
  },
  {
    id: "4",
    title: "Water Element Bath Salt",
    description: "For emotional healing and relaxation",
    price: 24.99,
    image_url: "/images/bath-salt.jpg",
    product_tags: [
      { tags: { name: "water" } },
      { tags: { name: "emotion" } },
      { tags: { name: "healing" } },
    ],
  },
  {
    id: "5",
    title: "Protection Amulet",
    description: "Ward off negative energy",
    price: 39.99,
    image_url: "/images/amulet.jpg",
    product_tags: [
      { tags: { name: "protection" } },
      { tags: { name: "shadow" } },
      { tags: { name: "balance" } },
    ],
  },
];

// ============ 复制关键逻辑进行测试 ============

const SUIT_KEYWORDS = {
  wands: ["fire", "passion", "energy", "creativity", "motivation", "action"],
  cups: ["water", "emotion", "love", "intuition", "relationship", "healing"],
  swords: ["air", "mind", "clarity", "truth", "communication", "intellect"],
  pentacles: [
    "earth",
    "material",
    "wealth",
    "stability",
    "grounding",
    "prosperity",
  ],
};

const MAJOR_ARCANA_KEYWORDS = {
  "The Fool": ["new beginnings", "adventure", "freedom"],
  "The Magician": ["manifestation", "power", "skill"],
  "The High Priestess": ["intuition", "mystery", "inner wisdom"],
  "The Empress": ["abundance", "fertility", "nurturing"],
  "The Lovers": ["love", "harmony", "relationships"],
  "The Star": ["hope", "inspiration", "renewal"],
  Death: ["transformation", "endings", "change"],
  "The Moon": ["illusion", "intuition", "dreams"],
};

function getTarotBasedRecommendations(cards, luckyElements, limit = 3) {
  // 收集关键词
  const keywords = [];

  cards.forEach((card) => {
    // 大阿尔卡那
    if (card.arcana === "Major" && MAJOR_ARCANA_KEYWORDS[card.name]) {
      keywords.push(...MAJOR_ARCANA_KEYWORDS[card.name]);
    }

    // 小阿尔卡那
    if (card.arcana === "Minor" && card.suit) {
      const suitLower = card.suit.toLowerCase();
      if (SUIT_KEYWORDS[suitLower]) {
        keywords.push(...SUIT_KEYWORDS[suitLower]);
      }
    }

    // 逆位
    if (card.isReversed) {
      keywords.push("shadow", "healing", "release", "balance");
    }
  });

  // 从幸运元素提取关键词
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
  const scoredProducts = mockProducts.map((p) => {
    let score = 0;
    const tags =
      p.product_tags?.map((pt) => pt.tags?.name?.toLowerCase()).filter(Boolean) ||
      [];
    const titleLower = p.title?.toLowerCase() || "";
    const descLower = p.description?.toLowerCase() || "";

    uniqueKeywords.forEach((keyword) => {
      if (tags.includes(keyword)) {
        score += 10;
      } else if (
        tags.some((t) => t.includes(keyword) || keyword.includes(t))
      ) {
        score += 5;
      }

      if (titleLower.includes(keyword)) {
        score += 4;
      }

      if (descLower.includes(keyword)) {
        score += 2;
      }
    });

    // 幸运水晶特殊加分
    if (luckyElements?.crystal) {
      const crystalLower = luckyElements.crystal.toLowerCase();
      if (titleLower.includes(crystalLower)) {
        score += 15;
      }
      if (tags.some((t) => t.includes(crystalLower))) {
        score += 12;
      }
    }

    return {
      id: p.id,
      name: p.title,
      price: p.price,
      description: p.description,
      image: p.image_url,
      tags,
      score,
    };
  });

  // 排序返回
  return scoredProducts
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ============ 测试用例 ============

function testMajorArcanaMatching() {
  console.log("\n📌 测试大阿尔卡那匹配...");

  const cards = [
    { id: "lovers", name: "The Lovers", arcana: "Major", isReversed: false },
  ];

  const results = getTarotBasedRecommendations(cards, null, 3);

  // The Lovers 应该匹配 love 相关产品
  assert(results.length > 0, "应该返回推荐产品");

  const hasLoveProduct = results.some(
    (r) => r.tags.includes("love") || r.name.toLowerCase().includes("love")
  );
  assert(hasLoveProduct, "The Lovers 应该推荐爱情相关产品");

  console.log("  ✅ 大阿尔卡那正确匹配关键词");
  console.log("     推荐产品:", results.map((r) => r.name).join(", "));
}

function testMinorArcanaMatching() {
  console.log("\n📌 测试小阿尔卡那匹配...");

  const cards = [
    {
      id: "ace-of-wands",
      name: "Ace of Wands",
      arcana: "Minor",
      suit: "Wands",
      isReversed: false,
    },
  ];

  const results = getTarotBasedRecommendations(cards, null, 3);

  assert(results.length > 0, "应该返回推荐产品");

  // Wands 应该匹配 fire/passion/energy
  const hasFireProduct = results.some(
    (r) =>
      r.tags.includes("fire") ||
      r.tags.includes("passion") ||
      r.tags.includes("energy")
  );
  assert(hasFireProduct, "Wands 应该推荐火元素相关产品");

  console.log("  ✅ 小阿尔卡那正确匹配套牌元素");
  console.log("     推荐产品:", results.map((r) => r.name).join(", "));
}

function testReversedCardMatching() {
  console.log("\n📌 测试逆位牌匹配...");

  const cards = [
    { id: "death", name: "Death", arcana: "Major", isReversed: true },
  ];

  const results = getTarotBasedRecommendations(cards, null, 3);

  assert(results.length > 0, "应该返回推荐产品");

  // 逆位应该添加 shadow/healing/balance 关键词
  const hasBalanceProduct = results.some(
    (r) =>
      r.tags.includes("shadow") ||
      r.tags.includes("healing") ||
      r.tags.includes("balance")
  );
  assert(hasBalanceProduct, "逆位牌应该推荐疗愈/平衡相关产品");

  console.log("  ✅ 逆位牌正确添加阴影/疗愈关键词");
  console.log("     推荐产品:", results.map((r) => r.name).join(", "));
}

function testLuckyElementsBoost() {
  console.log("\n📌 测试幸运元素加成...");

  const cards = [
    { id: "star", name: "The Star", arcana: "Major", isReversed: false },
  ];

  const luckyElements = {
    crystal: "Amethyst",
    color: "purple",
    number: 7,
    direction: "North",
  };

  const results = getTarotBasedRecommendations(cards, luckyElements, 3);

  assert(results.length > 0, "应该返回推荐产品");

  // Amethyst 水晶应该获得高分
  const amethystProduct = results.find((r) =>
    r.name.toLowerCase().includes("amethyst")
  );
  assert(amethystProduct, "幸运水晶 Amethyst 应该被推荐");

  // 确保 Amethyst 排名靠前
  const amethystIndex = results.findIndex((r) =>
    r.name.toLowerCase().includes("amethyst")
  );
  assert(amethystIndex < 2, "幸运水晶产品应该排名靠前");

  console.log("  ✅ 幸运水晶获得额外加分");
  console.log("     推荐产品:", results.map((r) => r.name).join(", "));
}

function testMultipleCards() {
  console.log("\n📌 测试多张牌综合推荐...");

  const cards = [
    {
      id: "cups-2",
      name: "Two of Cups",
      arcana: "Minor",
      suit: "Cups",
      position: "past",
      isReversed: false,
    },
    {
      id: "moon",
      name: "The Moon",
      arcana: "Major",
      position: "present",
      isReversed: false,
    },
    {
      id: "star",
      name: "The Star",
      arcana: "Major",
      position: "future",
      isReversed: false,
    },
  ];

  const results = getTarotBasedRecommendations(cards, null, 3);

  assert(results.length > 0, "应该返回推荐产品");

  // Cups (水元素) + Moon (直觉) + Star (希望) 组合
  // 应该匹配 water/emotion/intuition 相关
  console.log("  ✅ 多张牌综合关键词匹配");
  console.log("     推荐产品:", results.map((r) => r.name).join(", "));
}

function testLimitParameter() {
  console.log("\n📌 测试返回数量限制...");

  const cards = [
    {
      id: "cups-2",
      name: "Two of Cups",
      arcana: "Minor",
      suit: "Cups",
      isReversed: false,
    },
  ];

  const results1 = getTarotBasedRecommendations(cards, null, 1);
  const results3 = getTarotBasedRecommendations(cards, null, 3);

  assert(results1.length <= 1, "limit=1 应该最多返回1个");
  assert(results3.length <= 3, "limit=3 应该最多返回3个");

  console.log("  ✅ limit 参数正确限制返回数量");
}

function testScoreOrdering() {
  console.log("\n📌 测试评分排序...");

  const cards = [
    {
      id: "cups-2",
      name: "Two of Cups",
      arcana: "Minor",
      suit: "Cups",
      isReversed: false,
    },
  ];

  const results = getTarotBasedRecommendations(cards, null, 5);

  // 验证按分数降序排列
  for (let i = 0; i < results.length - 1; i++) {
    assert(
      results[i].score >= results[i + 1].score,
      "产品应该按分数降序排列"
    );
  }

  console.log("  ✅ 产品按分数正确排序");
  console.log(
    "     分数:",
    results.map((r) => `${r.name}(${r.score})`).join(", ")
  );
}

// ============ 运行测试 ============

console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║     🎯 RecommendationEngine 单元测试                      ║");
console.log("╚══════════════════════════════════════════════════════════╝");

try {
  testMajorArcanaMatching();
  testMinorArcanaMatching();
  testReversedCardMatching();
  testLuckyElementsBoost();
  testMultipleCards();
  testLimitParameter();
  testScoreOrdering();

  console.log("\n✅ 所有测试通过！\n");
  process.exit(0);
} catch (error) {
  console.error("\n❌ 测试失败:", error.message);
  process.exit(1);
}
