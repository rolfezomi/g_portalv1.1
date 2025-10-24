-- Import machines and schedules from Excel
-- Generated from EK-3 YILLIK BAKIM PLANI 2024.xlsx

-- Insert machines
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('TD-1002', 'Elektrik Jeneratörü', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('TD-1010', 'Kompresör (150 lt)', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('TD-1011', 'Forklift EFG 216', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('TD-1012', 'Forklift EFG 430', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜK-1105', 'Inkjet Makinesi', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜK-1106', 'Inkjet Makinesi', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜK-1010', '3 Tonluk Mikser', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜK-1011', '7 Tonluk Mikser', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜK-1012', '7 Tonluk Mikser', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜK-1013', '2 Tonluk Mikser', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜK-1034', 'Zarf Tipi Paketleme Mak.', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜK-1030', 'Rolon Dolum Makinası', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜT-1004', 'Seyyar Mikser', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜT-1005', 'Manuel Likit Dolum Makinası', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜT-1007', 'Şaset Dolum Makinası', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜK-1053', 'Pilot Reaktör (APM Mikser)', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('TD-1001', 'Buhar Jeneratörü', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('TD-1004', 'Büyük Chiller', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('TD-1005', 'Kompresör (900 lt)', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('TD-1006', 'Klima Santrali', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('TD-1007', 'Su Hidrofor Pompa Sistemi', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('TD-1008', 'Yangın Hidrofor Pompa Sist.', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('TD-1009', 'Ozmos Su Sistemi', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜT-1013', 'Pres Filtre - 1', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜT-1014', 'Pres Filtre - 2', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('TD-1003', 'Küçük Chiller', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('NA', 'Hepa Filtre Hava Ölçümleri Hammadde  Depo', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;
INSERT INTO machines (machine_no, machine_name, location, is_active)
VALUES ('ÜK-1136', 'Koli Bantlama Makinası', NULL, true)
ON CONFLICT (machine_no) DO UPDATE SET
  machine_name = EXCLUDED.machine_name,
  location = EXCLUDED.location,
  is_active = EXCLUDED.is_active;

-- Insert maintenance schedules
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'TD-1002'),
  'DIŞ HİZMET',
  'annual',
  '{8}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'TD-1010'),
  'DIŞ HİZMET',
  'annual',
  '{8}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'TD-1010'),
  'İÇ BAKIM',
  'weekly',
  '{1,2,3,4,5,6,7,8,9,10,11,12}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'TD-1011'),
  'DIŞ HİZMET',
  'semi-annual',
  '{2,8}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'TD-1012'),
  'DIŞ HİZMET',
  'semi-annual',
  '{2,8}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜK-1105'),
  'DIŞ HİZMET',
  'annual',
  '{1}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜK-1106'),
  'DIŞ HİZMET',
  'annual',
  '{1}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜK-1010'),
  'İÇ BAKIM',
  'quarterly',
  '{1,4,7,10}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜK-1011'),
  'İÇ BAKIM',
  'quarterly',
  '{1,4,7,10}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜK-1012'),
  'İÇ BAKIM',
  'quarterly',
  '{1,4,7,10}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜK-1013'),
  'İÇ BAKIM',
  'quarterly',
  '{1,4,7,10}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜK-1034'),
  'İÇ BAKIM',
  'semi-annual',
  '{1,2,3,4,5,6,7,8,9,10,11,12}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜK-1030'),
  'İÇ BAKIM',
  'annual',
  '{8}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜT-1004'),
  'İÇ BAKIM',
  'annual',
  '{8}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜT-1005'),
  'İÇ BAKIM',
  'annual',
  '{8}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜT-1007'),
  'İÇ BAKIM',
  'semi-annual',
  '{8,9,10,11,12}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜK-1053'),
  'İÇ BAKIM',
  'annual',
  '{8}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'TD-1001'),
  'İÇ BAKIM',
  'weekly',
  '{1,2,3,4,5,6,7,8,9,10,11,12}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'TD-1004'),
  'İÇ BAKIM',
  'weekly',
  '{1,2,3,4,5,6,7,8,9,10,11,12}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'TD-1005'),
  'İÇ BAKIM',
  'weekly',
  '{1,2,3,4,5,6,7,8,9,10,11,12}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'TD-1006'),
  'İÇ BAKIM',
  'weekly',
  '{1,2,3,4,5,6,7,8,9,10,11,12}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'TD-1007'),
  'İÇ BAKIM',
  'weekly',
  '{1,2,3,4,5,6,7,8,9,10,11,12}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'TD-1008'),
  'İÇ BAKIM',
  'weekly',
  '{1,2,3,4,5,6,7,8,9,10,11,12}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'TD-1009'),
  'İÇ BAKIM',
  'monthly',
  '{1,2,3,4,5,6,7,8,9,10,11,12}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜT-1013'),
  'İÇ BAKIM',
  'quarterly',
  '{1,4,7,10}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜT-1014'),
  'İÇ BAKIM',
  'quarterly',
  '{1,4,7,10}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'TD-1003'),
  'İÇ BAKIM',
  'weekly',
  '{1,2,3,4,5,6,7,8,9,10,11,12}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'NA'),
  'İÇ BAKIM',
  'monthly',
  '{1,2,3,4,5,6,7,8,9,10,11,12}'::integer[],
  true
);
INSERT INTO maintenance_schedules (machine_id, maintenance_type, frequency, months, is_active)
VALUES (
  (SELECT id FROM machines WHERE machine_no = 'ÜK-1136'),
  'İÇ BAKIM',
  'annual',
  '{12}'::integer[],
  true
);

-- Generate maintenance records for 2025
SELECT generate_maintenance_records_for_year(2025);