-- 🔧 SQL Script สำหรับแก้ไขปัญหา Login

-- ========================================
-- 1. ตรวจสอบข้อมูลปัจจุบัน
-- ========================================
SELECT 
  unit_number,
  username,
  user_id,
  owner_email,
  password
FROM units 
WHERE unit_number IN ('ASD001', 'AD222', 'T001')
ORDER BY unit_number;

-- ========================================
-- 2. ตั้งค่า username สำหรับห้องชุด
-- ========================================
-- สำหรับ t001 (ASD001)
UPDATE units 
SET username = 't001' 
WHERE unit_number = 'ASD001';

-- สำหรับ AD222
UPDATE units 
SET username = 'AD222' 
WHERE unit_number = 'AD222';

-- ========================================
-- 3. ตรวจสอบ auth.users สำหรับ t001
-- ========================================
SELECT 
  id,
  email,
  user_metadata,
  created_at
FROM auth.users 
WHERE user_metadata->>'username' = 't001'
   OR email LIKE '%t001%'
   OR id = '03071284-7931-4c99-ba96-76c576f01e26';

-- ========================================
-- 4. รีเซ็ตรหัสผ่านสำหรับ t001 (ถ้าจำเป็น)
-- ========================================
-- ใช้ Supabase Dashboard > Authentication > Users
-- หรือใช้ Admin API

-- ========================================
-- 5. ตรวจสอบผลลัพธ์
-- ========================================
SELECT 
  unit_number,
  username,
  user_id,
  owner_email,
  CASE 
    WHEN user_id IS NOT NULL THEN '✅ มี Supabase Auth'
    ELSE '❌ ไม่มี Supabase Auth'
  END as auth_status
FROM units 
WHERE username IN ('t001', 'AD222')
ORDER BY unit_number;

-- ========================================
-- 6. สร้าง username สำหรับห้องชุดอื่นๆ
-- ========================================
-- ตัวอย่างการตั้งค่า username
UPDATE units SET username = 'sm001' WHERE unit_number = 'SM001';
UPDATE units SET username = 'abcd234' WHERE unit_number = 'ABCD234';

-- ========================================
-- 7. ตรวจสอบ username ทั้งหมด
-- ========================================
SELECT 
  unit_number,
  username,
  CASE 
    WHEN username IS NULL THEN '❌ ยังไม่ได้ตั้งค่า'
    ELSE '✅ ตั้งค่าแล้ว'
  END as username_status
FROM units 
ORDER BY unit_number;



















