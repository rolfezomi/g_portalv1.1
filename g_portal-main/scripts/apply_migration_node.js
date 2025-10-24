const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Supabase config
const SUPABASE_URL = 'https://mignlffeyougoefuyayr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTY5NzkwNSwiZXhwIjoyMDU3MjczOTA1fQ.D7y7m7TxVnrLMc0HNOyRV_NvNf8-2fRy6dMAvdM-VDE';

const MIGRATION_FILE = path.join(__dirname, '..', 'supabase', 'migrations', '20251024_import_excel_machines.sql');

async function applyMigration() {
  // Read migration SQL
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf-8');

  console.log(`Applying migration: ${path.basename(MIGRATION_FILE)}`);
  console.log(`SQL length: ${sql.length} characters`);

  // Create Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Split into statements and execute
  const statements = sql
    .split('\n')
    .filter(line => line.trim() && !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .filter(stmt => stmt.trim());

  console.log(`Total statements: ${statements.length}`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim() + ';';
    if (!stmt || stmt === ';') continue;

    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
    console.log(stmt.substring(0, 80) + '...');

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt });

    if (error) {
      console.error(`Error: ${error.message}`);
      // Continue with next statement
    } else {
      console.log('Success');
    }
  }

  console.log('\nMigration completed!');
}

applyMigration().catch(console.error);
