const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

// Credentials from init-db.js
const client = new Client({
  host: "db.wmippjaacispjsltjfof.supabase.co",
  port: 5432,
  user: "postgres",
  password: "aOn9h7xgRVtXb9fS",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const sqlFile = process.argv[2];
  if (!sqlFile) {
    console.error("Please provide a SQL file path");
    process.exit(1);
  }

  const filePath = path.resolve(process.cwd(), sqlFile);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  try {
    await client.connect();
    console.log("Connected to Supabase database");

    const sql = fs.readFileSync(filePath, "utf8");
    const statements = sql.split(";").filter((s) => s.trim());

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
          console.log(
            "✓ Executed:",
            statement.substring(0, 50).replace(/\n/g, " ") + "...",
          );
        } catch (err) {
          console.log(
            "⚠ Error executing statement:",
            statement.substring(0, 50).replace(/\n/g, " ") + "...",
            err.message,
          );
        }
      }
    }

    console.log("\n✅ SQL execution complete!");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
