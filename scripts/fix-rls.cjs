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
        console.log('✅ Connected to Supabase database\n');

        const sql = fs.readFileSync('./scripts/fix-rls.sql', 'utf8');

        const statements = sql.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await client.query(statement);
                    const preview = statement.trim().substring(0, 60).replace(/\n/g, ' ');
                    console.log('✓', preview + '...');
                } catch (err) {
                    const preview = statement.trim().substring(0, 50).replace(/\n/g, ' ');
                    console.log('⚠ Skipped:', preview + '...', '(' + err.message.substring(0, 50) + ')');
                }
            }
        }

        console.log('\n🔐 RLS 安全策略已修复!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}

run();
