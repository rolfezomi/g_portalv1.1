#!/usr/bin/env python3
"""
Supabase Bakım Yönetim Sistemi - CLI Aracı
Komple CRUD işlemleri, analiz ve raporlama
"""

import sys
import os
from pathlib import Path
from datetime import datetime

from db_operations import MaintenanceDB
from analysis_tools import MaintenanceCalendar, MONTH_NAMES_TR, FREQUENCY_LABELS
from export_import import DataExporter, DataImporter

class MaintenanceManager:
    """Ana CLI yönetim sınıfı"""

    def __init__(self):
        self.db = MaintenanceDB()
        self.running = True

    def clear_screen(self):
        """Ekranı temizle"""
        os.system('cls' if os.name == 'nt' else 'clear')

    def print_header(self):
        """Program başlığını yazdır"""
        print("\n" + "="*80)
        print("          SUPABASE BAKIM YÖNETİM SİSTEMİ".center(80))
        print("="*80)

    def print_menu(self):
        """Ana menüyü yazdır"""
        print("\n")
        print("[1] MAKİNE YÖNETİMİ")
        print("    1.1 Tüm makineleri listele")
        print("    1.2 Makine ara/görüntüle")
        print("    1.3 Yeni makine ekle")
        print("    1.4 Makine güncelle")
        print("    1.5 Makine sil")
        print("    1.6 Makine aktif/pasif yap")
        print()
        print("[2] PERİYOT YÖNETİMİ")
        print("    2.1 Makineye periyot ekle")
        print("    2.2 Periyot güncelle")
        print("    2.3 Periyot sil")
        print("    2.4 Periyot aktif/pasif yap")
        print("    2.5 Makinenin tüm periyotlarını görüntüle")
        print()
        print("[3] ANALİZ VE RAPORLAR")
        print("    3.1 Haftalık takvim raporu (tüm makineler)")
        print("    3.2 Belirli makine takvimi")
        print("    3.3 Ay bazlı yoğunluk analizi")
        print("    3.4 İstatistikler ve özetler")
        print("    3.5 Schedule olmayan makineler")
        print()
        print("[4] TOPLU İŞLEMLER")
        print("    4.1 JSON'dan import")
        print("    4.2 CSV'den makine import")
        print("    4.3 JSON'a export")
        print("    4.4 CSV'ye export")
        print()
        print("[0] ÇIKIŞ")
        print("\n" + "-"*80)

    def input_with_cancel(self, prompt, allow_empty=False):
        """Kullanıcıdan input al, 'q' ile iptal edilebilir"""
        value = input(f"{prompt} (iptal için 'q'): ").strip()

        if value.lower() == 'q':
            print("❌ İptal edildi")
            return None

        if not allow_empty and not value:
            print("❌ Boş bırakılamaz!")
            return None

        return value

    def confirm(self, message):
        """Onay iste"""
        response = input(f"{message} (E/h): ").strip().lower()
        return response in ['e', 'evet', 'y', 'yes']

    # ==================== MAKİNE YÖNETİMİ ====================

    def list_all_machines(self):
        """1.1 - Tüm makineleri listele"""
        try:
            machines = self.db.get_all_machines(include_inactive=True)

            print("\n" + "="*80)
            print(f"TÜM MAKİNELER (Toplam: {len(machines)})")
            print("="*80)

            if not machines:
                print("\n⚠️  Sistemde hiç makine yok!")
                return

            print(f"\n{'No':<4} {'Makine No':<15} {'Makine Adı':<35} {'Konum':<15} {'Durum'}")
            print("-"*80)

            for idx, machine in enumerate(machines, 1):
                machine_no = machine['machine_no']
                machine_name = machine['machine_name']
                location = machine.get('location') or '-'
                status = '✅ Aktif' if machine['is_active'] else '❌ Pasif'

                # Uzun isimleri kısalt
                if len(machine_name) > 33:
                    machine_name = machine_name[:30] + '...'
                if len(location) > 13:
                    location = location[:10] + '...'

                print(f"{idx:<4} {machine_no:<15} {machine_name:<35} {location:<15} {status}")

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    def view_machine(self):
        """1.2 - Makine ara/görüntüle"""
        machine_no = self.input_with_cancel("Makine No")
        if not machine_no:
            return

        try:
            machine = self.db.get_machine(machine_no)

            if not machine:
                print(f"\n❌ Makine '{machine_no}' bulunamadı!")
                return

            print("\n" + "="*80)
            print(f"MAKİNE DETAYI: {machine_no}")
            print("="*80)

            print(f"\nMakine No      : {machine['machine_no']}")
            print(f"Makine Adı     : {machine['machine_name']}")
            print(f"Konum          : {machine.get('location') or '-'}")
            print(f"Durum          : {'✅ Aktif' if machine['is_active'] else '❌ Pasif'}")
            print(f"Oluşturulma    : {machine.get('created_at', '-')}")

            # Schedule'ları göster
            schedules = self.db.get_machine_schedules(machine_no)

            print(f"\n📋 BAKIM PERİYOTLARI ({len(schedules)} adet):")

            if not schedules:
                print("   ⚠️  Bakım periyodu tanımlanmamış")
            else:
                for idx, schedule in enumerate(schedules, 1):
                    freq_label = FREQUENCY_LABELS.get(schedule['frequency'], schedule['frequency'])
                    months = schedule['months']
                    month_names = [MONTH_NAMES_TR[m] for m in months]

                    print(f"\n   {idx}. {schedule['maintenance_type']} - {freq_label}")
                    print(f"      ID     : {schedule['id']}")
                    print(f"      Aylar  : {', '.join(month_names)}")
                    print(f"      Durum  : {'✅ Aktif' if schedule['is_active'] else '❌ Pasif'}")

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    def add_machine(self):
        """1.3 - Yeni makine ekle"""
        print("\n" + "="*80)
        print("YENİ MAKİNE EKLE")
        print("="*80)

        machine_no = self.input_with_cancel("Makine No")
        if not machine_no:
            return

        machine_name = self.input_with_cancel("Makine Adı")
        if not machine_name:
            return

        location = self.input_with_cancel("Konum (opsiyonel)", allow_empty=True)

        # Önizleme
        print("\n📝 Eklenecek makine:")
        print(f"   Makine No  : {machine_no}")
        print(f"   Makine Adı : {machine_name}")
        print(f"   Konum      : {location or '-'}")

        if not self.confirm("\nMakineyi eklemek istiyor musunuz?"):
            print("❌ İptal edildi")
            return

        try:
            new_machine = self.db.add_machine(machine_no, machine_name, location)
            print(f"\n✅ Makine başarıyla eklendi!")
            print(f"   ID: {new_machine['id']}")

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    def update_machine(self):
        """1.4 - Makine güncelle"""
        machine_no = self.input_with_cancel("Güncellenecek Makine No")
        if not machine_no:
            return

        try:
            machine = self.db.get_machine(machine_no)
            if not machine:
                print(f"\n❌ Makine '{machine_no}' bulunamadı!")
                return

            print("\n📝 Mevcut bilgiler:")
            print(f"   Makine Adı : {machine['machine_name']}")
            print(f"   Konum      : {machine.get('location') or '-'}")

            print("\n💡 Güncellemek istemediğiniz alanlar için Enter'a basın")

            machine_name = input(f"Yeni Makine Adı [{machine['machine_name']}]: ").strip()
            location = input(f"Yeni Konum [{machine.get('location') or '-'}]: ").strip()

            updates = {}
            if machine_name:
                updates['machine_name'] = machine_name
            if location:
                updates['location'] = location

            if not updates:
                print("\n⚠️  Hiçbir değişiklik yapılmadı")
                return

            if not self.confirm("\nDeğişiklikleri kaydetmek istiyor musunuz?"):
                print("❌ İptal edildi")
                return

            updated = self.db.update_machine(machine_no, **updates)
            print(f"\n✅ Makine başarıyla güncellendi!")

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    def delete_machine(self):
        """1.5 - Makine sil"""
        machine_no = self.input_with_cancel("Silinecek Makine No")
        if not machine_no:
            return

        try:
            machine = self.db.get_machine(machine_no)
            if not machine:
                print(f"\n❌ Makine '{machine_no}' bulunamadı!")
                return

            # Schedule sayısını kontrol et
            schedules = self.db.get_machine_schedules(machine_no)

            print(f"\n⚠️  SİLME UYARISI!")
            print(f"   Makine      : {machine['machine_no']} - {machine['machine_name']}")
            print(f"   Schedule    : {len(schedules)} adet")

            if schedules:
                print(f"\n   ⚠️  Bu makineye ait {len(schedules)} adet periyot da silinecek!")

            if not self.confirm("\nMakineyi ve tüm periyotlarını silmek istediğinizden emin misiniz?"):
                print("❌ İptal edildi")
                return

            result = self.db.delete_machine(machine_no, force=True)
            print(f"\n✅ Makine ve {result['deleted_schedules']} adet periyot silindi!")

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    def toggle_machine_active(self):
        """1.6 - Makine aktif/pasif yap"""
        machine_no = self.input_with_cancel("Makine No")
        if not machine_no:
            return

        try:
            updated = self.db.toggle_machine_active(machine_no)
            status = '✅ Aktif' if updated['is_active'] else '❌ Pasif'
            print(f"\n✅ Makine durumu güncellendi: {status}")

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    # ==================== PERİYOT YÖNETİMİ ====================

    def add_schedule(self):
        """2.1 - Makineye periyot ekle"""
        print("\n" + "="*80)
        print("YENİ PERİYOT EKLE")
        print("="*80)

        machine_no = self.input_with_cancel("Makine No")
        if not machine_no:
            return

        # Makineyi kontrol et
        try:
            machine = self.db.get_machine(machine_no)
            if not machine:
                print(f"\n❌ Makine '{machine_no}' bulunamadı!")
                return

            print(f"\n📦 Makine: {machine['machine_name']}")

            # Maintenance type seç
            print("\nBakım Tipi:")
            print("  1) DIŞ HİZMET")
            print("  2) İÇ BAKIM")

            type_choice = self.input_with_cancel("Seçim (1-2)")
            if not type_choice:
                return

            maintenance_type = 'DIŞ HİZMET' if type_choice == '1' else 'İÇ BAKIM'

            # Frequency seç
            print("\nFrequency:")
            print("  1) Haftalık (weekly)")
            print("  2) Aylık (monthly)")
            print("  3) 3 Aylık (quarterly)")
            print("  4) 6 Aylık (semi-annual)")
            print("  5) Yıllık (annual)")

            freq_choice = self.input_with_cancel("Seçim (1-5)")
            if not freq_choice:
                return

            freq_map = {
                '1': 'weekly',
                '2': 'monthly',
                '3': 'quarterly',
                '4': 'semi-annual',
                '5': 'annual'
            }
            frequency = freq_map.get(freq_choice)

            if not frequency:
                print("❌ Geçersiz seçim!")
                return

            # Ayları al
            if frequency == 'weekly':
                months = list(range(1, 13))
                print("\n📅 Haftalık bakım: Tüm aylar otomatik seçildi")
            else:
                months_input = self.input_with_cancel("Aylar (virgülle ayırın, örn: 1,4,7,10)")
                if not months_input:
                    return

                try:
                    months = [int(m.strip()) for m in months_input.split(',')]
                    months = [m for m in months if 1 <= m <= 12]

                    if not months:
                        print("❌ Geçerli ay bulunamadı!")
                        return

                except ValueError:
                    print("❌ Geçersiz ay formatı!")
                    return

            # Önizleme
            month_names = [MONTH_NAMES_TR[m] for m in sorted(months)]
            freq_label = FREQUENCY_LABELS.get(frequency, frequency)

            print("\n📝 Eklenecek periyot:")
            print(f"   Makine        : {machine['machine_no']} - {machine['machine_name']}")
            print(f"   Bakım Tipi    : {maintenance_type}")
            print(f"   Frequency     : {freq_label}")
            print(f"   Aylar         : {', '.join(month_names)}")

            if not self.confirm("\nPeriyodu eklemek istiyor musunuz?"):
                print("❌ İptal edildi")
                return

            new_schedule = self.db.add_schedule(machine_no, maintenance_type, frequency, months)
            print(f"\n✅ Periyot başarıyla eklendi!")
            print(f"   ID: {new_schedule['id']}")

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    def view_machine_schedules(self):
        """2.5 - Makinenin tüm periyotlarını görüntüle"""
        machine_no = self.input_with_cancel("Makine No")
        if not machine_no:
            return

        try:
            machine = self.db.get_machine(machine_no)
            if not machine:
                print(f"\n❌ Makine '{machine_no}' bulunamadı!")
                return

            schedules = self.db.get_machine_schedules(machine_no)

            # Takvim görüntüle
            calendar_data = MaintenanceCalendar.generate_machine_calendar(
                machine, schedules, year=2025
            )

            MaintenanceCalendar.print_machine_calendar(calendar_data, compact=False)

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    # ==================== ANALİZ VE RAPORLAR ====================

    def show_all_calendars(self):
        """3.1 - Haftalık takvim raporu (tüm makineler)"""
        try:
            print("\n⏳ Makineler yükleniyor...")

            machines = self.db.get_all_machines()

            if not machines:
                print("\n⚠️  Sistemde hiç makine yok!")
                return

            print(f"✅ {len(machines)} makine bulundu\n")

            compact_mode = self.confirm("Kısa format kullanılsın mı? (E=Kısa, H=Detaylı)")

            for machine in machines:
                schedules = self.db.get_machine_schedules(machine['machine_no'])

                calendar_data = MaintenanceCalendar.generate_machine_calendar(
                    machine, schedules, year=2025
                )

                MaintenanceCalendar.print_machine_calendar(calendar_data, compact=compact_mode)

                input("\nDevam etmek için Enter'a basın...")

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    def show_monthly_analysis(self):
        """3.3 - Ay bazlı yoğunluk analizi"""
        try:
            all_schedules = self.db.get_all_schedules()

            summary = MaintenanceCalendar.generate_monthly_summary(all_schedules, year=2025)

            MaintenanceCalendar.print_monthly_summary(summary)

            # En yoğun ayları göster
            busy_months = MaintenanceCalendar.find_busy_periods(summary, threshold=5)

            if busy_months:
                print("\n🔥 EN YOĞUN AYLAR (>5 bakım):")
                for month, count in busy_months:
                    month_name = MONTH_NAMES_TR[month]
                    print(f"   {month_name:<12} : {count} bakım")

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    def show_statistics(self):
        """3.4 - İstatistikler ve özetler"""
        try:
            MaintenanceCalendar.generate_statistics_report(self.db)

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    def show_machines_without_schedules(self):
        """3.5 - Schedule olmayan makineler"""
        try:
            machines = self.db.get_machines_without_schedules()

            print("\n" + "="*80)
            print(f"PERİYODU OLMAYAN MAKİNELER (Toplam: {len(machines)})")
            print("="*80)

            if not machines:
                print("\n✅ Tüm makinelerin periyodu tanımlı!")
                return

            print(f"\n{'No':<4} {'Makine No':<15} {'Makine Adı'}")
            print("-"*80)

            for idx, machine in enumerate(machines, 1):
                print(f"{idx:<4} {machine['machine_no']:<15} {machine['machine_name']}")

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    # ==================== TOPLU İŞLEMLER ====================

    def import_from_json(self):
        """4.1 - JSON'dan import"""
        json_path = self.input_with_cancel("JSON dosya yolu")
        if not json_path:
            return

        if not Path(json_path).exists():
            print(f"\n❌ Dosya bulunamadı: {json_path}")
            return

        try:
            # Önce validate et
            print("\n🔍 JSON dosyası kontrol ediliyor...")
            is_valid, errors = DataImporter.validate_json_structure(json_path)

            if not is_valid:
                print("❌ JSON dosyası geçersiz!")
                for error in errors:
                    print(f"   - {error}")
                return

            print("✅ JSON dosyası geçerli")

            # Dry run
            print("\n🔍 DRY RUN - Preview yapılıyor...\n")
            DataImporter.import_from_json(self.db, json_path, dry_run=True)

            if not self.confirm("\nGerçek import yapmak istiyor musunuz?"):
                print("❌ İptal edildi")
                return

            # Gerçek import
            DataImporter.import_from_json(self.db, json_path, dry_run=False)

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    def export_to_json(self):
        """4.3 - JSON'a export"""
        try:
            print("\n⏳ Veriler yükleniyor...")

            machines = self.db.get_all_machines()
            all_calendars = []

            for machine in machines:
                schedules = self.db.get_machine_schedules(machine['machine_no'])
                calendar_data = MaintenanceCalendar.generate_machine_calendar(
                    machine, schedules, year=2025
                )
                all_calendars.append(calendar_data)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"maintenance_export_{timestamp}.json"

            DataExporter.export_to_json(all_calendars, output_path)

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    def export_to_csv(self):
        """4.4 - CSV'ye export"""
        try:
            print("\n⏳ Veriler yükleniyor...")

            machines = self.db.get_all_machines()
            all_calendars = []

            for machine in machines:
                schedules = self.db.get_machine_schedules(machine['machine_no'])
                calendar_data = MaintenanceCalendar.generate_machine_calendar(
                    machine, schedules, year=2025
                )
                all_calendars.append(calendar_data)

            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = f"maintenance_export_{timestamp}.csv"

            DataExporter.export_to_csv(all_calendars, output_path)

        except Exception as e:
            print(f"\n❌ Hata: {e}")

    # ==================== ANA DÖNGÜ ====================

    def run(self):
        """Ana program döngüsü"""
        while self.running:
            self.clear_screen()
            self.print_header()
            self.print_menu()

            choice = input("Seçiminiz: ").strip()

            if choice == '0':
                if self.confirm("\nÇıkmak istediğinizden emin misiniz?"):
                    print("\n👋 Güle güle!")
                    self.running = False
                continue

            # Menü seçimlerini işle
            menu_map = {
                '1.1': self.list_all_machines,
                '1.2': self.view_machine,
                '1.3': self.add_machine,
                '1.4': self.update_machine,
                '1.5': self.delete_machine,
                '1.6': self.toggle_machine_active,
                '2.1': self.add_schedule,
                '2.5': self.view_machine_schedules,
                '3.1': self.show_all_calendars,
                '3.2': self.view_machine_schedules,  # Aynı fonksiyon
                '3.3': self.show_monthly_analysis,
                '3.4': self.show_statistics,
                '3.5': self.show_machines_without_schedules,
                '4.1': self.import_from_json,
                '4.3': self.export_to_json,
                '4.4': self.export_to_csv,
            }

            if choice in menu_map:
                try:
                    menu_map[choice]()
                except KeyboardInterrupt:
                    print("\n\n⚠️  İşlem kullanıcı tarafından iptal edildi")
                except Exception as e:
                    print(f"\n❌ Beklenmeyen hata: {e}")
                    import traceback
                    traceback.print_exc()

                input("\nDevam etmek için Enter'a basın...")
            else:
                print("\n❌ Geçersiz seçim!")
                input("Devam etmek için Enter'a basın...")


def main():
    """Ana fonksiyon"""
    try:
        manager = MaintenanceManager()
        manager.run()
    except KeyboardInterrupt:
        print("\n\n👋 Program sonlandırıldı")
    except Exception as e:
        print(f"\n❌ Fatal hata: {e}")
        import traceback
        traceback.print_exc()
        return 1

    return 0


if __name__ == '__main__':
    sys.exit(main())
