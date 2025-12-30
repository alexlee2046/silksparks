const { Client } = require("pg");

const client = new Client({
  host: "db.wmippjaacispjsltjfof.supabase.co",
  port: 5432,
  user: "postgres",
  password: "aOn9h7xgRVtXb9fS",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected\n");

    const statements = [
      `CREATE POLICY "禁止匿名更新产品" ON public.products FOR UPDATE USING (false)`,
      `CREATE POLICY "禁止匿名删除产品" ON public.products FOR DELETE USING (false)`,
      `CREATE POLICY "禁止匿名插入产品" ON public.products FOR INSERT WITH CHECK (false)`,
      `CREATE POLICY "禁止匿名更新专家" ON public.experts FOR UPDATE USING (false)`,
    ];

    for (const sql of statements) {
      try {
        await client.query(sql);
        console.log("✓", sql.substring(0, 60) + "...");
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log("⏭️ Already exists:", sql.substring(15, 50) + "...");
        } else {
          console.log("⚠", err.message.substring(0, 60));
        }
      }
    }

    console.log("\n✅ Done!");
  } catch (err) {
    console.error("❌", err.message);
  } finally {
    await client.end();
  }
}

run();
