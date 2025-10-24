#!/usr/bin/env python3
"""
Apply SQL migration directly to Supabase PostgreSQL
"""

import psycopg2
from pathlib import Path

# Supabase PostgreSQL connection string
# Format: postgresql://postgres.[project-ref]:[password]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
PROJECT_REF = "mignlffeyougoefuyayr"
DB_PASSWORD = "Glo1907@"  # Your database password
# Use direct connection (port 5432) instead of pooler for migrations
CONNECTION_STRING = f"postgresql://postgres.{PROJECT_REF}:{DB_PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require"

MIGRATION_FILE = Path(__file__).parent.parent / "supabase" / "migrations" / "20251024_import_excel_machines.sql"

def apply_migration():
    """Apply migration using PostgreSQL connection"""

    # Read migration SQL
    with open(MIGRATION_FILE, 'r', encoding='utf-8') as f:
        sql = f.read()

    print(f"Applying migration: {MIGRATION_FILE.name}")
    print(f"SQL length: {len(sql)} characters")

    try:
        # Connect to database using individual parameters
        # Using direct database connection (not pooler) for migration
        print("Connecting to Supabase PostgreSQL...")
        conn = psycopg2.connect(
            host=f"db.{PROJECT_REF}.supabase.co",
            port=5432,
            database="postgres",
            user="postgres",
            password=DB_PASSWORD,
            sslmode='require'
        )
        conn.autocommit = False  # Use transaction
        cursor = conn.cursor()

        print("Executing migration...")
        cursor.execute(sql)

        # Commit transaction
        conn.commit()
        print("Migration applied successfully!")

        # Insert into schema_migrations to track it
        cursor.execute("""
            INSERT INTO supabase_migrations.schema_migrations (version)
            VALUES ('20251024')
            ON CONFLICT (version) DO NOTHING;
        """)
        conn.commit()
        print("Migration version recorded")

        cursor.close()
        conn.close()

        return True

    except Exception as e:
        print(f"Error applying migration: {e}")
        if 'conn' in locals():
            conn.rollback()
            conn.close()
        return False

if __name__ == '__main__':
    apply_migration()
