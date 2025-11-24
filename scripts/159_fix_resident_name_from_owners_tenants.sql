-- scripts/159_fix_resident_name_from_owners_tenants.sql
-- แก้ไขปัญหาการแสดงชื่อลูกบ้าน - ดึงชื่อจากตาราง owners และ tenants

-- ========================================
-- ขั้นตอนที่ 1: ตรวจสอบข้อมูลปัจจุบัน
-- ========================================
-- ตรวจสอบข้อมูลในตาราง owners
SELECT 
  'ข้อมูลในตาราง owners' as table_info,
  COUNT(*) as total_owners,
  COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as owners_with_names
FROM owners;

-- ตรวจสอบข้อมูลในตาราง tenants
SELECT 
  'ข้อมูลในตาราง tenants' as table_info,
  COUNT(*) as total_tenants,
  COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as tenants_with_names
FROM tenants;

-- ตรวจสอบข้อมูลในตาราง units
SELECT 
  'ข้อมูลในตาราง units' as table_info,
  COUNT(*) as total_units,
  COUNT(CASE WHEN username IS NOT NULL THEN 1 END) as units_with_username
FROM units;

-- ========================================
-- ขั้นตอนที่ 2: ตรวจสอบความสัมพันธ์ระหว่างตาราง
-- ========================================
-- ดูข้อมูล units พร้อม owners และ tenants
SELECT 
  u.unit_number,
  u.username,
  o.name as owner_name,
  t.name as tenant_name,
  CASE 
    WHEN o.name IS NOT NULL THEN o.name
    WHEN t.name IS NOT NULL THEN t.name
    ELSE u.owner_name
  END as display_name
FROM units u
LEFT JOIN owners o ON u.id = o.unit_id AND o.is_primary = true
LEFT JOIN tenants t ON u.id = t.unit_id AND t.status = 'active'
WHERE u.username IS NOT NULL
ORDER BY u.unit_number;

-- ========================================
-- ขั้นตอนที่ 3: อัปเดต resident_name จากตาราง owners และ tenants
-- ========================================
-- อัปเดต resident_name จากตาราง owners (เจ้าของ)
UPDATE units 
SET resident_name = o.name
FROM owners o
WHERE units.id = o.unit_id 
  AND o.is_primary = true
  AND o.name IS NOT NULL 
  AND o.name != ''
  AND units.username IS NOT NULL;

-- อัปเดต resident_name จากตาราง tenants (ผู้เช่า) สำหรับหน่วยที่ไม่มี owner
UPDATE units 
SET resident_name = t.name
FROM tenants t
WHERE units.id = t.unit_id 
  AND t.status = 'active'
  AND t.name IS NOT NULL 
  AND t.name != ''
  AND units.username IS NOT NULL
  AND units.resident_name IS NULL;

-- ========================================
-- ขั้นตอนที่ 4: ตรวจสอบผลลัพธ์
-- ========================================
SELECT 
  unit_number,
  username,
  owner_name,
  resident_name,
  CASE 
    WHEN resident_name IS NULL OR resident_name = '' THEN '❌ ยังไม่มีชื่อ'
    ELSE '✅ มีชื่อจริง'
  END as final_status
FROM units 
WHERE username IS NOT NULL
ORDER BY unit_number;

-- ========================================
-- ขั้นตอนที่ 5: สร้าง View สำหรับแสดงข้อมูลผู้อาศัยที่สมบูรณ์
-- ========================================
CREATE OR REPLACE VIEW resident_info AS
SELECT 
  u.id,
  u.unit_number,
  u.username,
  COALESCE(
    u.resident_name,
    o.name,
    t.name,
    u.owner_name,
    CONCAT('ผู้อาศัยห้อง ', u.unit_number)
  ) as display_name,
  u.owner_email,
  u.password,
  u.created_at,
  u.updated_at
FROM units u
LEFT JOIN owners o ON u.id = o.unit_id AND o.is_primary = true
LEFT JOIN tenants t ON u.id = t.unit_id AND t.status = 'active'
WHERE u.username IS NOT NULL;

-- ========================================
-- ขั้นตอนที่ 6: ทดสอบ View
-- ========================================
SELECT * FROM resident_info ORDER BY unit_number;

-- ========================================
-- ขั้นตอนที่ 7: ตรวจสอบข้อมูลสุดท้าย
-- ========================================
SELECT 
  'สรุปผลการแก้ไข' as summary,
  COUNT(*) as total_residents,
  COUNT(CASE WHEN resident_name IS NOT NULL AND resident_name != '' THEN 1 END) as residents_with_names,
  COUNT(CASE WHEN resident_name IS NULL OR resident_name = '' THEN 1 END) as residents_without_names
FROM units 
WHERE username IS NOT NULL;

-- ========================================
-- ขั้นตอนที่ 8: ตัวอย่างการใช้งาน
-- ========================================
-- ดูข้อมูลผู้อาศัยทั้งหมดพร้อมชื่อจริง
SELECT 
  unit_number as "หมายเลขห้อง",
  username as "ชื่อผู้ใช้",
  display_name as "ชื่อจริง",
  owner_email as "อีเมล"
FROM resident_info
ORDER BY unit_number;
