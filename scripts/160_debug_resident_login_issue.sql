-- scripts/160_debug_resident_login_issue.sql
-- ตรวจสอบปัญหาการเข้าสู่ระบบ

-- ========================================
-- ขั้นตอนที่ 1: ตรวจสอบข้อมูลในตาราง units
-- ========================================
SELECT 
  'ข้อมูลในตาราง units' as table_info,
  COUNT(*) as total_units,
  COUNT(CASE WHEN username IS NOT NULL THEN 1 END) as units_with_username,
  COUNT(CASE WHEN password IS NOT NULL THEN 1 END) as units_with_password
FROM units;

-- ========================================
-- ขั้นตอนที่ 2: ดูข้อมูล units ที่มี username
-- ========================================
SELECT 
  id,
  unit_number,
  username,
  password,
  owner_name,
  owner_email,
  resident_name
FROM units 
WHERE username IS NOT NULL
ORDER BY unit_number;

-- ========================================
-- ขั้นตอนที่ 3: ตรวจสอบข้อมูลในตาราง owners
-- ========================================
SELECT 
  'ข้อมูลในตาราง owners' as table_info,
  COUNT(*) as total_owners,
  COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as owners_with_names
FROM owners;

-- ดูข้อมูล owners
SELECT 
  id,
  unit_id,
  name,
  is_primary,
  email,
  phone
FROM owners
ORDER BY unit_id;

-- ========================================
-- ขั้นตอนที่ 4: ตรวจสอบข้อมูลในตาราง tenants
-- ========================================
SELECT 
  'ข้อมูลในตาราง tenants' as table_info,
  COUNT(*) as total_tenants,
  COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as tenants_with_names
FROM tenants;

-- ดูข้อมูล tenants
SELECT 
  id,
  unit_id,
  name,
  status,
  email,
  phone
FROM tenants
ORDER BY unit_id;

-- ========================================
-- ขั้นตอนที่ 5: ตรวจสอบความสัมพันธ์ระหว่างตาราง
-- ========================================
-- ดูข้อมูล units พร้อม owners และ tenants
SELECT 
  u.unit_number,
  u.username,
  u.password,
  u.owner_name,
  u.resident_name,
  o.name as owner_name_from_table,
  o.is_primary,
  t.name as tenant_name_from_table,
  t.status as tenant_status
FROM units u
LEFT JOIN owners o ON u.id = o.unit_id
LEFT JOIN tenants t ON u.id = t.unit_id
WHERE u.username IS NOT NULL
ORDER BY u.unit_number;

-- ========================================
-- ขั้นตอนที่ 6: ทดสอบการเข้าสู่ระบบ
-- ========================================
-- ทดสอบหา unit ด้วย username
SELECT 
  'ทดสอบการหา unit ด้วย username' as test_info,
  unit_number,
  username,
  password,
  owner_name,
  resident_name
FROM units 
WHERE username = 'ADD' OR unit_number = 'ADD';

-- ========================================
-- ขั้นตอนที่ 7: แก้ไขปัญหา (ถ้าจำเป็น)
-- ========================================
-- ถ้าไม่มีข้อมูลในตาราง owners หรือ tenants ให้สร้างข้อมูลตัวอย่าง
-- INSERT INTO owners (unit_id, name, is_primary, email, phone)
-- SELECT 
--   u.id,
--   u.owner_name,
--   true,
--   u.owner_email,
--   u.owner_phone
-- FROM units u
-- WHERE u.username IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM owners o WHERE o.unit_id = u.id);

-- ========================================
-- ขั้นตอนที่ 8: สรุปผลการตรวจสอบ
-- ========================================
SELECT 
  'สรุปผลการตรวจสอบ' as summary,
  (SELECT COUNT(*) FROM units WHERE username IS NOT NULL) as units_with_username,
  (SELECT COUNT(*) FROM owners) as total_owners,
  (SELECT COUNT(*) FROM tenants) as total_tenants,
  (SELECT COUNT(*) FROM units WHERE username IS NOT NULL AND password IS NOT NULL) as units_ready_for_login;
