#!/usr/bin/env python3
"""
Supabase PostgreSQL Database Operations
CRUD işlemleri için sınıf
"""

import psycopg2
from psycopg2.extras import RealDictCursor
from contextlib import contextmanager

class MaintenanceDB:
    """Bakım yönetimi database işlemleri"""

    def __init__(self):
        # Direct PostgreSQL connection
        self.connection_params = {
            'host': 'db.mignlffeyougoefuyayr.supabase.co',
            'port': 5432,
            'database': 'postgres',
            'user': 'postgres',
            'password': 'Ugur.onar007670',
            'sslmode': 'require'
        }
        self.conn = None
        self.cursor = None

    @contextmanager
    def get_connection(self):
        """Context manager for database connections"""
        conn = None
        try:
            conn = psycopg2.connect(**self.connection_params)
            yield conn
            conn.commit()
        except Exception as e:
            if conn:
                conn.rollback()
            raise e
        finally:
            if conn:
                conn.close()

    # ==================== MACHINE OPERATIONS ====================

    def get_all_machines(self, include_inactive=False):
        """Tüm makineleri listele"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            if include_inactive:
                query = "SELECT * FROM machines ORDER BY machine_no"
            else:
                query = "SELECT * FROM machines WHERE is_active = true ORDER BY machine_no"

            cursor.execute(query)
            machines = cursor.fetchall()
            return [dict(m) for m in machines]

    def get_machine(self, machine_no):
        """Belirli bir makineyi getir"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            query = "SELECT * FROM machines WHERE machine_no = %s"
            cursor.execute(query, (machine_no,))
            machine = cursor.fetchone()

            return dict(machine) if machine else None

    def get_machine_by_id(self, machine_id):
        """ID ile makine getir"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            query = "SELECT * FROM machines WHERE id = %s"
            cursor.execute(query, (machine_id,))
            machine = cursor.fetchone()

            return dict(machine) if machine else None

    def add_machine(self, machine_no, machine_name, location=None, is_active=True):
        """Yeni makine ekle"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            # Duplicate kontrolü
            cursor.execute("SELECT id FROM machines WHERE machine_no = %s", (machine_no,))
            if cursor.fetchone():
                raise Exception(f"Makine {machine_no} zaten mevcut!")

            query = """
                INSERT INTO machines (machine_no, machine_name, location, is_active)
                VALUES (%s, %s, %s, %s)
                RETURNING *
            """
            cursor.execute(query, (machine_no, machine_name, location, is_active))
            new_machine = cursor.fetchone()

            return dict(new_machine)

    def update_machine(self, machine_no, machine_name=None, location=None, is_active=None):
        """Makine güncelle"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            # Önce makineyi bul
            machine = self.get_machine(machine_no)
            if not machine:
                raise Exception(f"Makine {machine_no} bulunamadı!")

            updates = []
            params = []

            if machine_name is not None:
                updates.append("machine_name = %s")
                params.append(machine_name)

            if location is not None:
                updates.append("location = %s")
                params.append(location)

            if is_active is not None:
                updates.append("is_active = %s")
                params.append(is_active)

            if not updates:
                return machine  # Hiç değişiklik yok

            params.append(machine['id'])
            query = f"UPDATE machines SET {', '.join(updates)} WHERE id = %s RETURNING *"

            cursor.execute(query, params)
            updated_machine = cursor.fetchone()

            return dict(updated_machine)

    def delete_machine(self, machine_no, force=False):
        """Makine sil (ve ilişkili schedule'ları)"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            # Önce makineyi bul
            machine = self.get_machine(machine_no)
            if not machine:
                raise Exception(f"Makine {machine_no} bulunamadı!")

            # Schedule kontrolü
            cursor.execute(
                "SELECT COUNT(*) as count FROM maintenance_schedules WHERE machine_id = %s",
                (machine['id'],)
            )
            schedule_count = cursor.fetchone()['count']

            if schedule_count > 0 and not force:
                raise Exception(
                    f"Bu makinenin {schedule_count} adet schedule'ı var! "
                    f"Silmek için force=True kullanın."
                )

            # Schedule'ları sil
            if schedule_count > 0:
                cursor.execute(
                    "DELETE FROM maintenance_schedules WHERE machine_id = %s",
                    (machine['id'],)
                )

            # Makineyi sil
            cursor.execute("DELETE FROM machines WHERE id = %s", (machine['id'],))

            return {
                'deleted_machine': machine,
                'deleted_schedules': schedule_count
            }

    def toggle_machine_active(self, machine_no):
        """Makine aktif/pasif durumunu değiştir"""
        machine = self.get_machine(machine_no)
        if not machine:
            raise Exception(f"Makine {machine_no} bulunamadı!")

        new_status = not machine['is_active']
        return self.update_machine(machine_no, is_active=new_status)

    # ==================== SCHEDULE OPERATIONS ====================

    def get_machine_schedules(self, machine_no):
        """Bir makinenin tüm schedule'larını getir"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            query = """
                SELECT ms.*
                FROM maintenance_schedules ms
                JOIN machines m ON ms.machine_id = m.id
                WHERE m.machine_no = %s
                ORDER BY ms.maintenance_type, ms.frequency
            """
            cursor.execute(query, (machine_no,))
            schedules = cursor.fetchall()

            return [dict(s) for s in schedules]

    def get_all_schedules(self):
        """Tüm schedule'ları getir (machine bilgisiyle)"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            query = """
                SELECT
                    ms.*,
                    m.machine_no,
                    m.machine_name
                FROM maintenance_schedules ms
                JOIN machines m ON ms.machine_id = m.id
                WHERE ms.is_active = true AND m.is_active = true
                ORDER BY m.machine_no, ms.maintenance_type
            """
            cursor.execute(query)
            schedules = cursor.fetchall()

            return [dict(s) for s in schedules]

    def add_schedule(self, machine_no, maintenance_type, frequency, months, is_active=True):
        """Makineye yeni schedule ekle"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            # Makineyi bul
            machine = self.get_machine(machine_no)
            if not machine:
                raise Exception(f"Makine {machine_no} bulunamadı!")

            # Duplicate kontrolü
            cursor.execute("""
                SELECT id FROM maintenance_schedules
                WHERE machine_id = %s
                AND maintenance_type = %s
                AND frequency = %s
            """, (machine['id'], maintenance_type, frequency))

            if cursor.fetchone():
                raise Exception(
                    f"Bu makine için {maintenance_type} - {frequency} schedule'ı zaten var!"
                )

            query = """
                INSERT INTO maintenance_schedules
                (machine_id, maintenance_type, frequency, months, is_active)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
            """
            cursor.execute(query, (machine['id'], maintenance_type, frequency, months, is_active))
            new_schedule = cursor.fetchone()

            return dict(new_schedule)

    def update_schedule(self, schedule_id, maintenance_type=None, frequency=None,
                       months=None, is_active=None):
        """Schedule güncelle"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            # Schedule'ı bul
            cursor.execute("SELECT * FROM maintenance_schedules WHERE id = %s", (schedule_id,))
            schedule = cursor.fetchone()

            if not schedule:
                raise Exception(f"Schedule ID {schedule_id} bulunamadı!")

            updates = []
            params = []

            if maintenance_type is not None:
                updates.append("maintenance_type = %s")
                params.append(maintenance_type)

            if frequency is not None:
                updates.append("frequency = %s")
                params.append(frequency)

            if months is not None:
                updates.append("months = %s")
                params.append(months)

            if is_active is not None:
                updates.append("is_active = %s")
                params.append(is_active)

            if not updates:
                return dict(schedule)

            params.append(schedule_id)
            query = f"UPDATE maintenance_schedules SET {', '.join(updates)} WHERE id = %s RETURNING *"

            cursor.execute(query, params)
            updated_schedule = cursor.fetchone()

            return dict(updated_schedule)

    def delete_schedule(self, schedule_id):
        """Schedule sil"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            # Schedule'ı bul
            cursor.execute("SELECT * FROM maintenance_schedules WHERE id = %s", (schedule_id,))
            schedule = cursor.fetchone()

            if not schedule:
                raise Exception(f"Schedule ID {schedule_id} bulunamadı!")

            cursor.execute("DELETE FROM maintenance_schedules WHERE id = %s", (schedule_id,))

            return dict(schedule)

    def toggle_schedule_active(self, schedule_id):
        """Schedule aktif/pasif durumunu değiştir"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            cursor.execute("SELECT * FROM maintenance_schedules WHERE id = %s", (schedule_id,))
            schedule = cursor.fetchone()

            if not schedule:
                raise Exception(f"Schedule ID {schedule_id} bulunamadı!")

            new_status = not schedule['is_active']
            return self.update_schedule(schedule_id, is_active=new_status)

    # ==================== ANALYSIS QUERIES ====================

    def get_machines_without_schedules(self):
        """Schedule'ı olmayan makineleri getir"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            query = """
                SELECT m.*
                FROM machines m
                LEFT JOIN maintenance_schedules ms ON m.id = ms.machine_id
                WHERE ms.id IS NULL AND m.is_active = true
                ORDER BY m.machine_no
            """
            cursor.execute(query)
            machines = cursor.fetchall()

            return [dict(m) for m in machines]

    def get_schedules_by_frequency(self, frequency):
        """Belirli frequency'deki schedule'ları getir"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            query = """
                SELECT
                    ms.*,
                    m.machine_no,
                    m.machine_name
                FROM maintenance_schedules ms
                JOIN machines m ON ms.machine_id = m.id
                WHERE ms.frequency = %s AND ms.is_active = true
                ORDER BY m.machine_no
            """
            cursor.execute(query, (frequency,))
            schedules = cursor.fetchall()

            return [dict(s) for s in schedules]

    def get_schedules_by_month(self, month):
        """Belirli ayda bakımı olan schedule'ları getir"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            query = """
                SELECT
                    ms.*,
                    m.machine_no,
                    m.machine_name
                FROM maintenance_schedules ms
                JOIN machines m ON ms.machine_id = m.id
                WHERE %s = ANY(ms.months) AND ms.is_active = true
                ORDER BY m.machine_no
            """
            cursor.execute(query, (month,))
            schedules = cursor.fetchall()

            return [dict(s) for s in schedules]

    def get_statistics(self):
        """Genel istatistikler"""
        with self.get_connection() as conn:
            cursor = conn.cursor(cursor_factory=RealDictCursor)

            stats = {}

            # Toplam makine
            cursor.execute("SELECT COUNT(*) as count FROM machines WHERE is_active = true")
            stats['total_machines'] = cursor.fetchone()['count']

            # Toplam schedule
            cursor.execute("SELECT COUNT(*) as count FROM maintenance_schedules WHERE is_active = true")
            stats['total_schedules'] = cursor.fetchone()['count']

            # Schedule olmayan makineler
            stats['machines_without_schedules'] = len(self.get_machines_without_schedules())

            # Frequency dağılımı
            cursor.execute("""
                SELECT frequency, COUNT(*) as count
                FROM maintenance_schedules
                WHERE is_active = true
                GROUP BY frequency
            """)
            stats['by_frequency'] = {row['frequency']: row['count'] for row in cursor.fetchall()}

            # Type dağılımı
            cursor.execute("""
                SELECT maintenance_type, COUNT(*) as count
                FROM maintenance_schedules
                WHERE is_active = true
                GROUP BY maintenance_type
            """)
            stats['by_type'] = {row['maintenance_type']: row['count'] for row in cursor.fetchall()}

            return stats
