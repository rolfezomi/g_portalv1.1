#!/usr/bin/env python3
"""
Import/Export İşlemleri
CSV, JSON, Excel formatları için import/export fonksiyonları
"""

import json
import csv
from pathlib import Path
from typing import List, Dict, Tuple
from analysis_tools import MaintenanceCalendar

class DataExporter:
    """Veri export işlemleri"""

    @staticmethod
    def export_to_json(all_calendars: List[Dict], output_path: str):
        """
        Tüm takvimleri JSON dosyasına export et

        Args:
            all_calendars: generate_machine_calendar() çıktıları listesi
            output_path: Çıktı dosya yolu
        """
        data = {
            'exported_at': str(Path(output_path).name),
            'total_machines': len(all_calendars),
            'machines': all_calendars
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"✅ {len(all_calendars)} makine JSON dosyasına export edildi: {output_path}")

    @staticmethod
    def export_to_csv(all_calendars: List[Dict], output_path: str):
        """
        Tüm takvimleri CSV dosyasına export et

        Args:
            all_calendars: generate_machine_calendar() çıktıları listesi
            output_path: Çıktı dosya yolu
        """
        csv_data = MaintenanceCalendar.generate_csv_export_data(all_calendars)

        with open(output_path, 'w', newline='', encoding='utf-8-sig') as f:
            writer = csv.writer(f)
            writer.writerows(csv_data)

        print(f"✅ {len(all_calendars)} makine CSV dosyasına export edildi: {output_path}")

    @staticmethod
    def export_machines_list(machines: List[Dict], output_path: str):
        """
        Makine listesini CSV olarak export et

        Args:
            machines: Makine listesi
            output_path: Çıktı dosya yolu
        """
        with open(output_path, 'w', newline='', encoding='utf-8-sig') as f:
            if not machines:
                return

            fieldnames = ['machine_no', 'machine_name', 'location', 'is_active', 'created_at']
            writer = csv.DictWriter(f, fieldnames=fieldnames)

            writer.writeheader()
            for machine in machines:
                writer.writerow({
                    'machine_no': machine.get('machine_no'),
                    'machine_name': machine.get('machine_name'),
                    'location': machine.get('location') or '',
                    'is_active': machine.get('is_active', True),
                    'created_at': machine.get('created_at', '')
                })

        print(f"✅ {len(machines)} makine listesi export edildi: {output_path}")

    @staticmethod
    def export_schedules_list(schedules: List[Dict], output_path: str):
        """
        Schedule listesini CSV olarak export et

        Args:
            schedules: Schedule listesi (machine bilgisiyle)
            output_path: Çıktı dosya yolu
        """
        with open(output_path, 'w', newline='', encoding='utf-8-sig') as f:
            if not schedules:
                return

            fieldnames = ['machine_no', 'machine_name', 'maintenance_type',
                         'frequency', 'months', 'is_active']
            writer = csv.DictWriter(f, fieldnames=fieldnames)

            writer.writeheader()
            for schedule in schedules:
                months_str = ','.join(map(str, schedule.get('months', [])))
                writer.writerow({
                    'machine_no': schedule.get('machine_no'),
                    'machine_name': schedule.get('machine_name'),
                    'maintenance_type': schedule.get('maintenance_type'),
                    'frequency': schedule.get('frequency'),
                    'months': months_str,
                    'is_active': schedule.get('is_active', True)
                })

        print(f"✅ {len(schedules)} schedule export edildi: {output_path}")


class DataImporter:
    """Veri import işlemleri"""

    @staticmethod
    def import_from_json(db, json_path: str, dry_run: bool = True):
        """
        JSON dosyasından makineleri ve schedule'ları import et

        Args:
            db: MaintenanceDB instance
            json_path: JSON dosya yolu
            dry_run: True ise sadece preview göster, False ise gerçekten ekle

        Returns:
            Tuple (added_machines_count, added_schedules_count, errors)
        """
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        machines_data = data.get('machines', [])

        if dry_run:
            print(f"\n🔍 DRY RUN - Preview Mode (Gerçek ekleme yapılmayacak)")
            print(f"   Toplam {len(machines_data)} makine bulundu\n")

        added_machines = 0
        added_schedules = 0
        errors = []

        for machine_data in machines_data:
            machine_no = machine_data.get('machine_no')
            machine_name = machine_data.get('machine_name')
            location = machine_data.get('location')
            schedules = machine_data.get('schedules', [])

            try:
                # Makine var mı kontrol et
                existing_machine = db.get_machine(machine_no)

                if not existing_machine:
                    if dry_run:
                        print(f"  ✨ Yeni makine eklenecek: {machine_no} - {machine_name}")
                    else:
                        db.add_machine(machine_no, machine_name, location)
                        print(f"  ✅ Makine eklendi: {machine_no}")

                    added_machines += 1
                else:
                    if dry_run:
                        print(f"  ⏭️  Zaten var: {machine_no}")

                # Schedule'ları ekle
                for schedule in schedules:
                    maintenance_type = schedule.get('maintenance_type')
                    frequency = schedule.get('frequency')
                    months = schedule.get('months', [])

                    try:
                        if dry_run:
                            print(f"     📋 Schedule eklenecek: {maintenance_type} - {frequency}")
                        else:
                            db.add_schedule(machine_no, maintenance_type, frequency, months)
                            print(f"     ✅ Schedule eklendi: {maintenance_type} - {frequency}")

                        added_schedules += 1

                    except Exception as e:
                        error_msg = f"Schedule ekleme hatası ({machine_no}): {str(e)}"
                        errors.append(error_msg)
                        if not dry_run:
                            print(f"     ❌ {error_msg}")

            except Exception as e:
                error_msg = f"Makine ekleme hatası ({machine_no}): {str(e)}"
                errors.append(error_msg)
                print(f"  ❌ {error_msg}")

        if dry_run:
            print(f"\n📊 DRY RUN SONUÇLARI:")
            print(f"   Eklenecek makine   : {added_machines}")
            print(f"   Eklenecek schedule : {added_schedules}")
            if errors:
                print(f"   Hata sayısı        : {len(errors)}")
            print(f"\n💡 Gerçek ekleme için dry_run=False kullanın")
        else:
            print(f"\n✅ İMPORT TAMAMLANDI:")
            print(f"   Eklenen makine     : {added_machines}")
            print(f"   Eklenen schedule   : {added_schedules}")
            if errors:
                print(f"   Hata sayısı        : {len(errors)}")

        return added_machines, added_schedules, errors

    @staticmethod
    def import_from_csv(db, csv_path: str, dry_run: bool = True):
        """
        CSV dosyasından makineleri import et

        CSV formatı:
        machine_no,machine_name,location,is_active

        Args:
            db: MaintenanceDB instance
            csv_path: CSV dosya yolu
            dry_run: True ise preview, False ise gerçek ekleme

        Returns:
            Tuple (added_count, errors)
        """
        added = 0
        errors = []

        with open(csv_path, 'r', encoding='utf-8-sig') as f:
            reader = csv.DictReader(f)

            if dry_run:
                print(f"\n🔍 DRY RUN - CSV Preview\n")

            for row in reader:
                machine_no = row.get('machine_no')
                machine_name = row.get('machine_name')
                location = row.get('location') or None
                is_active = row.get('is_active', 'true').lower() == 'true'

                if not machine_no or not machine_name:
                    error_msg = f"Geçersiz satır: {row}"
                    errors.append(error_msg)
                    continue

                try:
                    existing = db.get_machine(machine_no)

                    if not existing:
                        if dry_run:
                            print(f"  ✨ Eklenecek: {machine_no} - {machine_name}")
                        else:
                            db.add_machine(machine_no, machine_name, location, is_active)
                            print(f"  ✅ Eklendi: {machine_no}")

                        added += 1
                    else:
                        if dry_run:
                            print(f"  ⏭️  Zaten var: {machine_no}")

                except Exception as e:
                    error_msg = f"Hata ({machine_no}): {str(e)}"
                    errors.append(error_msg)
                    print(f"  ❌ {error_msg}")

        if dry_run:
            print(f"\n📊 DRY RUN SONUÇLARI:")
            print(f"   Eklenecek makine : {added}")
            if errors:
                print(f"   Hata sayısı      : {len(errors)}")
        else:
            print(f"\n✅ CSV İMPORT TAMAMLANDI:")
            print(f"   Eklenen makine   : {added}")
            if errors:
                print(f"   Hata sayısı      : {len(errors)}")

        return added, errors

    @staticmethod
    def validate_json_structure(json_path: str) -> Tuple[bool, List[str]]:
        """
        JSON dosyasının yapısını kontrol et

        Returns:
            Tuple (is_valid, errors_list)
        """
        errors = []

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            if not isinstance(data, dict):
                errors.append("JSON root bir object olmalı")
                return False, errors

            if 'machines' not in data:
                errors.append("'machines' anahtarı bulunamadı")
                return False, errors

            machines = data['machines']
            if not isinstance(machines, list):
                errors.append("'machines' bir array olmalı")
                return False, errors

            for idx, machine in enumerate(machines):
                if not isinstance(machine, dict):
                    errors.append(f"Machine {idx}: Object olmalı")
                    continue

                if 'machine_no' not in machine:
                    errors.append(f"Machine {idx}: 'machine_no' eksik")

                if 'machine_name' not in machine:
                    errors.append(f"Machine {idx}: 'machine_name' eksik")

                if 'schedules' in machine:
                    if not isinstance(machine['schedules'], list):
                        errors.append(f"Machine {idx}: 'schedules' array olmalı")

            if errors:
                return False, errors

            return True, []

        except json.JSONDecodeError as e:
            errors.append(f"JSON parse hatası: {str(e)}")
            return False, errors

        except Exception as e:
            errors.append(f"Doğrulama hatası: {str(e)}")
            return False, errors
