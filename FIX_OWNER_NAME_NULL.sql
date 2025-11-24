-- 🔧 SQL Script สำหรับตรวจสอบและแก้ไขปัญหา owner_name เป็น null

-- ========================================
-- 1. ตรวจสอบข้อมูลปัจจุบัน
-- ========================================
SELECT 
  unit_number,
  username,
  owner_name,
  owner_email,
  password
FROM units 
WHERE username IN ('t001', 'AD222', 'sm001', 'abcd234')
ORDER BY unit_number;

-- ========================================
-- 2. ตรวจสอบ owner_name ที่เป็น null
-- ========================================
SELECT 
  unit_number,
  username,
  owner_name,
  CASE 
    WHEN owner_name IS NULL THEN '❌ ชื่อเป็น null'
    WHEN owner_name = '' THEN '❌ ชื่อเป็น empty string'
    ELSE '✅ มีชื่อ'
  END as name_status
FROM units 
WHERE username IS NOT NULL
ORDER BY unit_number;

-- ========================================
-- 3. แก้ไข owner_name ที่เป็น null
-- ========================================
-- สำหรับ t001 (ASD001)
UPDATE units 
SET owner_name = 'เจ้าของห้อง ASD001'
WHERE unit_number = 'ASD001' AND (owner_name IS NULL OR owner_name = '');

-- สำหรับ AD222
UPDATE units 
SET owner_name = 'เจ้าของห้อง AD222'
WHERE unit_number = 'AD222' AND (owner_name IS NULL OR owner_name = '');

-- สำหรับ SM001
UPDATE units 
SET owner_name = 'เจ้าของห้อง SM001'
WHERE unit_number = 'SM001' AND (owner_name IS NULL OR owner_name = '');

-- สำหรับ ABCD234
UPDATE units 
SET owner_name = 'เจ้าของห้อง ABCD234'
WHERE unit_number = 'ABCD234' AND (owner_name IS NULL OR owner_name = '');

-- ========================================
-- 4. ตั้งค่า owner_name สำหรับห้องชุดอื่นๆ
-- ========================================
-- แก้ไขตามความต้องการ
-- UPDATE units SET owner_name = 'ชื่อเจ้าของจริง' WHERE unit_number = 'ROOM001';
-- UPDATE units SET owner_name = 'ชื่อเจ้าของจริง' WHERE unit_number = 'ROOM002';

-- ========================================
-- 5. ตรวจสอบผลลัพธ์
-- ========================================
SELECT 
  unit_number,
  username,
  owner_name,
  owner_email,
  CASE 
    WHEN owner_name IS NULL THEN '❌ ชื่อเป็น null'
    WHEN owner_name = '' THEN '❌ ชื่อเป็น empty string'
    ELSE '✅ มีชื่อ'
  END as name_status
FROM units 
WHERE username IS NOT NULL
ORDER BY unit_number;

-- ========================================
-- 6. ตรวจสอบข้อมูลทั้งหมด
-- ========================================
SELECT 
  unit_number,
  username,
  owner_name,
  owner_email,
  CASE 
    WHEN password IS NOT NULL THEN '✅ มีรหัสผ่าน'
    ELSE '❌ ไม่มีรหัสผ่าน'
  END as password_status
FROM units 
ORDER BY unit_number;

















