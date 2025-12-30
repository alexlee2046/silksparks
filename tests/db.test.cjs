/**
 * Silk & Spark - 全面 E2E 测试套件
 *
 * 测试内容：
 * 1. 数据库连接和表结构
 * 2. CRUD 操作
 * 3. RLS 权限策略
 * 4. 数据完整性
 */

const { Client } = require("pg");

const client = new Client({
  host: "db.wmippjaacispjsltjfof.supabase.co",
  port: 5432,
  user: "postgres",
  password: "aOn9h7xgRVtXb9fS",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

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

async function testDatabaseConnection() {
  console.log("\n📦 === 数据库连接测试 ===\n");

  try {
    await client.connect();
    log("PASS", "数据库连接", "Supabase PostgreSQL 连接成功");

    const res = await client.query("SELECT version()");
    log("PASS", "数据库版本", res.rows[0].version.substring(0, 50));
  } catch (err) {
    log("FAIL", "数据库连接", err.message);
    throw err;
  }
}

async function testTableStructure() {
  console.log("\n📊 === 表结构验证 ===\n");

  const requiredTables = [
    "profiles",
    "system_settings",
    "currencies",
    "shipping_zones",
    "shipping_rates",
    "products",
    "experts",
    "consultations",
    "orders",
    "order_items",
    "archives",
  ];

  for (const table of requiredTables) {
    try {
      const res = await client.query(
        `
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      `,
        [table],
      );

      if (parseInt(res.rows[0].count) > 0) {
        log("PASS", `表存在: ${table}`);
      } else {
        log("FAIL", `表不存在: ${table}`);
      }
    } catch (err) {
      log("FAIL", `检查表 ${table}`, err.message);
    }
  }
}

async function testDataIntegrity() {
  console.log("\n🔍 === 数据完整性测试 ===\n");

  // 货币数据
  try {
    const res = await client.query("SELECT * FROM currencies");
    log("PASS", `货币数据`, `${res.rows.length} 条记录`);

    if (res.rows.length >= 4) {
      log("PASS", "货币数量正确", "至少 4 种货币");
    } else {
      log("FAIL", "货币数量不足", `期望 >= 4, 实际 ${res.rows.length}`);
    }

    // 检查默认货币
    const defaultCurrency = res.rows.find((c) => c.is_default);
    if (defaultCurrency) {
      log(
        "PASS",
        "默认货币设置",
        `${defaultCurrency.code} - ${defaultCurrency.name}`,
      );
    } else {
      log("FAIL", "默认货币设置", "没有设置默认货币");
    }
  } catch (err) {
    log("FAIL", "货币数据查询", err.message);
  }

  // 产品数据
  try {
    const res = await client.query("SELECT * FROM products");
    log("PASS", `产品数据`, `${res.rows.length} 条记录`);

    // 验证必填字段
    const valid = res.rows.every((p) => p.title && p.price !== null);
    if (valid) {
      log("PASS", "产品数据完整", "所有产品有标题和价格");
    } else {
      log("FAIL", "产品数据不完整", "存在缺少标题或价格的产品");
    }
  } catch (err) {
    log("FAIL", "产品数据查询", err.message);
  }

  // 专家数据
  try {
    const res = await client.query("SELECT * FROM experts");
    log("PASS", `专家数据`, `${res.rows.length} 条记录`);

    // 检查在线专家
    const online = res.rows.filter((e) => e.is_online);
    log("PASS", "在线专家", `${online.length} 位在线`);

    // 验证评分范围
    const validRatings = res.rows.every((e) => e.rating >= 0 && e.rating <= 5);
    if (validRatings) {
      log("PASS", "专家评分范围", "所有评分在 0-5 之间");
    } else {
      log("FAIL", "专家评分范围", "存在无效评分");
    }
  } catch (err) {
    log("FAIL", "专家数据查询", err.message);
  }

  // 运费区域和费率
  try {
    const zones = await client.query("SELECT * FROM shipping_zones");
    const rates = await client.query("SELECT * FROM shipping_rates");

    log("PASS", "运费区域", `${zones.rows.length} 个区域`);
    log("PASS", "运费费率", `${rates.rows.length} 种费率`);

    // 检查外键关系
    const validFK = rates.rows.every((r) =>
      zones.rows.some((z) => z.id === r.zone_id),
    );
    if (validFK) {
      log("PASS", "运费外键关系", "所有费率关联有效区域");
    } else {
      log("FAIL", "运费外键关系", "存在无效的区域关联");
    }
  } catch (err) {
    log("FAIL", "运费数据查询", err.message);
  }
}

async function testCRUDOperations() {
  console.log("\n✏️ === CRUD 操作测试 ===\n");

  let testProductId = null;

  // CREATE
  try {
    const res = await client.query(`
      INSERT INTO products (title, price, element, category, description)
      VALUES ('Test Crystal', 99.99, 'Spirit', 'Test', 'E2E Test Product')
      RETURNING id
    `);
    testProductId = res.rows[0].id;
    log("PASS", "CREATE 产品", `ID: ${testProductId}`);
  } catch (err) {
    log("FAIL", "CREATE 产品", err.message);
  }

  // READ
  if (testProductId) {
    try {
      const res = await client.query("SELECT * FROM products WHERE id = $1", [
        testProductId,
      ]);
      if (res.rows.length === 1 && res.rows[0].title === "Test Crystal") {
        log("PASS", "READ 产品", "数据正确");
      } else {
        log("FAIL", "READ 产品", "数据不匹配");
      }
    } catch (err) {
      log("FAIL", "READ 产品", err.message);
    }
  }

  // UPDATE
  if (testProductId) {
    try {
      await client.query(
        `
        UPDATE products SET price = 149.99 WHERE id = $1
      `,
        [testProductId],
      );

      const res = await client.query(
        "SELECT price FROM products WHERE id = $1",
        [testProductId],
      );
      if (parseFloat(res.rows[0].price) === 149.99) {
        log("PASS", "UPDATE 产品", "价格更新为 149.99");
      } else {
        log("FAIL", "UPDATE 产品", "价格未更新");
      }
    } catch (err) {
      log("FAIL", "UPDATE 产品", err.message);
    }
  }

  // DELETE
  if (testProductId) {
    try {
      await client.query("DELETE FROM products WHERE id = $1", [testProductId]);

      const res = await client.query("SELECT * FROM products WHERE id = $1", [
        testProductId,
      ]);
      if (res.rows.length === 0) {
        log("PASS", "DELETE 产品", "测试数据已清理");
      } else {
        log("FAIL", "DELETE 产品", "数据未删除");
      }
    } catch (err) {
      log("FAIL", "DELETE 产品", err.message);
    }
  }
}

async function testRLSPolicies() {
  console.log("\n🔐 === RLS 策略验证 ===\n");

  const tables = ["profiles", "archives", "orders", "products", "experts"];

  for (const table of tables) {
    try {
      const res = await client.query(
        `
        SELECT relrowsecurity FROM pg_class 
        WHERE relname = $1 AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      `,
        [table],
      );

      if (res.rows.length > 0 && res.rows[0].relrowsecurity) {
        log("PASS", `RLS 启用: ${table}`);
      } else {
        log("FAIL", `RLS 未启用: ${table}`);
      }
    } catch (err) {
      log("FAIL", `RLS 检查: ${table}`, err.message);
    }
  }

  // 检查策略数量
  try {
    const res = await client.query(`
      SELECT schemaname, tablename, policyname FROM pg_policies 
      WHERE schemaname = 'public'
    `);
    log("PASS", "RLS 策略数量", `${res.rows.length} 条策略`);

    // 输出策略详情
    res.rows.forEach((p) => {
      console.log(`   📋 ${p.tablename}: ${p.policyname}`);
    });
  } catch (err) {
    log("FAIL", "RLS 策略查询", err.message);
  }
}

async function testIndexesAndConstraints() {
  console.log("\n🔗 === 索引和约束测试 ===\n");

  // 检查主键
  try {
    const res = await client.query(`
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY' 
        AND tc.table_schema = 'public'
    `);
    log("PASS", "主键约束", `${res.rows.length} 个表有主键`);
  } catch (err) {
    log("FAIL", "主键约束检查", err.message);
  }

  // 检查外键
  try {
    const res = await client.query(`
      SELECT tc.table_name, kcu.column_name, ccu.table_name AS foreign_table
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_schema = 'public'
    `);
    log("PASS", "外键约束", `${res.rows.length} 个外键关系`);
  } catch (err) {
    log("FAIL", "外键约束检查", err.message);
  }

  // 检查唯一约束
  try {
    const res = await client.query(`
      SELECT table_name, column_name
      FROM information_schema.constraint_column_usage
      WHERE constraint_name LIKE '%_key' AND table_schema = 'public'
    `);
    log("PASS", "唯一约束", `${res.rows.length} 个唯一约束`);
  } catch (err) {
    log("FAIL", "唯一约束检查", err.message);
  }
}

async function testQueryPerformance() {
  console.log("\n⚡ === 查询性能测试 ===\n");

  const queries = [
    {
      name: "产品列表",
      sql: "SELECT * FROM products ORDER BY created_at DESC",
    },
    {
      name: "专家列表",
      sql: "SELECT * FROM experts WHERE is_online = true ORDER BY rating DESC",
    },
    { name: "货币列表", sql: "SELECT * FROM currencies ORDER BY id" },
    {
      name: "运费区域联表",
      sql: "SELECT sz.*, sr.name as rate_name, sr.price FROM shipping_zones sz LEFT JOIN shipping_rates sr ON sz.id = sr.zone_id",
    },
  ];

  for (const q of queries) {
    const start = Date.now();
    try {
      await client.query(q.sql);
      const time = Date.now() - start;
      if (time < 100) {
        log("PASS", `查询: ${q.name}`, `${time}ms`);
      } else if (time < 500) {
        log("PASS", `查询: ${q.name}`, `${time}ms (可优化)`);
      } else {
        log("FAIL", `查询: ${q.name}`, `${time}ms (太慢)`);
      }
    } catch (err) {
      log("FAIL", `查询: ${q.name}`, err.message);
    }
  }
}

async function run() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     🔮 Silk & Spark - 数据库 E2E 测试套件                 ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  try {
    await testDatabaseConnection();
    await testTableStructure();
    await testDataIntegrity();
    await testCRUDOperations();
    await testRLSPolicies();
    await testIndexesAndConstraints();
    await testQueryPerformance();

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
  } finally {
    await client.end();
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

run();
