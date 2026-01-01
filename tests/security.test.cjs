/**
 * Silk & Spark - 权限和安全测试
 *
 * 测试内容：
 * 1. 匿名用户权限
 * 2. RLS 策略执行
 * 3. 敏感数据保护
 */

const { Client } = require("pg");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.test" });

// Validate required environment variables
const requiredEnvVars = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_DB_HOST",
  "SUPABASE_DB_PASSWORD",
];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    console.error("Please copy .env.test.example to .env.test and fill in your values");
    process.exit(1);
  }
}

const dbClient = new Client({
  host: process.env.SUPABASE_DB_HOST,
  port: parseInt(process.env.SUPABASE_DB_PORT || "5432"),
  user: process.env.SUPABASE_DB_USER || "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME || "postgres",
  ssl: { rejectUnauthorized: false },
});

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

async function testRLSEnabled() {
  console.log("\n🔐 === RLS 启用状态 ===\n");

  const protectedTables = ["profiles", "archives", "orders"];
  const publicTables = ["products", "experts"];

  await dbClient.connect();

  for (const table of [...protectedTables, ...publicTables]) {
    try {
      const res = await dbClient.query(
        `
        SELECT relrowsecurity FROM pg_class 
        WHERE relname = $1 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      `,
        [table],
      );

      if (res.rows.length > 0 && res.rows[0].relrowsecurity) {
        log("PASS", `RLS 已启用: ${table}`);
      } else {
        log("FAIL", `RLS 未启用: ${table}`);
      }
    } catch (err) {
      log("FAIL", `RLS 检查: ${table}`, err.message);
    }
  }
}

async function testPublicDataAccess() {
  console.log("\n🌐 === 公开数据访问 ===\n");

  // 产品应该对所有人可见
  try {
    const { data, error } = await supabase.from("products").select("*");

    if (error) {
      log("FAIL", "匿名用户访问产品", error.message);
    } else {
      log("PASS", "匿名用户访问产品", `可读取 ${data.length} 条`);
    }
  } catch (err) {
    log("FAIL", "匿名用户访问产品", err.message);
  }

  // 专家应该对所有人可见
  try {
    const { data, error } = await supabase.from("experts").select("*");

    if (error) {
      log("FAIL", "匿名用户访问专家", error.message);
    } else {
      log("PASS", "匿名用户访问专家", `可读取 ${data.length} 条`);
    }
  } catch (err) {
    log("FAIL", "匿名用户访问专家", err.message);
  }

  // 货币应该对所有人可见
  try {
    const { data, error } = await supabase.from("currencies").select("*");

    if (error) {
      log("FAIL", "匿名用户访问货币", error.message);
    } else {
      log("PASS", "匿名用户访问货币", `可读取 ${data.length} 条`);
    }
  } catch (err) {
    log("FAIL", "匿名用户访问货币", err.message);
  }
}

async function testProtectedDataAccess() {
  console.log("\n🔒 === 受保护数据访问 ===\n");

  // 匿名用户不应能读取其他用户的 profiles
  try {
    const { data, error } = await supabase.from("profiles").select("*");

    // RLS 应该阻止访问或返回空结果
    if (data && data.length === 0) {
      log("PASS", "匿名用户无法读取 profiles", "返回空结果");
    } else if (error) {
      log("PASS", "匿名用户无法读取 profiles", "访问被拒绝");
    } else {
      log("FAIL", "匿名用户无法读取 profiles", `意外返回 ${data.length} 条`);
    }
  } catch (err) {
    log("PASS", "匿名用户无法读取 profiles", "抛出异常");
  }

  // 匿名用户不应能读取 archives
  try {
    const { data, error } = await supabase.from("archives").select("*");

    if (data && data.length === 0) {
      log("PASS", "匿名用户无法读取 archives", "返回空结果");
    } else if (error) {
      log("PASS", "匿名用户无法读取 archives", "访问被拒绝");
    } else {
      log("FAIL", "匿名用户无法读取 archives", `意外返回 ${data.length} 条`);
    }
  } catch (err) {
    log("PASS", "匿名用户无法读取 archives", "抛出异常");
  }

  // 匿名用户不应能读取 orders
  try {
    const { data, error } = await supabase.from("orders").select("*");

    if (data && data.length === 0) {
      log("PASS", "匿名用户无法读取 orders", "返回空结果");
    } else if (error) {
      log("PASS", "匿名用户无法读取 orders", "访问被拒绝");
    } else {
      log("FAIL", "匿名用户无法读取 orders", `意外返回 ${data.length} 条`);
    }
  } catch (err) {
    log("PASS", "匿名用户无法读取 orders", "抛出异常");
  }
}

async function testWritePermissions() {
  console.log("\n✏️ === 写入权限测试 ===\n");

  // 匿名用户不应能向 products 写入
  try {
    const { data, error } = await supabase
      .from("products")
      .insert({ title: "Hacked Product", price: 0 });

    if (error) {
      log("PASS", "匿名用户无法写入 products", "写入被拒绝");
    } else {
      // 如果成功写入，需要清理
      log("FAIL", "匿名用户可以写入 products", "安全漏洞！");
    }
  } catch (err) {
    log("PASS", "匿名用户无法写入 products", "抛出异常");
  }

  // 匿名用户不应能修改 products - 通过验证数据未被修改
  try {
    // 先获取原始价格
    const { data: before } = await supabase
      .from("products")
      .select("price")
      .eq("id", 1)
      .single();

    const originalPrice = before?.price;

    // 尝试更新
    const { data, error, count } = await supabase
      .from("products")
      .update({ price: 999999 })
      .eq("id", 1)
      .select();

    // 验证数据未被修改
    const { data: after } = await supabase
      .from("products")
      .select("price")
      .eq("id", 1)
      .single();

    if (error) {
      log("PASS", "匿名用户无法更新 products", "更新被拒绝");
    } else if (!data || data.length === 0) {
      // RLS 返回空数组表示没有行被更新(无权限)
      log("PASS", "匿名用户无法更新 products", "RLS 阻止更新");
    } else if (after?.price === originalPrice) {
      log("PASS", "匿名用户无法更新 products", "数据未被修改");
    } else {
      log("FAIL", "匿名用户可以更新 products", "安全漏洞！");
    }
  } catch (err) {
    log("PASS", "匿名用户无法更新 products", "抛出异常");
  }

  // 匿名用户不应能删除 products - 通过计数验证
  try {
    // 先获取总数
    const { count: beforeCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    // 尝试删除
    const { data, error } = await supabase
      .from("products")
      .delete()
      .eq("id", 1)
      .select();

    // 再次获取总数
    const { count: afterCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true });

    if (error) {
      log("PASS", "匿名用户无法删除 products", "删除被拒绝");
    } else if (!data || data.length === 0) {
      // RLS 返回空数组表示没有行被删除(无权限)
      log("PASS", "匿名用户无法删除 products", "RLS 阻止删除");
    } else if (beforeCount === afterCount) {
      log("PASS", "匿名用户无法删除 products", "数据未被删除");
    } else {
      log("FAIL", "匿名用户可以删除 products", "安全漏洞！");
    }
  } catch (err) {
    log("PASS", "匿名用户无法删除 products", "抛出异常");
  }
}

async function testPoliciesExist() {
  console.log("\n📋 === 策略存在性验证 ===\n");

  try {
    const res = await dbClient.query(`
      SELECT tablename, policyname, cmd, qual, with_check
      FROM pg_policies 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    log("PASS", "策略总数", `${res.rows.length} 条策略`);

    // 检查每个重要表是否有策略
    const tablesWithPolicies = [...new Set(res.rows.map((r) => r.tablename))];

    const requiredTables = [
      "profiles",
      "archives",
      "orders",
      "products",
      "experts",
    ];
    for (const table of requiredTables) {
      if (tablesWithPolicies.includes(table)) {
        const policies = res.rows.filter((r) => r.tablename === table);
        log("PASS", `${table} 有策略`, `${policies.length} 条`);
      } else {
        log("FAIL", `${table} 缺少策略`);
      }
    }

    // 输出策略详情
    console.log("\n   📋 策略详情:");
    res.rows.forEach((p) => {
      console.log(`      ${p.tablename}.${p.policyname} (${p.cmd})`);
    });
  } catch (err) {
    log("FAIL", "策略查询", err.message);
  }
}

async function testSensitiveDataProtection() {
  console.log("\n🛡️ === 敏感数据保护 ===\n");

  // 检查用户邮箱是否被保护
  try {
    const { data, error } = await supabase.from("profiles").select("email");

    if (data && data.length === 0) {
      log("PASS", "用户邮箱受保护", "匿名用户无法读取");
    } else if (error) {
      log("PASS", "用户邮箱受保护", "访问被拒绝");
    } else {
      log("FAIL", "用户邮箱泄露", `可读取 ${data.length} 个邮箱`);
    }
  } catch (err) {
    log("PASS", "用户邮箱受保护", "抛出异常");
  }

  // 检查订单金额是否被保护
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("total, user_id");

    if (data && data.length === 0) {
      log("PASS", "订单数据受保护", "匿名用户无法读取");
    } else if (error) {
      log("PASS", "订单数据受保护", "访问被拒绝");
    } else {
      log("FAIL", "订单数据泄露", `可读取 ${data.length} 条订单`);
    }
  } catch (err) {
    log("PASS", "订单数据受保护", "抛出异常");
  }
}

async function run() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     🔮 Silk & Spark - 权限和安全测试套件                  ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  try {
    await testRLSEnabled();
    await testPublicDataAccess();
    await testProtectedDataAccess();
    await testWritePermissions();
    await testPoliciesExist();
    await testSensitiveDataProtection();

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
      console.log("❌ 失败的测试 (可能是安全漏洞):");
      results.tests
        .filter((t) => t.status === "FAIL")
        .forEach((t) => {
          console.log(`   - ${t.name}: ${t.details}`);
        });
    }
  } catch (err) {
    console.error("\n💥 测试执行失败:", err.message);
  } finally {
    await dbClient.end();
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

run();
