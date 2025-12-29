const { Client } = require('pg');
const fs = require('fs');

const client = new Client({
    host: 'db.wmippjaacispjsltjfof.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'aOn9h7xgRVtXb9fS',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('✅ Connected to Supabase database for AI Settings Migration\n');

        const sql = fs.readFileSync('./supabase_ai_settings.sql', 'utf8');

        try {
            await client.query(sql);
            console.log('✅ Executed supabase_ai_settings.sql successfully');
        } catch (err) {
            console.error('❌ Error executing SQL:', err.message);
        }

        console.log('\n🎉 AI Settings initialization complete!');
    } catch (err) {
        console.error('❌ Connection Error:', err.message);
    } finally {
        await client.end();
    }
}

run();
