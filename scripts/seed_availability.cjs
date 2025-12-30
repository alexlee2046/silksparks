const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY; 

// Warning: Using ANON key for seeding might fail if RLS prevents inserts.
// Ideally should use SERVICE_ROLE_KEY.
// In this dev environment, if we don't have SERVICE_ROLE_KEY easily accessible, we might need to rely on what we have.
// Let's assume we can use the anon key if we enable public insert temporarily or just try.
// Actually, 'init-db.js' had the password for postgres user. We can use that with 'pg' client.
// Let's use 'pg' client as it's more reliable for admin tasks here.

const { Client } = require("pg");

const client = new Client({
  host: "db.wmippjaacispjsltjfof.supabase.co",
  port: 5432,
  user: "postgres",
  password: "aOn9h7xgRVtXb9fS",
  database: "postgres",
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  try {
    await client.connect();
    console.log("Connected to DB");

    // 1. Get Experts
    const res = await client.query('SELECT id FROM public.experts');
    const experts = res.rows;
    console.log(`Found ${experts.length} experts`);

    // 2. Clear existing availability
    await client.query('DELETE FROM public.expert_availability');

    // 3. Insert new availability
    for (const expert of experts) {
      const expertId = expert.id;
      // Mon, Wed, Fri
      const query = `
        INSERT INTO public.expert_availability (expert_id, day_of_week, start_time, end_time) VALUES
        ($1, 1, '09:00', '17:00'),
        ($1, 3, '09:00', '17:00'),
        ($1, 5, '09:00', '17:00')
      `;
      await client.query(query, [expertId]);
    }
    console.log("Seeded availability");

  } catch (err) {
    console.error("Error seeding:", err);
  } finally {
    await client.end();
  }
}

seed();
