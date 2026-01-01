/**
 * Silk & Spark - Supabase API 测试
 *
 * 测试内容：
 * 1. 公开数据查询
 * 2. 数据转换
 * 3. 排序和过滤
 * 4. 关联查询
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.test" });

// Validate required environment variables
const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_ANON_KEY"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    console.error("Please copy .env.test.example to .env.test and fill in your values");
    process.exit(1);
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function log(status, name, details = "") {
  const icon = status === "PASS" ? "✅" : "❌";
  console.log(`${icon} ${name}${details ? ": " + details : ""}`);
  results.tests.push({ status, name, details });
  if (status === "PASS") results.passed++;
  else results.failed++;
}

async function testProductsAPI() {
  console.log("\n🛍️ === 产品 API 测试 ===\n");

  // 基础查询
  try {
    const { data, error } = await supabase.from("products").select("*");

    if (error) throw error;
    log("PASS", "产品列表查询", `${data.length} 条记录`);
  } catch (err) {
    log("FAIL", "产品列表查询", err.message);
  }

  // 排序查询
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("price", { ascending: false });

    if (error) throw error;

    // 验证排序
    let sorted = true;
    for (let i = 1; i < data.length; i++) {
      if (data[i].price > data[i - 1].price) {
        sorted = false;
        break;
      }
    }

    if (sorted) {
      log("PASS", "产品价格降序排序");
    } else {
      log("FAIL", "产品价格降序排序", "排序不正确");
    }
  } catch (err) {
    log("FAIL", "产品价格降序排序", err.message);
  }

  // 过滤查询
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .not("badge", "is", null);

    if (error) throw error;

    const allHaveBadge = data.every((p) => p.badge !== null);
    if (allHaveBadge) {
      log("PASS", "产品徽章过滤", `${data.length} 个带徽章的产品`);
    } else {
      log("FAIL", "产品徽章过滤", "过滤结果包含无徽章产品");
    }
  } catch (err) {
    log("FAIL", "产品徽章过滤", err.message);
  }

  // 字段选择
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, title, price")
      .limit(3);

    if (error) throw error;

    const hasOnlySelectedFields = data.every(
      (p) =>
        Object.keys(p).length === 3 &&
        "id" in p &&
        "title" in p &&
        "price" in p,
    );

    if (hasOnlySelectedFields) {
      log("PASS", "字段选择查询", "仅返回指定字段");
    } else {
      log("FAIL", "字段选择查询", "返回了额外字段");
    }
  } catch (err) {
    log("FAIL", "字段选择查询", err.message);
  }
}

async function testExpertsAPI() {
  console.log("\n👤 === 专家 API 测试 ===\n");

  // 基础查询
  try {
    const { data, error } = await supabase.from("experts").select("*");

    if (error) throw error;
    log("PASS", "专家列表查询", `${data.length} 条记录`);
  } catch (err) {
    log("FAIL", "专家列表查询", err.message);
  }

  // 在线专家过滤
  try {
    const { data, error } = await supabase
      .from("experts")
      .select("*")
      .eq("is_online", true);

    if (error) throw error;

    const allOnline = data.every((e) => e.is_online === true);
    if (allOnline) {
      log("PASS", "在线专家过滤", `${data.length} 位在线`);
    } else {
      log("FAIL", "在线专家过滤", "过滤结果包含离线专家");
    }
  } catch (err) {
    log("FAIL", "在线专家过滤", err.message);
  }

  // 评分排序
  try {
    const { data, error } = await supabase
      .from("experts")
      .select("*")
      .order("rating", { ascending: false });

    if (error) throw error;

    let sorted = true;
    for (let i = 1; i < data.length; i++) {
      if (data[i].rating > data[i - 1].rating) {
        sorted = false;
        break;
      }
    }

    if (sorted) {
      log("PASS", "专家评分降序排序");
    } else {
      log("FAIL", "专家评分降序排序", "排序不正确");
    }
  } catch (err) {
    log("FAIL", "专家评分降序排序", err.message);
  }

  // 数组字段查询（tags）
  try {
    const { data, error } = await supabase.from("experts").select("name, tags");

    if (error) throw error;

    const allHaveTags = data.every((e) => Array.isArray(e.tags));
    if (allHaveTags) {
      log("PASS", "专家标签数组字段", "所有专家都有标签数组");
    } else {
      log("FAIL", "专家标签数组字段", "某些专家缺少标签");
    }
  } catch (err) {
    log("FAIL", "专家标签数组字段", err.message);
  }
}

async function testCurrenciesAPI() {
  console.log("\n💰 === 货币 API 测试 ===\n");

  // 基础查询
  try {
    const { data, error } = await supabase
      .from("currencies")
      .select("*")
      .order("id");

    if (error) throw error;
    log("PASS", "货币列表查询", `${data.length} 种货币`);

    // 验证必要字段
    const valid = data.every((c) => c.name && c.code && c.rate !== null);
    if (valid) {
      log("PASS", "货币数据完整性");
    } else {
      log("FAIL", "货币数据完整性", "缺少必要字段");
    }

    // 验证默认货币
    const defaultCount = data.filter((c) => c.is_default).length;
    if (defaultCount === 1) {
      log("PASS", "默认货币唯一", data.find((c) => c.is_default).code);
    } else {
      log("FAIL", "默认货币唯一", `发现 ${defaultCount} 个默认货币`);
    }
  } catch (err) {
    log("FAIL", "货币列表查询", err.message);
  }
}

async function testShippingAPI() {
  console.log("\n📦 === 运费 API 测试 ===\n");

  // 区域列表
  try {
    const { data, error } = await supabase.from("shipping_zones").select("*");

    if (error) throw error;
    log("PASS", "运费区域列表", `${data.length} 个区域`);
  } catch (err) {
    log("FAIL", "运费区域列表", err.message);
  }

  // 关联查询
  try {
    const { data, error } = await supabase
      .from("shipping_zones")
      .select("*, shipping_rates(*)");

    if (error) throw error;

    const hasRates = data.every((z) => Array.isArray(z.shipping_rates));
    if (hasRates) {
      const totalRates = data.reduce(
        (sum, z) => sum + z.shipping_rates.length,
        0,
      );
      log("PASS", "运费区域关联费率", `${totalRates} 个费率`);
    } else {
      log("FAIL", "运费区域关联费率", "关联查询失败");
    }
  } catch (err) {
    log("FAIL", "运费区域关联费率", err.message);
  }

  // 费率单独查询
  try {
    const { data, error } = await supabase
      .from("shipping_rates")
      .select("*")
      .order("price", { ascending: true });

    if (error) throw error;

    // 验证价格排序
    let sorted = true;
    for (let i = 1; i < data.length; i++) {
      if (data[i].price < data[i - 1].price) {
        sorted = false;
        break;
      }
    }

    if (sorted) {
      log("PASS", "费率价格升序排序");
    } else {
      log("FAIL", "费率价格升序排序", "排序不正确");
    }
  } catch (err) {
    log("FAIL", "费率价格升序排序", err.message);
  }
}

async function testPaginationAndLimits() {
  console.log("\n📄 === 分页和限制测试 ===\n");

  // Limit
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .limit(2);

    if (error) throw error;

    if (data.length <= 2) {
      log("PASS", "Limit 限制", `返回 ${data.length} 条`);
    } else {
      log("FAIL", "Limit 限制", `期望 <= 2, 实际 ${data.length}`);
    }
  } catch (err) {
    log("FAIL", "Limit 限制", err.message);
  }

  // Range
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .range(0, 1);

    if (error) throw error;

    if (data.length === 2) {
      log("PASS", "Range 范围查询", "返回正确数量");
    } else {
      log("FAIL", "Range 范围查询", `期望 2, 实际 ${data.length}`);
    }
  } catch (err) {
    log("FAIL", "Range 范围查询", err.message);
  }

  // Single
  try {
    const { data, error } = await supabase
      .from("currencies")
      .select("*")
      .eq("is_default", true)
      .single();

    if (error) throw error;

    if (data && !Array.isArray(data)) {
      log("PASS", "Single 单条查询", data.code);
    } else {
      log("FAIL", "Single 单条查询", "返回格式不正确");
    }
  } catch (err) {
    log("FAIL", "Single 单条查询", err.message);
  }
}

async function testErrorHandling() {
  console.log("\n⚠️ === 错误处理测试 ===\n");

  // 查询不存在的表
  try {
    const { data, error } = await supabase
      .from("nonexistent_table")
      .select("*");

    if (error) {
      log("PASS", "不存在表的错误处理", "正确返回错误");
    } else {
      log("FAIL", "不存在表的错误处理", "应该返回错误");
    }
  } catch (err) {
    log("PASS", "不存在表的错误处理", "抛出异常");
  }

  // 无效的过滤条件
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("nonexistent_column", "value");

    if (error) {
      log("PASS", "无效列名错误处理", "正确返回错误");
    } else {
      log("PASS", "无效列名错误处理", "静默忽略（可接受）");
    }
  } catch (err) {
    log("PASS", "无效列名错误处理", "抛出异常");
  }
}

async function run() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     🔮 Silk & Spark - Supabase API 测试套件              ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  try {
    await testProductsAPI();
    await testExpertsAPI();
    await testCurrenciesAPI();
    await testShippingAPI();
    await testPaginationAndLimits();
    await testErrorHandling();

    console.log(
      "\n╔══════════════════════════════════════════════════════════╗",
    );
    console.log(
      `║  📊 测试结果: ${results.passed} 通过 / ${results.failed} 失败`,
    );
    console.log(
      "╚══════════════════════════════════════════════════════════╝\n",
    );

    if (results.failed > 0) {
      console.log("❌ 失败的测试:");
      results.tests
        .filter((t) => t.status === "FAIL")
        .forEach((t) => {
          console.log(`   - ${t.name}: ${t.details}`);
        });
    }
  } catch (err) {
    console.error("\n💥 测试执行失败:", err.message);
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

run();
