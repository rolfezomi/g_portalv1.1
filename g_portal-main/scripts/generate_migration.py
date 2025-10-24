#!/usr/bin/env python3
"""
Generate SQL migration from machines JSON
"""

import json
from pathlib import Path

JSON_PATH = Path(__file__).parent / "machines_data.json"
OUTPUT_SQL = Path(__file__).parent.parent / "supabase" / "migrations" / "20251024_import_excel_machines.sql"

def escape_sql_string(s):
    """Escape single quotes for SQL"""
    if s is None:
        return 'NULL'
    return f"'{str(s).replace(chr(39), chr(39)+chr(39))}'"

def generate_migration():
    """Generate SQL migration from JSON data"""

    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    sql_lines = []
    sql_lines.append("-- Import machines and schedules from Excel")
    sql_lines.append("-- Generated from EK-3 YILLIK BAKIM PLANI 2024.xlsx")
    sql_lines.append("")

    # Insert machines first
    sql_lines.append("-- Insert machines")
    for machine in data['machines']:
        machine_no = escape_sql_string(machine['machine_no'])
        machine_name = escape_sql_string(machine['machine_name'])
        location = escape_sql_string(machine['location'])
        is_active = 'true' if machine['is_active'] else 'false'

        sql_lines.append(f"""
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ({machine_no}, {machine_name}, {location}, {is_active})
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
""".strip())

    sql_lines.append("")
    sql_lines.append("-- Insert maintenance schedules")

    # Insert schedules
    for machine in data['machines']:
        machine_no = escape_sql_string(machine['machine_no'])

        for schedule in machine['schedules']:
            maintenance_type = escape_sql_string(schedule['maintenance_type'])
            frequency = escape_sql_string(schedule['frequency'])
            months = '{' + ','.join(map(str, schedule['months'])) + '}'
            is_active = 'true' if schedule['is_active'] else 'false'

            sql_lines.append(f"""
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = {machine_no}),
  {maintenance_type},
  {frequency},
  '{months}'::integer[],
  {is_active}
);
""".strip())

    sql_lines.append("")
    sql_lines.append("-- Generate maintenance records for 2025")
    sql_lines.append("SELECT generate_maintenance_records_for_year(2025);")

    # Write SQL file
    OUTPUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_SQL, 'w', encoding='utf-8') as f:
        f.write('\n'.join(sql_lines))

    print(f"SQL migration generated: {OUTPUT_SQL}")
    print(f"  Machines: {len(data['machines'])}")
    print(f"  Schedules: {sum(len(m['schedules']) for m in data['machines'])}")
    return str(OUTPUT_SQL)

if __name__ == '__main__':
    generate_migration()
