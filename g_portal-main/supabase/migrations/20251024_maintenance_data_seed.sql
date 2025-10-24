/*
  # Bakım Yönetim Sistemi - Database Schema + Sample Data

  Bu SQL dosyasını Supabase SQL Editor'de çalıştırın.

  İçerik:
  1. Tablolar: machines, maintenance_schedules, maintenance_records
  2. RLS Policies: Sadece admin ve maintenance rolü erişebilir
  3. Sample Data: 47 makine + 47 bakım planı
*/

-- ============================================
-- 1. TABLES
-- ============================================

-- Machines tablosu
CREATE TABLE IF NOT EXISTS machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_no text UNIQUE NOT NULL,
  machine_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Maintenance Schedules tablosu
CREATE TABLE IF NOT EXISTS maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid REFERENCES machines(id) ON DELETE CASCADE NOT NULL,
  maintenance_type text NOT NULL DEFAULT 'İÇ BAKIM',
  frequency text NOT NULL CHECK (frequency IN ('monthly', 'quarterly', 'semi-annual', 'annual')),
  months integer[] NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Maintenance Records tablosu
CREATE TABLE IF NOT EXISTS maintenance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id uuid REFERENCES maintenance_schedules(id) ON DELETE CASCADE,
  machine_id uuid REFERENCES machines(id) ON DELETE CASCADE NOT NULL,
  planned_date date NOT NULL,
  completed_date timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  performed_by text,
  materials_used text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- 2. RLS POLICIES
-- ============================================

ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

-- Machines policies
CREATE POLICY "maintenance_users_read_machines" ON machines
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE email = auth.jwt()->>'email'
      AND role IN ('admin', 'maintenance')
    )
  );

CREATE POLICY "maintenance_users_insert_machines" ON machines
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE email = auth.jwt()->>'email'
      AND role IN ('admin', 'maintenance')
    )
  );

CREATE POLICY "maintenance_users_update_machines" ON machines
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE email = auth.jwt()->>'email'
      AND role IN ('admin', 'maintenance')
    )
  );

CREATE POLICY "maintenance_users_delete_machines" ON machines
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE email = auth.jwt()->>'email'
      AND role IN ('admin', 'maintenance')
    )
  );

-- Schedules policies
CREATE POLICY "maintenance_users_read_schedules" ON maintenance_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE email = auth.jwt()->>'email'
      AND role IN ('admin', 'maintenance')
    )
  );

CREATE POLICY "maintenance_users_insert_schedules" ON maintenance_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE email = auth.jwt()->>'email'
      AND role IN ('admin', 'maintenance')
    )
  );

CREATE POLICY "maintenance_users_update_schedules" ON maintenance_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE email = auth.jwt()->>'email'
      AND role IN ('admin', 'maintenance')
    )
  );

CREATE POLICY "maintenance_users_delete_schedules" ON maintenance_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE email = auth.jwt()->>'email'
      AND role IN ('admin', 'maintenance')
    )
  );

-- Records policies
CREATE POLICY "maintenance_users_read_records" ON maintenance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE email = auth.jwt()->>'email'
      AND role IN ('admin', 'maintenance')
    )
  );

CREATE POLICY "maintenance_users_insert_records" ON maintenance_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE email = auth.jwt()->>'email'
      AND role IN ('admin', 'maintenance')
    )
  );

CREATE POLICY "maintenance_users_update_records" ON maintenance_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE email = auth.jwt()->>'email'
      AND role IN ('admin', 'maintenance')
    )
  );

CREATE POLICY "maintenance_users_delete_records" ON maintenance_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE email = auth.jwt()->>'email'
      AND role IN ('admin', 'maintenance')
    )
  );

-- ============================================
-- 3. SAMPLE DATA - MACHINES (47 adet)
-- ============================================

INSERT INTO machines (machine_no, machine_name) VALUES
('UK-1010', '3 Tonluk Mikser'),
('UK-1011', '7 Tonluk Mikser'),
('UK-1012', '7 Tonluk Mikser'),
('UK-1013', '2 Tonluk Mikser'),
('UK-1014', 'Ütümix Mikser'),
('UK-1015', 'Emülsiyon Ünitesi'),
('UK-1029', 'Altlı Likit Dolum Makinası'),
('UK-1067', 'Krem Dolum Makinası'),
('UK-1031', 'Etiket Makinası'),
('UK-1035', 'Tüp Dolum Makinası'),
('UK-1030', 'Rolon Dolum Makinası'),
('ÜT-1004', 'Saçyar Mikser'),
('ÜT-1005', 'Manuel Likit Dolum Makinası'),
('ÜT-1007', 'Şaşet Dolum Makinası'),
('UK-1053', 'Pilot Reaktör (APM Mikser)'),
('TD-1001', 'Buhar Jeneratörü'),
('TD-1002', 'Elektrik Jeneratörü'),
('TD-1004', 'Büyük Chiller'),
('TD-1005', 'Kompresör (900 lt)'),
('TD-1006', 'Kirna Santral'),
('TD-1007', 'Su Hidrofor Pompa Sistemi'),
('TD-1008', 'Yangın Hidrofor Pompa Sist.'),
('TD-1009', 'Osmos Su Sistemi'),
('TD-1010', 'Kompresör (150 lt)'),
('ÜT-1013', 'Pres Filtre - 1'),
('ÜT-1014', 'Pres Filtre - 2'),
('UK-1101', 'Otomatik Kurutma Makinası'),
('UK-1000', 'Hammadde stok tankı'),
('UK-1001', 'Hammadde stok tankı'),
('UK-1002', 'Hammadde stok tankı'),
('UK-1003', 'Hammadde stok tankı'),
('UK-1004', 'Hammadde stok tankı'),
('UK-1082', 'Transpalet'),
('UK-1068', 'Transpalet'),
('UK-1069', 'Transpalet'),
('UK-1102', 'Transpalet'),
('UK-1065', 'Caraskal Vinc'),
('NA-1', 'Elektrik Sistemleri'),
('NA-2', 'Hepa Filtre Hava Ölçümleri'),
('TD-1003', 'Küçük Chiller'),
('TD-1014', 'Transpalet'),
('TD-1015', 'Transpalet'),
('TD-1016', 'Baskülü Transpalet'),
('NA-3', 'İç Metan Kima'),
('NA-4', 'Yangın Söndürücü Kontroleri'),
('NA-5', 'Hepa Filtre Hava Ölçümleri Hammadde Depo'),
('UK-1136', 'Koli Bantlama Makinası')
ON CONFLICT (machine_no) DO NOTHING;

-- ============================================
-- 4. SAMPLE DATA - MAINTENANCE SCHEDULES (47 adet)
-- ============================================

-- UK-1010: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1010';

-- UK-1011: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1011';

-- UK-1012: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1012';

-- UK-1013: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1013';

-- UK-1014: 3 Aylık (2,5,8,11)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[2,5,8,11]
FROM machines WHERE machine_no = 'UK-1014';

-- UK-1015: 3 Aylık (2,5,8,11)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[2,5,8,11]
FROM machines WHERE machine_no = 'UK-1015';

-- UK-1029: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1029';

-- UK-1067: 3 Aylık (2,5,8,11)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[2,5,8,11]
FROM machines WHERE machine_no = 'UK-1067';

-- UK-1031: 3 Aylık (2,5,8,11)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[2,5,8,11]
FROM machines WHERE machine_no = 'UK-1031';

-- UK-1035: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1035';

-- UK-1030: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1030';

-- ÜT-1004: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'ÜT-1004';

-- ÜT-1005: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'ÜT-1005';

-- ÜT-1007: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'ÜT-1007';

-- UK-1053: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1053';

-- TD-1001: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'TD-1001';

-- TD-1002: Aylık (1-12)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'monthly', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]
FROM machines WHERE machine_no = 'TD-1002';

-- TD-1004: Aylık (1-12)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'monthly', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]
FROM machines WHERE machine_no = 'TD-1004';

-- TD-1005: Aylık (1-12)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'monthly', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]
FROM machines WHERE machine_no = 'TD-1005';

-- TD-1006: 6 Aylık (1,7)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'semi-annual', ARRAY[1,7]
FROM machines WHERE machine_no = 'TD-1006';

-- TD-1007: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'TD-1007';

-- TD-1008: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'TD-1008';

-- TD-1009: Aylık (1-12)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'monthly', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]
FROM machines WHERE machine_no = 'TD-1009';

-- TD-1010: Aylık (1-12)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'monthly', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]
FROM machines WHERE machine_no = 'TD-1010';

-- ÜT-1013: 3 Aylık (2,5,8,11)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[2,5,8,11]
FROM machines WHERE machine_no = 'ÜT-1013';

-- ÜT-1014: 6 Aylık (2,8)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'semi-annual', ARRAY[2,8]
FROM machines WHERE machine_no = 'ÜT-1014';

-- UK-1101: 3 Aylık (2,5,8,11)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[2,5,8,11]
FROM machines WHERE machine_no = 'UK-1101';

-- UK-1000: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1000';

-- UK-1001: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1001';

-- UK-1002: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1002';

-- UK-1003: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1003';

-- UK-1004: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1004';

-- UK-1082: 3 Aylık (2,5,8,11)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[2,5,8,11]
FROM machines WHERE machine_no = 'UK-1082';

-- UK-1068: 3 Aylık (2,5,8,11)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[2,5,8,11]
FROM machines WHERE machine_no = 'UK-1068';

-- UK-1069: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1069';

-- UK-1102: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1102';

-- UK-1065: 6 Aylık (3,9)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'semi-annual', ARRAY[3,9]
FROM machines WHERE machine_no = 'UK-1065';

-- NA-1: 3 Aylık (2,5,8,11)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[2,5,8,11]
FROM machines WHERE machine_no = 'NA-1';

-- NA-2: 3 Aylık (2,5,8,11)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[2,5,8,11]
FROM machines WHERE machine_no = 'NA-2';

-- TD-1003: Aylık (1-12)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'monthly', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]
FROM machines WHERE machine_no = 'TD-1003';

-- TD-1014: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'TD-1014';

-- TD-1015: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'TD-1015';

-- TD-1016: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'TD-1016';

-- NA-3: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'NA-3';

-- NA-4: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'NA-4';

-- NA-5: Aylık (1-12)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'monthly', ARRAY[1,2,3,4,5,6,7,8,9,10,11,12]
FROM machines WHERE machine_no = 'NA-5';

-- UK-1136: 3 Aylık (1,4,7,10)
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months)
SELECT id, 'İÇ BAKIM', 'quarterly', ARRAY[1,4,7,10]
FROM machines WHERE machine_no = 'UK-1136';

-- ============================================
-- 5. SUCCESS MESSAGE
-- ============================================

DO $$
DECLARE
  machine_count INTEGER;
  schedule_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO machine_count FROM machines;
  SELECT COUNT(*) INTO schedule_count FROM maintenance_schedules WHERE is_active = true;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Bakım Yönetim Sistemi - Makineler ve Planlar Hazır!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 % makine kaydedildi', machine_count;
  RAISE NOTICE '📅 % bakım planı oluşturuldu', schedule_count;
  RAISE NOTICE '🔒 RLS policies aktif (sadece admin ve maintenance rolü erişebilir)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ÖNEMLİ: Bakım kayıtları henüz oluşturulmadı!';
  RAISE NOTICE '💡 Bakım kayıtlarını oluşturmak için:';
  RAISE NOTICE '   1. 20251024_generate_maintenance_records.sql dosyasını çalıştırın';
  RAISE NOTICE '   2. 2025 Kasım-Aralık + 2026 Tüm Yıl kayıtları oluşturulacak';
  RAISE NOTICE '';
END $$;
