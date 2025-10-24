-- ============================================
-- BAKIM KAYITLARI OLUŞTUR (GELECEK)
-- ============================================
-- Başlangıç tarihi: 24 Ekim 2025
-- Bu migration sadece gelecek bakım kayıtlarını oluşturur
-- 2025 Kasım-Aralık + 2026 Tüm Yıl

-- ============================================
-- 1. 2025 KASIM-ARALIK KAYITLARI
-- ============================================

INSERT INTO maintenance_records (schedule_id, machine_id, planned_date, status)
SELECT
  s.id as schedule_id,
  s.machine_id,
  make_date(2025, month_num, 15) as planned_date,
  'pending' as status
FROM
  maintenance_schedules s,
  unnest(s.months) as month_num
WHERE
  s.is_active = true
  AND month_num >= 11  -- Kasım ve Aralık
ORDER BY
  planned_date;

-- ============================================
-- 2. 2026 TÜM YIL KAYITLARI
-- ============================================

INSERT INTO maintenance_records (schedule_id, machine_id, planned_date, status)
SELECT
  s.id as schedule_id,
  s.machine_id,
  make_date(2026, month_num, 15) as planned_date,
  'pending' as status
FROM
  maintenance_schedules s,
  unnest(s.months) as month_num
WHERE
  s.is_active = true
ORDER BY
  planned_date;

-- ============================================
-- 3. ÖZET RAPOR
-- ============================================

DO $$
DECLARE
  record_count_2025 INTEGER;
  record_count_2026 INTEGER;
  total_count INTEGER;
  machine_count INTEGER;
  schedule_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO machine_count FROM machines;
  SELECT COUNT(*) INTO schedule_count FROM maintenance_schedules WHERE is_active = true;
  SELECT COUNT(*) INTO record_count_2025
    FROM maintenance_records
    WHERE EXTRACT(YEAR FROM planned_date) = 2025;
  SELECT COUNT(*) INTO record_count_2026
    FROM maintenance_records
    WHERE EXTRACT(YEAR FROM planned_date) = 2026;

  total_count := record_count_2025 + record_count_2026;

  RAISE NOTICE '';
  RAISE NOTICE '✅ Bakım Kayıtları Başarıyla Oluşturuldu!';
  RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
  RAISE NOTICE '📊 Sistem Durumu:';
  RAISE NOTICE '   • % makine', machine_count;
  RAISE NOTICE '   • % aktif bakım planı', schedule_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Oluşturulan Kayıtlar:';
  RAISE NOTICE '   • 2025 (Kas-Ara): % kayıt', record_count_2025;
  RAISE NOTICE '   • 2026 (Tüm Yıl): % kayıt', record_count_2026;
  RAISE NOTICE '   • TOPLAM: % bakım kaydı', total_count;
  RAISE NOTICE '';
  RAISE NOTICE '📅 Detaylar:';
  RAISE NOTICE '   • Başlangıç: 15 Kasım 2025';
  RAISE NOTICE '   • Bitiş: 15 Aralık 2026';
  RAISE NOTICE '   • Tüm kayıtlar: pending (beklemede)';
  RAISE NOTICE '   • Planned date: Her ayın 15''i';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Not: Bakımlar tamamlandığında:';
  RAISE NOTICE '   • performed_by: Giriş yapan kullanıcı otomatik';
  RAISE NOTICE '   • materials_used: Kullanıcı manuel girecek';
  RAISE NOTICE '   • notes: Opsiyonel';
  RAISE NOTICE '';
END $$;
