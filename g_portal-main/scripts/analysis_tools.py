#!/usr/bin/env python3
"""
Bakım Takvimi Analiz Araçları
Haftalık takvim hesaplamaları ve raporlama
"""

import calendar
from datetime import datetime, date
from typing import List, Dict, Tuple

# Türkçe ay isimleri
MONTH_NAMES_TR = {
    1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan',
    5: 'Mayıs', 6: 'Haziran', 7: 'Temmuz', 8: 'Ağustos',
    9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık'
}

# Frequency labels
FREQUENCY_LABELS = {
    'weekly': 'Haftalık',
    'monthly': 'Aylık',
    'quarterly': '3 Aylık',
    'semi-annual': '6 Aylık',
    'annual': 'Yıllık'
}

class MaintenanceCalendar:
    """Bakım takvimi analiz sınıfı"""

    @staticmethod
    def calculate_week_from_day(day: int) -> int:
        """
        Ayın gününden hafta numarasını hesapla
        Hafta 1: 1-7
        Hafta 2: 8-14
        Hafta 3: 15-21
        Hafta 4: 22-31
        """
        if 1 <= day <= 7:
            return 1
        elif 8 <= day <= 14:
            return 2
        elif 15 <= day <= 21:
            return 3
        else:
            return 4

    @staticmethod
    def get_weeks_for_frequency(frequency: str, months: List[int]) -> Dict[int, List[int]]:
        """
        Frequency ve month bilgisine göre hangi ayın hangi haftalarına bakım düştüğünü hesapla

        Returns:
            {month: [weeks]} dictionary
            Örnek: {1: [1,2,3,4], 4: [1,2,3,4]}
        """
        weeks_by_month = {}

        if frequency == 'weekly':
            # Tüm aylar, tüm haftalar
            for month in range(1, 13):
                weeks_by_month[month] = [1, 2, 3, 4]

        elif frequency in ['monthly', 'quarterly', 'semi-annual', 'annual']:
            # Sadece belirtilen aylar, tüm haftalar
            for month in months:
                weeks_by_month[month] = [1, 2, 3, 4]

        return weeks_by_month

    @staticmethod
    def generate_machine_calendar(machine: Dict, schedules: List[Dict], year: int = 2025) -> Dict:
        """
        Bir makine için detaylı takvim oluştur

        Args:
            machine: Makine bilgisi (machine_no, machine_name)
            schedules: Schedule listesi
            year: Yıl (default 2025)

        Returns:
            {
                'machine_no': 'ÜK-1010',
                'machine_name': '3 Tonluk Mikser',
                'year': 2025,
                'schedules': [
                    {
                        'maintenance_type': 'İÇ BAKIM',
                        'frequency': 'quarterly',
                        'weeks_by_month': {1: [1,2,3,4], 4: [1,2,3,4], ...}
                    }
                ]
            }
        """
        calendar_data = {
            'machine_no': machine['machine_no'],
            'machine_name': machine['machine_name'],
            'year': year,
            'schedules': []
        }

        for schedule in schedules:
            schedule_calendar = {
                'id': schedule.get('id'),
                'maintenance_type': schedule['maintenance_type'],
                'frequency': schedule['frequency'],
                'frequency_label': FREQUENCY_LABELS.get(schedule['frequency'], schedule['frequency']),
                'months': schedule['months'],
                'weeks_by_month': MaintenanceCalendar.get_weeks_for_frequency(
                    schedule['frequency'],
                    schedule['months']
                )
            }
            calendar_data['schedules'].append(schedule_calendar)

        return calendar_data

    @staticmethod
    def print_machine_calendar(calendar_data: Dict, compact: bool = False):
        """
        Makine takvimini konsola yazdır

        Args:
            calendar_data: generate_machine_calendar() çıktısı
            compact: True ise kısa format, False ise detaylı
        """
        machine_no = calendar_data['machine_no']
        machine_name = calendar_data['machine_name']
        year = calendar_data['year']

        print("\n" + "="*80)
        print(f"MAKİNE: {machine_no} - {machine_name}")
        print(f"YIL: {year}")
        print("="*80)

        if not calendar_data['schedules']:
            print("\n  Bu makinenin bakim periyodu tanimlanmamis!\n")
            return

        for idx, schedule in enumerate(calendar_data['schedules'], 1):
            print(f"\nBAKIM {idx}: {schedule['maintenance_type']} - {schedule['frequency_label']}")
            print("   " + "-"*76)

            weeks_by_month = schedule['weeks_by_month']

            if compact:
                # Kısa format: Sadece ay isimleri
                month_names = [MONTH_NAMES_TR[m] for m in sorted(weeks_by_month.keys())]
                print(f"   Aylar: {', '.join(month_names)}")
            else:
                # Detaylı format: Her ay için hafta detayları
                for month in sorted(weeks_by_month.keys()):
                    weeks = weeks_by_month[month]
                    month_name = MONTH_NAMES_TR[month]

                    # Ayın kaç günü var
                    days_in_month = calendar.monthrange(year, month)[1]

                    week_parts = []
                    for week in weeks:
                        if week == 1:
                            week_parts.append("H1 (1-7)")
                        elif week == 2:
                            week_parts.append("H2 (8-14)")
                        elif week == 3:
                            week_parts.append("H3 (15-21)")
                        elif week == 4:
                            week_parts.append(f"H4 (22-{days_in_month})")

                    print(f"   {month_name:10} : {' | '.join(week_parts)}")

        print()

    @staticmethod
    def generate_monthly_summary(all_schedules: List[Dict], year: int = 2025) -> Dict:
        """
        Ay bazında bakım yoğunluğu özeti oluştur

        Returns:
            {
                month: {
                    'total_maintenances': count,
                    'by_frequency': {'weekly': count, 'monthly': count, ...},
                    'machines': [list of machine_no]
                }
            }
        """
        summary = {}

        for month in range(1, 13):
            summary[month] = {
                'month_name': MONTH_NAMES_TR[month],
                'total_maintenances': 0,
                'by_frequency': {},
                'machines': set()
            }

        for schedule in all_schedules:
            weeks_by_month = MaintenanceCalendar.get_weeks_for_frequency(
                schedule['frequency'],
                schedule['months']
            )

            for month in weeks_by_month.keys():
                summary[month]['total_maintenances'] += 1
                summary[month]['machines'].add(schedule['machine_no'])

                freq = schedule['frequency']
                summary[month]['by_frequency'][freq] = summary[month]['by_frequency'].get(freq, 0) + 1

        # Set'leri list'e çevir
        for month in summary:
            summary[month]['machines'] = sorted(list(summary[month]['machines']))
            summary[month]['machine_count'] = len(summary[month]['machines'])

        return summary

    @staticmethod
    def print_monthly_summary(summary: Dict):
        """Aylık özeti konsola yazdır"""
        print("\n" + "="*80)
        print("AYLIK BAKIM YOĞUNLUĞU ANALİZİ")
        print("="*80)

        print(f"\n{'Ay':<12} {'Toplam Bakım':<15} {'Makine Sayısı':<18} {'Frequency Dağılımı'}")
        print("─"*80)

        for month in range(1, 13):
            data = summary[month]
            month_name = data['month_name']
            total = data['total_maintenances']
            machine_count = data['machine_count']

            # Frequency dağılımını string olarak oluştur
            freq_parts = []
            for freq, count in sorted(data['by_frequency'].items()):
                label = FREQUENCY_LABELS.get(freq, freq)
                freq_parts.append(f"{label}:{count}")

            freq_str = ", ".join(freq_parts) if freq_parts else "-"

            print(f"{month_name:<12} {total:<15} {machine_count:<18} {freq_str}")

        print()

    @staticmethod
    def find_busy_periods(summary: Dict, threshold: int = 10) -> List[Tuple[int, int]]:
        """
        Yoğun bakım dönemlerini bul

        Args:
            summary: generate_monthly_summary() çıktısı
            threshold: Minimum bakım sayısı eşiği

        Returns:
            [(month, maintenance_count), ...] listesi
        """
        busy_months = []

        for month, data in summary.items():
            if data['total_maintenances'] >= threshold:
                busy_months.append((month, data['total_maintenances']))

        return sorted(busy_months, key=lambda x: x[1], reverse=True)

    @staticmethod
    def generate_csv_export_data(all_calendars: List[Dict]) -> List[List[str]]:
        """
        CSV export için veri hazırla

        Returns:
            [
                ['Makine No', 'Makine Adı', 'Bakım Tipi', 'Periyot', 'Ocak H1', 'Ocak H2', ...],
                ['ÜK-1010', '3 Tonluk Mikser', 'İÇ BAKIM', 'Quarterly', '✓', '✓', '✓', '✓', ...]
            ]
        """
        # Header oluştur
        header = ['Makine No', 'Makine Adı', 'Bakım Tipi', 'Periyot']

        for month in range(1, 13):
            month_name = MONTH_NAMES_TR[month]
            for week in range(1, 5):
                header.append(f"{month_name} H{week}")

        rows = [header]

        # Veri satırları
        for calendar_data in all_calendars:
            machine_no = calendar_data['machine_no']
            machine_name = calendar_data['machine_name']

            for schedule in calendar_data['schedules']:
                row = [
                    machine_no,
                    machine_name,
                    schedule['maintenance_type'],
                    schedule['frequency_label']
                ]

                # Her ay için hafta işaretlerini ekle
                weeks_by_month = schedule['weeks_by_month']

                for month in range(1, 13):
                    for week in range(1, 5):
                        if month in weeks_by_month and week in weeks_by_month[month]:
                            row.append('✓')
                        else:
                            row.append('-')

                rows.append(row)

        return rows

    @staticmethod
    def generate_statistics_report(db):
        """
        Genel istatistik raporu oluştur

        Args:
            db: MaintenanceDB instance
        """
        stats = db.get_statistics()

        print("\n" + "="*80)
        print("GENEL İSTATİSTİKLER")
        print("="*80)

        print(f"\n📊 Makine ve Periyot Sayıları:")
        print(f"   Toplam Makine            : {stats['total_machines']}")
        print(f"   Toplam Bakım Periyodu    : {stats['total_schedules']}")
        print(f"   Periyodu Olmayan Makine  : {stats['machines_without_schedules']}")

        if stats['total_machines'] > 0:
            coverage = ((stats['total_machines'] - stats['machines_without_schedules']) /
                       stats['total_machines']) * 100
            print(f"   Kapsama Oranı            : %{coverage:.1f}")

        print(f"\n📈 Periyot Frequency Dağılımı:")
        for freq, count in sorted(stats['by_frequency'].items()):
            label = FREQUENCY_LABELS.get(freq, freq)
            print(f"   {label:<20} : {count:>3} periyot")

        print(f"\n🔧 Bakım Tipi Dağılımı:")
        for mtype, count in sorted(stats['by_type'].items()):
            print(f"   {mtype:<20} : {count:>3} periyot")

        print()
