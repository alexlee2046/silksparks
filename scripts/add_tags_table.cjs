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
        console.log('✅ Connected to Supabase database for Tags Migration\n');

        const sql = fs.readFileSync('./supabase_tags.sql', 'utf8');

        // Split by semicolon but ignore semicolons inside quotes if simple splitting fails, 
        // but for this simple SQL, simple split is fine.
        // Actually, let's try running it as one block if possible, or split strictly.
        // pg library usually supports multiple statements in one query call if allows multiline.
        // Let's try executing the whole thing first, creating table and inserts.

        try {
            await client.query(sql);
            console.log('✅ Executed supabase_tags.sql successfully');
        } catch (err) {
            console.error('⚠ Failed to execute SQL block. Trying statement by statement...');
            const statements = sql.split(';').filter(s => s.trim());
            for (const statement of statements) {
                if (statement.trim()) {
                    try {
                        await client.query(statement);
                        console.log('✓ Executed:', statement.substring(0, 50) + '...');
                    } catch (innerErr) {
                        // Ignore "already exists" errors
                        if (innerErr.code === '42P07' || innerErr.code === '23505') {
                            console.log('⚠ Skipped (Already exists):', statement.substring(0, 50) + '...');
                        } else {
                            console.error('❌ Error executing statement:', innerErr.message);
                        }
                    }
                }
            }
        }

        console.log('\n🎉 Tags initialization complete!');
    } catch (err) {
        console.error('❌ Connection Error:', err.message);
    } finally {
        await client.end();
    }
}

run();
