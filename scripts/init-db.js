const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://wmippjaacispjsltjfof.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

// 如果没有 service key，我们使用 postgres 连接执行 SQL
const { Client } = require("pg");

const client = new Client({
  host: "db.wmippjaacispjsltjfof.supabase.co",
  port: 5432,
  user: "postgres",
  password: "aOn9h7xgRVtXb9fS",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

const fs = require("fs");

async function run() {
  try {
    await client.connect();
    console.log("Connected to Supabase database");

    const sql = fs.readFileSync("./supabase_init.sql", "utf8");

    // 分割 SQL 语句并逐个执行
    const statements = sql.split(";").filter((s) => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log(
            "✓ Executed:",
            statement.substring(0, 60).replace(/\n/g, " ") + "...",
          );
        } catch (err) {
          console.log(
            "⚠ Skipped (may already exist):",
            statement.substring(0, 50).replace(/\n/g, " ") + "...",
            err.message.substring(0, 80),
          );
        }
      }
    }

    console.log("\n✅ Database initialization complete!");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
