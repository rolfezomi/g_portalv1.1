#!/usr/bin/env python3
"""
Supabase'deki machines ve maintenance_schedules tablolarını oku
"""

from supabase import create_client, Client
import json

# Supabase config
SUPABASE_URL = "https://mignlffeyougoefuyayr.supabase.co"
SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pZ25sZmZleW91Z29lZnV5YXlyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTY5NzkwNSwiZXhwIjoyMDU3MjczOTA1fQ.D7y7m7TxVnrLMc0HNOyRV_NvNf8-2fRy6dMAvdM-VDE"

def read_machines():
    """Supabase'den tum makineleri ve schedule'larini oku"""

    # Supabase client olustur
    supabase: Client = create_client(SUPABASE_URL, SERVICE_ROLE_KEY)

    print("="*80)
    print("SUPABASE MACHINES TABLOSU")
    print("="*80)

    # Machines tablosunu oku
    response = supabase.table('machines').select('*').order('machine_no').execute()
    machines = response.data

    print(f"\nToplam Makine: {len(machines)}")
    print("\nMakineler:")
    print("-" * 80)

    for i, machine in enumerate(machines, 1):
        print(f"{i:2}. {machine['machine_no']:15} | {machine['machine_name']}")

    # Maintenance schedules tablosunu oku
    print("\n" + "="*80)
    print("MAINTENANCE SCHEDULES TABLOSU")
    print("="*80)

    response = supabase.table('maintenance_schedules').select('*, machines(machine_no, machine_name)').execute()
    schedules = response.data

    print(f"\nToplam Schedule: {len(schedules)}")

    # Frequency dagilimi
    freq_count = {}
    for schedule in schedules:
        freq = schedule.get('frequency', 'unknown')
        freq_count[freq] = freq_count.get(freq, 0) + 1

    print("\nFrequency Dagilimi:")
    for freq, count in sorted(freq_count.items()):
        print(f"  {freq:15} : {count:3} schedule")

    # Maintenance type dagilimi
    type_count = {}
    for schedule in schedules:
        mtype = schedule.get('maintenance_type', 'unknown')
        type_count[mtype] = type_count.get(mtype, 0) + 1

    print("\nMaintenance Type Dagilimi:")
    for mtype, count in sorted(type_count.items()):
        print(f"  {mtype:15} : {count:3} schedule")

    # Detayli schedule listesi
    print("\n" + "="*80)
    print("DETAYLI SCHEDULE LISTESI")
    print("="*80)
    print(f"{'Makine No':<15} {'Makine Adi':<35} {'Tip':<15} {'Periyot':<12} {'Aylar'}")
    print("-" * 120)

    for schedule in schedules:
        machine_no = schedule['machines']['machine_no'] if schedule.get('machines') else 'N/A'
        machine_name = schedule['machines']['machine_name'] if schedule.get('machines') else 'N/A'
        mtype = schedule.get('maintenance_type', 'N/A')
        freq = schedule.get('frequency', 'N/A')
        months = schedule.get('months', [])
        months_str = ','.join(map(str, months)) if months else 'N/A'

        # Uzun isimleri kisalt
        if len(machine_name) > 33:
            machine_name = machine_name[:30] + '...'

        print(f"{machine_no:<15} {machine_name:<35} {mtype:<15} {freq:<12} {months_str}")

    # Schedule olmayan makineleri bul
    print("\n" + "="*80)
    print("SCHEDULE OLMAYAN MAKINELER")
    print("="*80)

    machines_with_schedules = set()
    for schedule in schedules:
        if schedule.get('machines'):
            machines_with_schedules.add(schedule['machines']['machine_no'])

    machines_without_schedules = []
    for machine in machines:
        if machine['machine_no'] not in machines_with_schedules:
            machines_without_schedules.append(machine)

    if machines_without_schedules:
        print(f"\nSchedule'i olmayan {len(machines_without_schedules)} makine bulundu:")
        for machine in machines_without_schedules:
            print(f"  - {machine['machine_no']:15} | {machine['machine_name']}")
    else:
        print("\nTum makinelerin schedule'i var!")

    # JSON olarak kaydet
    output_data = {
        "machines": machines,
        "schedules": schedules,
        "stats": {
            "total_machines": len(machines),
            "total_schedules": len(schedules),
            "machines_without_schedules": len(machines_without_schedules),
            "by_frequency": freq_count,
            "by_type": type_count
        }
    }

    output_file = "supabase_machines_full.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"\n\nVeriler {output_file} dosyasina kaydedildi.")

if __name__ == '__main__':
    try:
        read_machines()
    except Exception as e:
        print(f"\nHATA: {e}")
        import traceback
        traceback.print_exc()
