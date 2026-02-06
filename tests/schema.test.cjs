/**
 * Schema Validation Test
 *
 * Validates that TypeScript types in types/database.ts match the actual
 * database schema. This prevents type mismatch bugs like the `name` vs `title`
 * issue in the products table.
 *
 * Run: node tests/schema.test.cjs
 */

const { Client } = require("pg");
require("dotenv").config({ path: ".env.test" });

// Expected schema from types/database.ts
const EXPECTED_SCHEMA = {
  products: {
    required: ["id", "title", "price", "created_at", "rating", "review_count"],
    optional: ["element", "image_url", "badge", "category", "description", "vibe", "ritual", "wisdom"],
    // Columns that should NOT exist (common mistakes)
    forbidden: ["name", "featured", "stock", "updated_at"],
  },
  profiles: {
    required: ["id", "points", "tier", "is_admin", "created_at"],
    optional: ["email", "full_name", "birth_date", "birth_time", "birth_place", "lat", "lng", "preferences", "updated_at"],
    forbidden: [],
  },
  orders: {
    required: ["id", "user_id", "total", "currency", "status", "payment_status", "created_at"],
    optional: ["stripe_checkout_session_id", "stripe_payment_intent_id", "shipping_address", "updated_at"],
    forbidden: [],
  },
  experts: {
    required: ["id", "name", "price_per_min", "review_count", "featured", "created_at"],
    optional: ["title", "bio", "avatar_url", "specialties", "rating", "updated_at"],
    // Note: experts use "is_online" in some queries but schema might differ
    forbidden: [],
  },
  archives: {
    required: ["id", "user_id", "type", "title", "content", "created_at"],
    optional: ["summary", "image_url"],
    forbidden: [],
  },
};

// Validate required environment variables
const requiredEnvVars = ["SUPABASE_DB_HOST", "SUPABASE_DB_PASSWORD"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    console.error("Please copy .env.test.example to .env.test and fill in your values");
    process.exit(1);
  }
}

const client = new Client({
  host: process.env.SUPABASE_DB_HOST,
  port: parseInt(process.env.SUPABASE_DB_PORT || "5432"),
  user: process.env.SUPABASE_DB_USER || "postgres",
  password: process.env.SUPABASE_DB_PASSWORD,
  database: process.env.SUPABASE_DB_NAME || "postgres",
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

async function getTableColumns(tableName) {
  const res = await client.query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);

  return res.rows.map(r => r.column_name);
}

async function testSchemaMatch() {
  console.log("\n🔍 === TypeScript/Database Schema Validation ===\n");

  for (const [tableName, schema] of Object.entries(EXPECTED_SCHEMA)) {
    console.log(`\n📋 Table: ${tableName}`);

    try {
      const actualColumns = await getTableColumns(tableName);

      if (actualColumns.length === 0) {
        log("FAIL", `${tableName}: Table not found`);
        continue;
      }

      // Check required columns exist
      for (const col of schema.required) {
        if (actualColumns.includes(col)) {
          log("PASS", `${tableName}.${col}`, "required column exists");
        } else {
          log("FAIL", `${tableName}.${col}`, "REQUIRED column MISSING in database!");
        }
      }

      // Check optional columns (warn if missing but don't fail)
      for (const col of schema.optional) {
        if (actualColumns.includes(col)) {
          log("PASS", `${tableName}.${col}`, "optional column exists");
        } else {
          console.log(`⚠️  ${tableName}.${col}: optional column not in database (may be OK)`);
        }
      }

      // Check forbidden columns (these indicate type definition is wrong)
      for (const col of schema.forbidden) {
        if (actualColumns.includes(col)) {
          log("FAIL", `${tableName}.${col}`, "FORBIDDEN column EXISTS - TypeScript types are WRONG!");
        } else {
          log("PASS", `${tableName}.${col}`, "forbidden column correctly absent");
        }
      }

      // Report any unexpected columns in database
      const allExpected = [...schema.required, ...schema.optional, ...schema.forbidden];
      const unexpected = actualColumns.filter(c => !allExpected.includes(c));
      if (unexpected.length > 0) {
        console.log(`ℹ️  ${tableName}: Unexpected columns in DB (may need to add to types): ${unexpected.join(", ")}`);
      }

    } catch (err) {
      log("FAIL", `${tableName}`, err.message);
    }
  }
}

async function testProductsTableSpecific() {
  console.log("\n🛍️ === Products Table Critical Checks ===\n");
  console.log("(These are the exact issues that caused the recent bug)\n");

  try {
    const columns = await getTableColumns("products");

    // Critical: "title" must exist, "name" must NOT
    if (columns.includes("title")) {
      log("PASS", "products.title exists", "Use 'title' not 'name' in code");
    } else {
      log("FAIL", "products.title MISSING", "Database uses different column name!");
    }

    if (columns.includes("name")) {
      log("FAIL", "products.name EXISTS", "Code incorrectly uses 'name' - should use 'title'!");
    } else {
      log("PASS", "products.name absent", "Correct - no 'name' column");
    }

    // Critical: "badge" must exist, "featured" must NOT
    if (columns.includes("badge")) {
      log("PASS", "products.badge exists", "Use 'badge' (string) not 'featured' (boolean)");
    } else {
      log("FAIL", "products.badge MISSING", "Database uses different column!");
    }

    if (columns.includes("featured")) {
      log("FAIL", "products.featured EXISTS", "Code incorrectly uses 'featured' - should use 'badge'!");
    } else {
      log("PASS", "products.featured absent", "Correct - no 'featured' column");
    }

    // Verify created_at exists for sorting
    if (columns.includes("created_at")) {
      log("PASS", "products.created_at exists", "Sorting by created_at will work");
    } else {
      log("FAIL", "products.created_at MISSING", "Cannot sort by created_at!");
    }

  } catch (err) {
    log("FAIL", "Products table check", err.message);
  }
}

async function testSelectQueries() {
  console.log("\n🔎 === Query Validation ===\n");

  const queries = [
    {
      name: "Products list query",
      sql: "SELECT id, title, price, element, image_url, badge, category, description, created_at FROM products LIMIT 1",
    },
    {
      name: "Products with sorting",
      sql: "SELECT * FROM products ORDER BY created_at DESC LIMIT 1",
    },
    {
      name: "Experts list query",
      sql: "SELECT id, name, title, bio, avatar_url, specialties, price_per_min, rating, review_count, featured FROM experts LIMIT 1",
    },
    {
      name: "Orders with user",
      sql: "SELECT id, user_id, total, currency, status, payment_status FROM orders LIMIT 1",
    },
  ];

  for (const q of queries) {
    try {
      await client.query(q.sql);
      log("PASS", q.name, "Query executes successfully");
    } catch (err) {
      log("FAIL", q.name, `Query failed: ${err.message}`);
    }
  }
}

async function run() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║     🔮 Schema Validation Test - TypeScript vs Database       ║");
  console.log("╚══════════════════════════════════════════════════════════════╝");

  try {
    await client.connect();
    console.log("✅ Database connected\n");

    await testProductsTableSpecific();
    await testSchemaMatch();
    await testSelectQueries();

    console.log("\n╔══════════════════════════════════════════════════════════════╗");
    console.log(`║  📊 Results: ${results.passed} passed / ${results.failed} failed`);
    console.log("╚══════════════════════════════════════════════════════════════╝\n");

    if (results.failed > 0) {
      console.log("❌ Failed tests:");
      results.tests
        .filter(t => t.status === "FAIL")
        .forEach(t => {
          console.log(`   - ${t.name}: ${t.details}`);
        });
      console.log("\n⚠️  Schema mismatch detected! Update types/database.ts to match actual database schema.");
    } else {
      console.log("✅ All schema validations passed! TypeScript types match database schema.");
    }

  } catch (err) {
    console.error("\n💥 Test execution failed:", err.message);
  } finally {
    await client.end();
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

run();
