#!/usr/bin/env python3
"""
Offline Bakım Takvim Analizi
JSON dosyasından verileri okuyup analiz eder (database bağlantısı gerektirmez)
"""

import json
import sys
from pathlib import Path
from analysis_tools import MaintenanceCalendar, MONTH_NAMES_TR

def main():
    json_file = "machines_data.json"

    if not Path(json_file).exists():
        print(f"❌ {json_file} bulunamadı!")
        return 1

    # JSON'dan veriyi yükle
    with open(json_file, 'r', encoding='utf-8') as f:
        data = json.load(f)

    machines = data.get('machines', [])

    if not machines:
        print("⚠️  JSON dosyasında makine bulunamadı!")
        return 1

    print("\n" + "="*80)
    print(f"BAKIM TAKVİMİ ANALİZİ (JSON: {json_file})")
    print("="*80)
    print(f"\nToplam Makine: {len(machines)}")

    # Kullanıcı seçimi
    print("\nNe yapmak istersiniz?")
    print("  1) Tüm makinelerin haftalık takvimini göster")
    print("  2) Belirli bir makineyi göster")
    print("  3) İstatistikler")
    print("  4) Aylık yoğunluk analizi")

    choice = input("\nSeçiminiz (1-4): ").strip()

    if choice == '1':
        show_all_calendars(machines)
    elif choice == '2':
        show_specific_machine(machines)
    elif choice == '3':
        show_statistics(machines)
    elif choice == '4':
        show_monthly_analysis(machines)
    else:
        print("❌ Geçersiz seçim!")

    return 0


def show_all_calendars(machines):
    """Tüm makinelerin takvimini göster"""
    print("\n" + "="*80)
    print("TÜM MAKİNELER - HAFTALIK TAKVİM")
    print("="*80)

    compact = input("\nKısa format kullanılsın mı? (E/h): ").strip().lower() in ['e', 'evet']

    for machine_data in machines:
        machine = {
            'machine_no': machine_data['machine_no'],
            'machine_name': machine_data['machine_name']
        }
        schedules = machine_data.get('schedules', [])

        calendar_data = MaintenanceCalendar.generate_machine_calendar(
            machine, schedules, year=2025
        )

        MaintenanceCalendar.print_machine_calendar(calendar_data, compact=compact)

        input("\nDevam için Enter...")


def show_specific_machine(machines):
    """Belirli bir makineyi göster"""
    machine_no = input("\nMakine No: ").strip().upper()

    found = None
    for m in machines:
        if m['machine_no'].upper() == machine_no:
            found = m
            break

    if not found:
        print(f"\nMakine '{machine_no}' bulunamadi!")
        return

    machine = {
        'machine_no': found['machine_no'],
        'machine_name': found['machine_name']
    }
    schedules = found.get('schedules', [])

    calendar_data = MaintenanceCalendar.generate_machine_calendar(
        machine, schedules, year=2025
    )

    MaintenanceCalendar.print_machine_calendar(calendar_data, compact=False)


def show_statistics(machines):
    """İstatistikleri göster"""
    print("\n" + "="*80)
    print("İSTATİSTİKLER")
    print("="*80)

    total_machines = len(machines)
    total_schedules = sum(len(m.get('schedules', [])) for m in machines)
    machines_without_schedules = sum(1 for m in machines if not m.get('schedules'))

    print(f"\nGenel:")
    print(f"   Toplam Makine            : {total_machines}")
    print(f"   Toplam Bakim Periyodu    : {total_schedules}")
    print(f"   Periyodu Olmayan Makine  : {machines_without_schedules}")

    # Frequency dagilimi
    freq_count = {}
    type_count = {}

    for machine in machines:
        for schedule in machine.get('schedules', []):
            freq = schedule.get('frequency', 'unknown')
            freq_count[freq] = freq_count.get(freq, 0) + 1

            mtype = schedule.get('maintenance_type', 'unknown')
            type_count[mtype] = type_count.get(mtype, 0) + 1

    print(f"\nFrequency Dagilimi:")
    for freq, count in sorted(freq_count.items()):
        print(f"   {freq:<15} : {count:>3} periyot")

    print(f"\nBakim Tipi Dagilimi:")
    for mtype, count in sorted(type_count.items()):
        print(f"   {mtype:<15} : {count:>3} periyot")


def show_monthly_analysis(machines):
    """Aylık yoğunluk analizi"""
    # Tüm schedule'ları düz listeye çevir
    all_schedules = []
    for machine in machines:
        for schedule in machine.get('schedules', []):
            schedule_with_machine = schedule.copy()
            schedule_with_machine['machine_no'] = machine['machine_no']
            schedule_with_machine['machine_name'] = machine['machine_name']
            all_schedules.append(schedule_with_machine)

    summary = MaintenanceCalendar.generate_monthly_summary(all_schedules, year=2025)
    MaintenanceCalendar.print_monthly_summary(summary)


if __name__ == '__main__':
    sys.exit(main())
