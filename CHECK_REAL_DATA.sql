-- 🔍 ตรวจสอบข้อมูลห้องชุดที่มีอยู่
-- เพื่อดูว่ามีชื่อจริงหรือไม่

-- 1. ตรวจสอบข้อมูลทั้งหมดใน units table
SELECT 
  id,
  unit_number,
  owner_name,
  owner_email,
  username,
  password,
  user_id,
  created_at,
  updated_at
FROM units 
ORDER BY unit_number;

-- 2. ตรวจสอบเฉพาะห้องชุดที่มี username
SELECT 
  unit_number,
  username,
  owner_name,
  owner_email,
  CASE 
    WHEN owner_name IS NULL THEN '❌ ไม่มีชื่อ'
    WHEN owner_name = '' THEN '❌ ชื่อว่าง'
    WHEN owner_name LIKE '%เจ้าของห้อง%' THEN '❌ ชื่อจำลอง'
    ELSE '✅ ชื่อจริง'
  END as name_type
FROM units 
WHERE username IS NOT NULL
ORDER BY unit_number;

-- 3. ตรวจสอบข้อมูลใน owners table (ถ้ามี)
SELECT 
  o.id,
  o.name as owner_name,
  o.email as owner_email,
  o.phone,
  o.national_id,
  u.unit_number,
  u.username
FROM owners o
LEFT JOIN units u ON o.unit_id = u.id
WHERE u.username IS NOT NULL
ORDER BY u.unit_number;

-- 4. ตรวจสอบข้อมูลใน tenants table (ถ้ามี)
SELECT 
  t.id,
  t.name as tenant_name,
  t.email as tenant_email,
  t.phone,
  u.unit_number,
  u.username
FROM tenants t
LEFT JOIN units u ON t.unit_id = u.id
WHERE u.username IS NOT NULL
ORDER BY u.unit_number;

















