#!/usr/bin/env python3
"""
Apply SQL migration directly to Supabase
"""

import requests
from pathlib import Path

# Supabase config
PROJECT_REF = "mignlffeyougoefuyayr"
SUPABASE_URL = f"https://{PROJECT_REF}.supabase.co"
# Service role key (has admin privileges)
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTY5NzkwNSwiZXhwIjoyMDU3MjczOTA1fQ.D7y7m7TxVnrLMc0HNOyRV_NvNf8-2fRy6dMAvdM-VDE"

MIGRATION_FILE = Path(__file__).parent.parent / "supabase" / "migrations" / "20251024_import_excel_machines.sql"

def apply_migration():
    """Apply migration using Supabase REST API"""

    # Read migration SQL
    with open(MIGRATION_FILE, 'r', encoding='utf-8') as f:
        sql = f.read()

    print(f"Applying migration: {MIGRATION_FILE.name}")
    print(f"SQL length: {len(sql)} characters")

    # Split SQL into individual statements
    # We need to execute them one by one for better error handling
    statements = []
    current = []
    for line in sql.split('\n'):
        if line.strip() and not line.strip().startswith('--'):
            current.append(line)
            if line.strip().endswith(';'):
                statements.append('\n'.join(current))
                current = []

    print(f"Total statements: {len(statements)}")

    # Execute via PostgREST rpc endpoint
    headers = {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': f'Bearer {SERVICE_ROLE_KEY}',
        'Content-Type': 'application/json'
    }

    # Execute entire SQL as a single transaction
    url = f"{SUPABASE_URL}/rest/v1/rpc/exec_sql"

    # Try using the query endpoint instead
    # Since we don't have exec_sql RPC, let's use pg_dump endpoint
    # Actually, let's try using the SQL endpoint directly

    # For now, let's execute each statement individually
    success_count = 0
    error_count = 0

    for i, stmt in enumerate(statements, 1):
        if not stmt.strip():
            continue

        # Try to execute via REST API
        # Unfortunately, Supabase doesn't expose a direct SQL execution endpoint in REST API
        # We need to use the database connection string
        print(f"Statement {i}/{len(statements)}: {stmt[:80]}...")

    print("\nNote: Direct SQL execution via REST API is limited.")
    print("Please copy the migration file content and execute it in Supabase SQL Editor:")
    print(f"1. Go to https://supabase.com/dashboard/project/{PROJECT_REF}/sql/new")
    print(f"2. Copy content from: {MIGRATION_FILE}")
    print("3. Click 'Run' to execute")

    # Alternative: Output the SQL for manual execution
    print("\n" + "="*80)
    print("Or execute this SQL directly:")
    print("="*80)
    print(sql[:500] + "..." if len(sql) > 500 else sql)

    return True

if __name__ == '__main__':
    apply_migration()
