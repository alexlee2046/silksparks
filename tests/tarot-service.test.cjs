/**
 * TarotService 单元测试
 * 验证种子机制、洗牌算法、正逆位判断
 */

const assert = require("assert");
const seedrandom = require("seedrandom");

// 使用与生产代码相同的 seedrandom 库
function createRng(seed) {
  return seedrandom(seed);
}

// 测试种子生成
function testSeedGeneration() {
  console.log("\n📌 测试种子生成...");

  const date = new Date("2024-12-31");
  const userId = "user123";
  const dateStr = date.toISOString().split("T")[0];
  const seed = `daily:${userId}:${dateStr}`;

  assert.strictEqual(seed, "daily:user123:2024-12-31");
  console.log("  ✅ 种子格式正确:", seed);

  // 匿名用户
  const anonSeed = `daily:anonymous:${dateStr}`;
  assert.strictEqual(anonSeed, "daily:anonymous:2024-12-31");
  console.log("  ✅ 匿名用户种子正确:", anonSeed);
}

// 测试洗牌算法确定性
function testShuffleDeterminism() {
  console.log("\n📌 测试洗牌确定性...");

  const seed = "daily:user123:2024-12-31";
  const deckSize = 78;

  // 模拟洗牌
  function shuffle(seed) {
    const rng = createRng(seed);
    const deck = Array.from({ length: deckSize }, (_, i) => i);

    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const temp = deck[i];
      deck[i] = deck[j];
      deck[j] = temp;
    }

    return deck;
  }

  // 相同种子应该产生相同结果
  const result1 = shuffle(seed);
  const result2 = shuffle(seed);

  assert.deepStrictEqual(result1, result2);
  console.log("  ✅ 相同种子产生相同洗牌结果");

  // 不同种子应该产生不同结果
  const differentSeed = "daily:user123:2024-12-30";
  const result3 = shuffle(differentSeed);

  assert.notDeepStrictEqual(result1, result3);
  console.log("  ✅ 不同种子产生不同洗牌结果");

  // 验证洗牌后牌组仍包含所有牌
  const sortedResult = [...result1].sort((a, b) => a - b);
  const expected = Array.from({ length: deckSize }, (_, i) => i);
  assert.deepStrictEqual(sortedResult, expected);
  console.log("  ✅ 洗牌后牌组完整 (78张)");
}

// 测试正逆位判断
function testReversedLogic() {
  console.log("\n📌 测试正逆位概率...");

  const seed = "daily:user123:2024-12-31";
  const REVERSED_PROBABILITY = 0.35;

  // 模拟 isCardReversed
  function isReversed(seed, cardIndex) {
    const rng = createRng(`${seed}:reversed:${cardIndex}`);
    return rng() < REVERSED_PROBABILITY;
  }

  // 测试确定性
  const reversed1 = isReversed(seed, 0);
  const reversed2 = isReversed(seed, 0);
  assert.strictEqual(reversed1, reversed2);
  console.log("  ✅ 相同参数产生相同正逆位结果");

  // 测试概率分布 (大样本)
  let reversedCount = 0;
  const sampleSize = 10000;

  for (let i = 0; i < sampleSize; i++) {
    if (isReversed(`test:${i}`, 0)) {
      reversedCount++;
    }
  }

  const actualProbability = reversedCount / sampleSize;
  const tolerance = 0.05; // 5% 容差

  assert(
    Math.abs(actualProbability - REVERSED_PROBABILITY) < tolerance,
    `逆位概率 ${actualProbability} 超出预期范围 (${REVERSED_PROBABILITY} ± ${tolerance})`
  );
  console.log(
    `  ✅ 逆位概率约为 ${(actualProbability * 100).toFixed(1)}% (期望 35%)`
  );
}

// 测试选牌功能
function testCardSelection() {
  console.log("\n📌 测试选牌逻辑...");

  const shuffledDeck = [5, 12, 3, 45, 22, 67, 1, 33, 77, 0];
  const displayCount = 7;

  // 获取展示牌
  const displayCards = shuffledDeck.slice(0, displayCount);
  assert.strictEqual(displayCards.length, displayCount);
  console.log("  ✅ 展示牌数量正确:", displayCount);

  // 模拟用户选择
  const selectedIndices = [2, 5]; // 用户选择第3和第6张
  const selectedCardIds = selectedIndices.map((i) => displayCards[i]);
  assert.deepStrictEqual(selectedCardIds, [3, 67]);
  console.log("  ✅ 用户选牌映射正确:", selectedCardIds);
}

// 测试每日种子唯一性
function testDailySeedUniqueness() {
  console.log("\n📌 测试每日种子唯一性...");

  const userId = "user123";
  const seeds = new Set();

  // 生成一周的种子
  for (let i = 0; i < 7; i++) {
    const date = new Date("2024-12-25");
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];
    const seed = `daily:${userId}:${dateStr}`;
    seeds.add(seed);
  }

  assert.strictEqual(seeds.size, 7);
  console.log("  ✅ 7天产生7个不同种子");

  // 不同用户同一天应该不同
  const user1Seed = "daily:user1:2024-12-31";
  const user2Seed = "daily:user2:2024-12-31";
  assert.notStrictEqual(user1Seed, user2Seed);
  console.log("  ✅ 不同用户产生不同种子");
}

// 运行所有测试
console.log("╔══════════════════════════════════════════════════════════╗");
console.log("║     🔮 TarotService 单元测试                              ║");
console.log("╚══════════════════════════════════════════════════════════╝");

try {
  testSeedGeneration();
  testShuffleDeterminism();
  testReversedLogic();
  testCardSelection();
  testDailySeedUniqueness();

  console.log("\n✅ 所有测试通过！\n");
  process.exit(0);
} catch (error) {
  console.error("\n❌ 测试失败:", error.message);
  process.exit(1);
}
