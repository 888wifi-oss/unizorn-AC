-- scripts/161_fix_registered_resident_name.sql
-- แก้ไขปัญหาการแสดงชื่อผู้ลงทะเบียนจริง

-- ========================================
-- ขั้นตอนที่ 1: เพิ่มฟิลด์ registered_by ในตาราง units
-- ========================================
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS registered_by VARCHAR(50);

-- ========================================
-- ขั้นตอนที่ 2: ตรวจสอบข้อมูลปัจจุบัน
-- ========================================
SELECT 
  unit_number,
  username,
  owner_name,
  resident_name,
  registered_by,
  CASE 
    WHEN registered_by IS NULL THEN '❌ ไม่ระบุผู้ลงทะเบียน'
    ELSE '✅ มีผู้ลงทะเบียน'
  END as status
FROM units 
WHERE username IS NOT NULL
ORDER BY unit_number;

-- ========================================
-- ขั้นตอนที่ 3: อัปเดต registered_by ด้วย username
-- ========================================
-- ตั้งค่า registered_by = username เพื่อระบุว่าใครเป็นคนลงทะเบียน
UPDATE units 
SET registered_by = username
WHERE username IS NOT NULL;

-- ========================================
-- ขั้นตอนที่ 4: ตรวจสอบผลลัพธ์
-- ========================================
SELECT 
  unit_number,
  username,
  registered_by,
  owner_name,
  resident_name
FROM units 
WHERE username IS NOT NULL
ORDER BY unit_number;

-- ========================================
-- ขั้นตอนที่ 5: สร้าง View สำหรับแสดงข้อมูลผู้ลงทะเบียนจริง
-- ========================================
CREATE OR REPLACE VIEW registered_resident_info AS
SELECT 
  u.id,
  u.unit_number,
  u.username,
  u.registered_by,
  -- หาชื่อผู้ลงทะเบียนจริงจาก owners หรือ tenants
  COALESCE(
    -- หาจาก owners ที่มี username ตรงกับ registered_by
    (SELECT o.name FROM owners o 
     WHERE o.unit_id = u.id 
     AND (o.email = u.registered_by OR o.phone = u.registered_by OR o.name = u.registered_by)
     LIMIT 1),
    -- หาจาก tenants ที่มี username ตรงกับ registered_by
    (SELECT t.name FROM tenants t 
     WHERE t.unit_id = u.id 
     AND (t.email = u.registered_by OR t.phone = u.registered_by OR t.name = u.registered_by)
     LIMIT 1),
    -- ถ้าไม่เจอ ให้ใช้ชื่อจาก owners (เจ้าของหลัก)
    (SELECT o.name FROM owners o WHERE o.unit_id = u.id AND o.is_primary = true LIMIT 1),
    -- ถ้าไม่เจอ ให้ใช้ชื่อจาก tenants (ผู้เช่าที่ active)
    (SELECT t.name FROM tenants t WHERE t.unit_id = u.id AND t.status = 'active' LIMIT 1),
    -- ถ้าไม่เจอ ให้ใช้ชื่อจาก units
    u.owner_name,
    -- สุดท้าย ให้ใช้ชื่อ generic
    CONCAT('ผู้อาศัยห้อง ', u.unit_number)
  ) as display_name,
  u.owner_email,
  u.password,
  u.created_at,
  u.updated_at
FROM units u
WHERE u.username IS NOT NULL;

-- ========================================
-- ขั้นตอนที่ 6: ทดสอบ View
-- ========================================
SELECT * FROM registered_resident_info ORDER BY unit_number;

-- ========================================
-- ขั้นตอนที่ 7: ตัวอย่างการใช้งาน
-- ========================================
-- ดูข้อมูลผู้ลงทะเบียนจริง
SELECT 
  unit_number as "หมายเลขห้อง",
  username as "ชื่อผู้ใช้",
  registered_by as "ผู้ลงทะเบียน",
  display_name as "ชื่อจริง",
  owner_email as "อีเมล"
FROM registered_resident_info
ORDER BY unit_number;

-- ========================================
-- ขั้นตอนที่ 8: อัปเดตข้อมูลตัวอย่าง (ถ้าต้องการ)
-- ========================================
-- อัปเดต registered_by ให้ตรงกับชื่อจริงในตาราง owners หรือ tenants
-- ตัวอย่าง: ถ้า username = 'ADD' และมี owner ชื่อ 'อานนท์ ดีใจ' ในตาราง owners
-- UPDATE units 
-- SET registered_by = 'อานนท์ ดีใจ'
-- WHERE username = 'ADD';

-- ========================================
-- ขั้นตอนที่ 9: สรุปผลการแก้ไข
-- ========================================
SELECT 
  'สรุปผลการแก้ไข' as summary,
  COUNT(*) as total_residents,
  COUNT(CASE WHEN registered_by IS NOT NULL THEN 1 END) as residents_with_registered_by,
  COUNT(CASE WHEN registered_by IS NULL THEN 1 END) as residents_without_registered_by
FROM units 
WHERE username IS NOT NULL;
