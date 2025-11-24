-- 🔧 แก้ไขปัญหา owner_name เป็น null
-- รัน script นี้ใน Supabase SQL Editor

-- 1. ตรวจสอบข้อมูลปัจจุบัน
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

-- 2. แก้ไข owner_name ที่เป็น null หรือ empty
UPDATE units 
SET owner_name = CASE 
  WHEN unit_number = 'ASD001' THEN 'เจ้าของห้อง ASD001'
  WHEN unit_number = 'AD222' THEN 'เจ้าของห้อง AD222'
  WHEN unit_number = 'SM001' THEN 'เจ้าของห้อง SM001'
  WHEN unit_number = 'ABCD234' THEN 'เจ้าของห้อง ABCD234'
  WHEN unit_number = 'T001' THEN 'เจ้าของห้อง T001'
  WHEN unit_number = '1001' THEN 'เจ้าของห้อง 1001'
  WHEN unit_number = '1002' THEN 'เจ้าของห้อง 1002'
  ELSE CONCAT('เจ้าของห้อง ', unit_number)
END
WHERE (owner_name IS NULL OR owner_name = '') 
  AND username IS NOT NULL;

-- 3. ตรวจสอบผลลัพธ์
SELECT 
  unit_number,
  username,
  owner_name,
  '✅ แก้ไขแล้ว' as status
FROM units 
WHERE username IS NOT NULL
ORDER BY unit_number;
