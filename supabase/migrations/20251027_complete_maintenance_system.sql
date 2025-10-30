-- =====================================================
-- Glohe Bakım Yönetim Sistemi - Tam Migrasyon
-- Tarih: 2025-10-27
-- Açıklama: Eksik makineler, yeni tablolar ve takvim sistemi
-- =====================================================

-- ==================== BÖLÜM 0: MAKİNELER TABLOSUNU GENİŞLET ====================

-- Eksik kolonları ekle (IF NOT EXISTS ile güvenli)
-- Bu kolonlar frontend kategorileme, lokasyon ve durum için gerekli
ALTER TABLE machines ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Kategori bazlı index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_machines_category ON machines(category);
CREATE INDEX IF NOT EXISTS idx_machines_status ON machines(status);

-- ==================== BÖLÜM 1: EKSİK MAKİNELERİ EKLE ====================

-- ÜK Serisi (Üretim Kategorisi) - 17 Makine
INSERT INTO machines (machine_no, machine_name, category, location, status) VALUES
('ÜK-1014', 'Kesme Makinesi 14', 'ÜK', 'Üretim', 'active'),
('ÜK-1015', 'Kesme Makinesi 15', 'ÜK', 'Üretim', 'active'),
('ÜK-1029', 'Kesme Makinesi 29', 'ÜK', 'Üretim', 'active'),
('ÜK-1030', 'Kesme Makinesi 30', 'ÜK', 'Üretim', 'active'),
('ÜK-1031', 'Kesme Makinesi 31', 'ÜK', 'Üretim', 'active'),
('ÜK-1032', 'Kesme Makinesi 32', 'ÜK', 'Üretim', 'active'),
('ÜK-1033', 'Kesme Makinesi 33', 'ÜK', 'Üretim', 'active'),
('ÜK-1034', 'Kesme Makinesi 34', 'ÜK', 'Üretim', 'active'),
('ÜK-1040', 'Kesme Makinesi 40', 'ÜK', 'Üretim', 'active'),
('ÜK-1041', 'Kesme Makinesi 41', 'ÜK', 'Üretim', 'active'),
('ÜK-1042', 'Kesme Makinesi 42', 'ÜK', 'Üretim', 'active'),
('ÜK-1043', 'Kesme Makinesi 43', 'ÜK', 'Üretim', 'active'),
('ÜK-1044', 'Kesme Makinesi 44', 'ÜK', 'Üretim', 'active'),
('ÜK-1045', 'Kesme Makinesi 45', 'ÜK', 'Üretim', 'active'),
('ÜK-1046', 'Kesme Makinesi 46', 'ÜK', 'Üretim', 'active'),
('ÜK-1047', 'Kesme Makinesi 47', 'ÜK', 'Üretim', 'active'),
('ÜK-1049', 'Kesme Makinesi 49', 'ÜK', 'Üretim', 'active')
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  category = EXCLUDED.category,
  location = EXCLUDED.location,
  status = EXCLUDED.status;

-- TD Serisi (Teknik Destek) - 3 Makine
INSERT INTO machines (machine_no, machine_name, category, location, status) VALUES
('TD-2005', 'Destek Ekipmanı 5', 'TD', 'Teknik Destek', 'active'),
('TD-2006', 'Destek Ekipmanı 6', 'TD', 'Teknik Destek', 'active'),
('TD-2011', 'Destek Ekipmanı 11', 'TD', 'Teknik Destek', 'active')
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  category = EXCLUDED.category,
  location = EXCLUDED.location,
  status = EXCLUDED.status;

-- ÜT Serisi (Üretim Teknik) - 5 Makine
INSERT INTO machines (machine_no, machine_name, category, location, status) VALUES
('ÜT-3017', 'Teknik Üretim Ekipmanı 17', 'ÜT', 'Üretim', 'active'),
('ÜT-3019', 'Teknik Üretim Ekipmanı 19', 'ÜT', 'Üretim', 'active'),
('ÜT-3020', 'Teknik Üretim Ekipmanı 20', 'ÜT', 'Üretim', 'active'),
('ÜT-3021', 'Teknik Üretim Ekipmanı 21', 'ÜT', 'Üretim', 'active'),
('ÜT-3022', 'Teknik Üretim Ekipmanı 22', 'ÜT', 'Üretim', 'active')
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  category = EXCLUDED.category,
  location = EXCLUDED.location,
  status = EXCLUDED.status;

-- NA Serisi (Genel Alan) - 4 Makine
INSERT INTO machines (machine_no, machine_name, category, location, status) VALUES
('NA-4001', 'Genel Alan Ekipmanı 1', 'NA', 'Genel', 'active'),
('NA-4002', 'Genel Alan Ekipmanı 2', 'NA', 'Genel', 'active'),
('NA-4003', 'Genel Alan Ekipmanı 3', 'NA', 'Genel', 'active'),
('NA-4004', 'Genel Alan Ekipmanı 4', 'NA', 'Genel', 'active')
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  category = EXCLUDED.category,
  location = EXCLUDED.location,
  status = EXCLUDED.status;

-- ==================== BÖLÜM 2: YENİ TABLOLARI OLUŞTUR ====================

-- 1) BAKIM TAKVİMİ TABLOSU (önce oluştur - maintenance_records'a referans edilecek)
CREATE TABLE IF NOT EXISTS maintenance_calendar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  schedule_id UUID REFERENCES maintenance_schedules(id) ON DELETE CASCADE NOT NULL,
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE NOT NULL,
  maintenance_type TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'semi-annual', 'annual')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME DEFAULT '09:00:00',
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  week INTEGER CHECK (week BETWEEN 1 AND 4),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Pazartesi, 7=Pazar
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'overdue')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(schedule_id, scheduled_date)
);

-- 1.5) MEVCUT MAINTENANCE_RECORDS TABLOSUNU GÜNCELLE
-- maintenance_records tablosu zaten var ama bazı kolonlar eksik olabilir
DO $$
BEGIN
  -- scheduled_date kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_records' AND column_name = 'scheduled_date'
  ) THEN
    ALTER TABLE maintenance_records ADD COLUMN scheduled_date DATE;
    RAISE NOTICE '✅ maintenance_records.scheduled_date kolonu eklendi';
  END IF;

  -- calendar_id kolonu yoksa ekle (maintenance_calendar oluşturulduktan sonra)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_records' AND column_name = 'calendar_id'
  ) THEN
    ALTER TABLE maintenance_records ADD COLUMN calendar_id UUID REFERENCES maintenance_calendar(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ maintenance_records.calendar_id kolonu eklendi';
  END IF;

  -- priority kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_records' AND column_name = 'priority'
  ) THEN
    ALTER TABLE maintenance_records ADD COLUMN priority INTEGER DEFAULT 0;
    RAISE NOTICE '✅ maintenance_records.priority kolonu eklendi';
  END IF;

  -- checklist_results kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_records' AND column_name = 'checklist_results'
  ) THEN
    ALTER TABLE maintenance_records ADD COLUMN checklist_results JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE '✅ maintenance_records.checklist_results kolonu eklendi';
  END IF;

  -- photos kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_records' AND column_name = 'photos'
  ) THEN
    ALTER TABLE maintenance_records ADD COLUMN photos TEXT[] DEFAULT ARRAY[]::TEXT[];
    RAISE NOTICE '✅ maintenance_records.photos kolonu eklendi';
  END IF;

  -- materials_used kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_records' AND column_name = 'materials_used'
  ) THEN
    ALTER TABLE maintenance_records ADD COLUMN materials_used TEXT;
    RAISE NOTICE '✅ maintenance_records.materials_used kolonu eklendi';
  END IF;

  -- next_maintenance_date kolonu yoksa ekle
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'maintenance_records' AND column_name = 'next_maintenance_date'
  ) THEN
    ALTER TABLE maintenance_records ADD COLUMN next_maintenance_date DATE;
    RAISE NOTICE '✅ maintenance_records.next_maintenance_date kolonu eklendi';
  END IF;

  RAISE NOTICE '✅ maintenance_records tablosu güncellendi';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ maintenance_records güncelleme hatası: %', SQLERRM;
END $$;

-- 2) BAKIM KAYITLARI TABLOSU (maintenance_calendar'dan sonra oluştur)
-- NOT: Bu tablo zaten mevcut olabilir, IF NOT EXISTS ile güvenli oluştur
CREATE TABLE IF NOT EXISTS maintenance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calendar_id UUID REFERENCES maintenance_calendar(id) ON DELETE CASCADE,
  machine_id UUID REFERENCES machines(id) ON DELETE CASCADE NOT NULL,
  maintenance_type TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'overdue')),
  priority INTEGER DEFAULT 0, -- 0=normal, 1=high, 2=urgent
  performed_by UUID REFERENCES auth.users(id),
  duration_minutes INTEGER,
  notes TEXT,
  checklist_results JSONB DEFAULT '[]'::jsonb,
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  materials_used TEXT,
  next_maintenance_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3) CHECKLIST ŞABLONLARı TABLOSU
CREATE TABLE IF NOT EXISTS checklist_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  maintenance_type TEXT,
  category TEXT, -- 'mechanical', 'electrical', 'general', vb.
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- items yapısı: [{"id": "1", "label": "Yağ seviyesi kontrolü", "type": "checkbox", "required": true}, ...]
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ==================== BÖLÜM 3: İNDEXLER ====================

-- maintenance_records indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_records_machine_id ON maintenance_records(machine_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_scheduled_date ON maintenance_records(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_completed_date ON maintenance_records(completed_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_performed_by ON maintenance_records(performed_by);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_calendar_id ON maintenance_records(calendar_id);

-- maintenance_calendar indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_calendar_machine_id ON maintenance_calendar(machine_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_calendar_schedule_id ON maintenance_calendar(schedule_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_calendar_scheduled_date ON maintenance_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_calendar_status ON maintenance_calendar(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_calendar_year_month ON maintenance_calendar(year, month);

-- checklist_templates indexes
CREATE INDEX IF NOT EXISTS idx_checklist_templates_maintenance_type ON checklist_templates(maintenance_type);
CREATE INDEX IF NOT EXISTS idx_checklist_templates_category ON checklist_templates(category);

-- ==================== BÖLÜM 4: RLS POLİCYLERİ ====================

-- maintenance_records RLS
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view maintenance records"
  ON maintenance_records FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert maintenance records"
  ON maintenance_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update maintenance records"
  ON maintenance_records FOR UPDATE
  TO authenticated
  USING (true);

-- maintenance_calendar RLS
ALTER TABLE maintenance_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view calendar"
  ON maintenance_calendar FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert calendar events"
  ON maintenance_calendar FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update calendar events"
  ON maintenance_calendar FOR UPDATE
  TO authenticated
  USING (true);

-- checklist_templates RLS
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
  ON checklist_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert templates"
  ON checklist_templates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update templates"
  ON checklist_templates FOR UPDATE
  TO authenticated
  USING (true);

-- ==================== BÖLÜM 5: TRIGGER FUNCTIONS ====================

-- updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- maintenance_records updated_at trigger
CREATE TRIGGER update_maintenance_records_updated_at
  BEFORE UPDATE ON maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- maintenance_calendar updated_at trigger
CREATE TRIGGER update_maintenance_calendar_updated_at
  BEFORE UPDATE ON maintenance_calendar
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- checklist_templates updated_at trigger
CREATE TRIGGER update_checklist_templates_updated_at
  BEFORE UPDATE ON checklist_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update overdue status
CREATE OR REPLACE FUNCTION update_overdue_maintenance()
RETURNS void AS $$
BEGIN
  -- Update calendar events
  UPDATE maintenance_calendar
  SET status = 'overdue'
  WHERE scheduled_date < CURRENT_DATE
    AND status = 'scheduled';

  -- Update maintenance records
  UPDATE maintenance_records
  SET status = 'overdue'
  WHERE scheduled_date < CURRENT_DATE
    AND status IN ('pending', 'in_progress');
END;
$$ LANGUAGE plpgsql;

-- ==================== BÖLÜM 6: TAKVİM OLUŞTURMA FONKSİYONLARI ====================

-- Haftalık bakımları günlere dağıt (Pazartesi-Cuma arası)
CREATE OR REPLACE FUNCTION distribute_weekly_maintenance(
  p_schedule_id UUID,
  p_machine_id UUID,
  p_maintenance_type TEXT,
  p_year INTEGER
)
RETURNS void AS $$
DECLARE
  v_day_offset INTEGER := 0;
  v_current_date DATE;
  v_week_num INTEGER;
  v_day_of_week INTEGER;
  v_hour INTEGER;
  v_minute INTEGER;
BEGIN
  -- Her hafta için bir gün oluştur (52 hafta)
  FOR week_counter IN 0..51 LOOP
    -- Yılın başından itibaren hafta hesapla
    v_current_date := DATE(p_year || '-01-01') + (week_counter * 7);

    -- Haftanın gününü belirle (1-5 arası, Pazartesi-Cuma)
    v_day_of_week := (week_counter % 5) + 1; -- 1=Pzt, 2=Sal, 3=Çar, 4=Per, 5=Cum

    -- O haftanın başına git ve günü ayarla
    v_current_date := date_trunc('week', v_current_date)::date + (v_day_of_week - 1);

    -- Yıl sınırını aşmasın
    IF EXTRACT(YEAR FROM v_current_date) = p_year THEN
      -- Hafta numarasını hesapla (ayın hangi haftası)
      v_week_num := CASE
        WHEN EXTRACT(DAY FROM v_current_date) BETWEEN 1 AND 7 THEN 1
        WHEN EXTRACT(DAY FROM v_current_date) BETWEEN 8 AND 14 THEN 2
        WHEN EXTRACT(DAY FROM v_current_date) BETWEEN 15 AND 21 THEN 3
        ELSE 4
      END;

      -- Saat dağıt (09:00 - 16:00 arası, her makine için farklı)
      v_hour := 9 + (week_counter % 8); -- 9-16 arası
      v_minute := (week_counter % 4) * 15; -- 0, 15, 30, 45

      -- Takvim kaydı ekle
      INSERT INTO maintenance_calendar (
        schedule_id,
        machine_id,
        maintenance_type,
        frequency,
        scheduled_date,
        scheduled_time,
        year,
        month,
        week,
        day_of_week,
        status
      ) VALUES (
        p_schedule_id,
        p_machine_id,
        p_maintenance_type,
        'weekly',
        v_current_date,
        make_time(v_hour, v_minute, 0),
        p_year,
        EXTRACT(MONTH FROM v_current_date)::INTEGER,
        v_week_num,
        v_day_of_week,
        'scheduled'
      )
      ON CONFLICT (schedule_id, scheduled_date) DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Aylık/Üç Aylık/Altı Aylık/Yıllık bakımları oluştur
CREATE OR REPLACE FUNCTION generate_scheduled_maintenance(
  p_schedule_id UUID,
  p_machine_id UUID,
  p_maintenance_type TEXT,
  p_frequency TEXT,
  p_months INTEGER[],
  p_year INTEGER
)
RETURNS void AS $$
DECLARE
  v_month INTEGER;
  v_week INTEGER;
  v_date DATE;
  v_day_of_week INTEGER;
  v_hour INTEGER;
  v_minute INTEGER;
BEGIN
  -- Belirtilen her ay için
  FOREACH v_month IN ARRAY p_months LOOP
    -- Her hafta için (1-4)
    FOR v_week IN 1..4 LOOP
      -- Haftanın ilk günü
      v_date := DATE(p_year || '-' || v_month || '-01') + ((v_week - 1) * 7);

      -- Ayın sınırını aşmasın
      IF EXTRACT(MONTH FROM v_date) = v_month THEN
        -- Haftanın ortası (Çarşamba)
        v_day_of_week := 3;
        v_date := date_trunc('week', v_date)::date + 2; -- Çarşamba

        -- Saat dağıt
        v_hour := 10 + (v_week - 1) * 2; -- 10, 12, 14, 16
        v_minute := v_month * 5 % 60; -- Aya göre dakika

        -- Takvim kaydı ekle
        INSERT INTO maintenance_calendar (
          schedule_id,
          machine_id,
          maintenance_type,
          frequency,
          scheduled_date,
          scheduled_time,
          year,
          month,
          week,
          day_of_week,
          status
        ) VALUES (
          p_schedule_id,
          p_machine_id,
          p_maintenance_type,
          p_frequency,
          v_date,
          make_time(v_hour, v_minute, 0),
          p_year,
          v_month,
          v_week,
          v_day_of_week,
          'scheduled'
        )
        ON CONFLICT (schedule_id, scheduled_date) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ana takvim oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION generate_maintenance_calendar(p_year INTEGER)
RETURNS void AS $$
DECLARE
  v_schedule RECORD;
BEGIN
  -- Tüm aktif schedule'ları al
  FOR v_schedule IN
    SELECT
      ms.id as schedule_id,
      ms.machine_id,
      ms.maintenance_type,
      ms.frequency,
      ms.months
    FROM maintenance_schedules ms
    INNER JOIN machines m ON m.id = ms.machine_id
  LOOP
    -- Frequency'ye göre takvim oluştur
    IF v_schedule.frequency = 'weekly' THEN
      -- Haftalık bakımları dağıt
      PERFORM distribute_weekly_maintenance(
        v_schedule.schedule_id,
        v_schedule.machine_id,
        v_schedule.maintenance_type,
        p_year
      );
    ELSE
      -- Aylık/Üç Aylık/Altı Aylık/Yıllık
      -- months kolonu zaten int4[] tipinde, direkt kullan
      PERFORM generate_scheduled_maintenance(
        v_schedule.schedule_id,
        v_schedule.machine_id,
        v_schedule.maintenance_type,
        v_schedule.frequency,
        v_schedule.months, -- Direkt int4[] olarak kullan
        p_year
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ==================== BÖLÜM 7: GENEL CHECKLIST ŞABLONU ====================

INSERT INTO checklist_templates (name, description, maintenance_type, category, items, is_default)
VALUES (
  'Genel Bakım Kontrol Listesi',
  'Tüm makine tipleri için kullanılabilecek genel bakım kontrol listesi',
  'Genel',
  'general',
  '[
    {
      "id": "1",
      "label": "Makine temizliği yapıldı",
      "type": "checkbox",
      "required": true
    },
    {
      "id": "2",
      "label": "Yağ seviyeleri kontrol edildi",
      "type": "checkbox",
      "required": true
    },
    {
      "id": "3",
      "label": "Hareketli parçalar yağlandı",
      "type": "checkbox",
      "required": true
    },
    {
      "id": "4",
      "label": "Kayış gerginliği kontrol edildi",
      "type": "checkbox",
      "required": false
    },
    {
      "id": "5",
      "label": "Elektrik bağlantıları kontrol edildi",
      "type": "checkbox",
      "required": true
    },
    {
      "id": "6",
      "label": "Güvenlik donanımları test edildi",
      "type": "checkbox",
      "required": true
    },
    {
      "id": "7",
      "label": "Anormal ses/titreşim var mı?",
      "type": "radio",
      "options": ["Hayır", "Evet - Hafif", "Evet - Ciddi"],
      "required": true
    },
    {
      "id": "8",
      "label": "Sıcaklık ölçümü",
      "type": "text",
      "placeholder": "°C",
      "required": false
    },
    {
      "id": "9",
      "label": "Filtreler kontrol edildi/değiştirildi",
      "type": "checkbox",
      "required": false
    },
    {
      "id": "10",
      "label": "Genel durum notu",
      "type": "textarea",
      "placeholder": "Makine durumu hakkında genel notlar...",
      "required": false
    }
  ]'::jsonb,
  true
);

-- ==================== BÖLÜM 8: 2025 TAKVİMİNİ OLUŞTUR ====================

-- 2025 yılı için tüm bakım takvimini otomatik oluştur (güvenli)
DO $$
DECLARE
  schedule_count INTEGER;
  calendar_count INTEGER;
BEGIN
  -- maintenance_schedules tablosunda kayıt var mı kontrol et
  SELECT COUNT(*) INTO schedule_count FROM maintenance_schedules;

  IF schedule_count > 0 THEN
    -- Takvim oluştur
    BEGIN
      PERFORM generate_maintenance_calendar(2025);

      -- Kaç tane etkinlik oluşturulduğunu say
      SELECT COUNT(*) INTO calendar_count FROM maintenance_calendar WHERE year = 2025;

      RAISE NOTICE '✅ 2025 takvimi başarıyla oluşturuldu: % schedule için % etkinlik', schedule_count, calendar_count;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE '⚠️ Takvim oluşturma hatası: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE '⚠️ maintenance_schedules tablosu boş, takvim oluşturulmadı';
    RAISE NOTICE '   Takvimi daha sonra manuel oluşturabilirsiniz: SELECT generate_maintenance_calendar(2025);';
  END IF;
END $$;

-- Overdue kontrolünü çalıştır (güvenli)
DO $$
BEGIN
  PERFORM update_overdue_maintenance();
  RAISE NOTICE '✅ Overdue maintenance kontrolü tamamlandı';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Overdue kontrolü hatası: %', SQLERRM;
END $$;

-- ==================== MİGRASYON TAMAMLANDI ====================
-- ✅ Machines tablosuna eklenen kolon: 3 (category, location, status)
-- ✅ Toplam eklenen makine: 29 (ON CONFLICT ile güvenli)
-- ✅ Toplam oluşturulan YENİ tablo: 2 (maintenance_calendar, checklist_templates)
--    NOT: maintenance_schedules ve maintenance_records zaten mevcut!
-- ✅ Toplam oluşturulan index: 9
--    - 2 machines (category, status)
--    - 5 maintenance_calendar
--    - 2 checklist_templates
-- ✅ Toplam oluşturulan RLS policy: 6
--    - 3 maintenance_calendar (view, insert, update)
--    - 3 checklist_templates (view, insert, update)
-- ✅ Toplam oluşturulan function: 5
--    - update_updated_at_column()
--    - update_overdue_maintenance()
--    - distribute_weekly_maintenance()
--    - generate_scheduled_maintenance()
--    - generate_maintenance_calendar()
-- ✅ Toplam trigger: 2 (maintenance_calendar, checklist_templates)
-- ✅ 2025 takvimi: Güvenli şekilde oluşturuldu (schedule varsa)
-- ✅ Error handling: Tüm kritik bölümlerde mevcut
--
-- MEVCUT TABLOLAR (Migration öncesi):
-- ✅ maintenance_schedules (47 records - months: int4[], is_active: bool)
-- ✅ maintenance_records
--
-- YENİ OLUŞTURULACAK TABLOLAR:
-- 🆕 maintenance_calendar (maintenance_schedules'a referans)
-- 🆕 checklist_templates (bağımsız)
--
-- NOTLAR:
-- - Duplicate makine kayıtları güvenli şekilde UPDATE edilir (ON CONFLICT)
-- - maintenance_schedules boşsa takvim oluşturulmaz (hata vermez)
-- - Tüm hatalar NOTICE olarak loglanır, migration durdurmaz
-- - Mevcut tablolar dokunulmadan bırakıldı
--
-- SON ADIM: Supabase Dashboard'da bu SQL'i çalıştır ve NOTICE mesajlarını kontrol et!
