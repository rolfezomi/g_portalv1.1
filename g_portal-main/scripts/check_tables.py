#!/usr/bin/env python3
"""
Supabase tablolarının gerçek yapısını kontrol et
"""

import psycopg2
from psycopg2.extras import RealDictCursor

# Direct PostgreSQL connection
connection_params = {
    'host': 'db.mignlffeyougoefuyayr.supabase.co',
    'port': 5432,
    'database': 'postgres',
    'user': 'postgres',
    'password': 'Ugur.onar007670',
    'sslmode': 'require'
}

def check_table_structure(table_name):
    """Tablo yapısını kontrol et"""
    print(f"\n{'='*80}")
    print(f"TABLO: {table_name}")
    print('='*80)

    conn = psycopg2.connect(**connection_params)
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    # Tablo kolonlarını getir
    query = """
        SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_name = %s
        ORDER BY ordinal_position;
    """

    cursor.execute(query, (table_name,))
    columns = cursor.fetchall()

    if not columns:
        print(f"⚠️  Tablo '{table_name}' bulunamadı!")
        return

    print(f"\nKolonlar ({len(columns)} adet):")
    print("-" * 80)
    for col in columns:
        nullable = "NULL" if col['is_nullable'] == 'YES' else "NOT NULL"
        default = f" DEFAULT {col['column_default']}" if col['column_default'] else ""
        print(f"  • {col['column_name']:20} {col['data_type']:15} {nullable:10} {default}")

    # İlk 3 satırı göster
    cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
    rows = cursor.fetchall()

    print(f"\nÖrnek Veri ({len(rows)} satır):")
    print("-" * 80)
    for i, row in enumerate(rows, 1):
        print(f"\nSatır {i}:")
        for key, value in dict(row).items():
            print(f"  {key}: {value}")

    cursor.close()
    conn.close()

if __name__ == '__main__':
    # İki ana tabloyu kontrol et
    check_table_structure('machines')
    check_table_structure('maintenance_schedules')
