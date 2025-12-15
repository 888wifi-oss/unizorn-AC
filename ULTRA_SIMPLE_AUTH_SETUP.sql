-- 🔧 SQL Script สำหรับระบบ Ultra Simple Authentication
-- ไม่ต้องใช้ Supabase Auth เลย

-- ========================================
-- 1. เพิ่ม username column (ถ้ายังไม่มี)
-- ========================================
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- ========================================
-- 2. ตั้งค่า username และ password สำหรับห้องชุด
-- ========================================

-- สำหรับ t001 (ASD001)
UPDATE units 
SET username = 't001', password = '12345678'
WHERE unit_number = 'ASD001';

-- สำหรับ AD222
UPDATE units 
SET username = 'AD222', password = '12345678'
WHERE unit_number = 'AD222';

-- สำหรับห้องชุดอื่นๆ
UPDATE units 
SET username = 'sm001', password = '12345678'
WHERE unit_number = 'SM001';

UPDATE units 
SET username = 'abcd234', password = '12345678'
WHERE unit_number = 'ABCD234';

-- ========================================
-- 3. ตรวจสอบข้อมูล
-- ========================================
SELECT 
  unit_number,
  username,
  password,
  owner_name,
  owner_email
FROM units 
WHERE username IS NOT NULL
ORDER BY unit_number;

-- ========================================
-- 4. ตั้งค่า username สำหรับห้องชุดอื่นๆ (ถ้าต้องการ)
-- ========================================
-- แก้ไขตามความต้องการ
-- UPDATE units SET username = 'room001', password = '12345678' WHERE unit_number = 'ROOM001';
-- UPDATE units SET username = 'room002', password = '12345678' WHERE unit_number = 'ROOM002';

-- ========================================
-- 5. ลบ user_id (ถ้าต้องการลบ Supabase Auth)
-- ========================================
-- ถ้าต้องการลบ Supabase Auth ทั้งหมด
-- UPDATE units SET user_id = NULL WHERE user_id IS NOT NULL;

-- ========================================
-- 6. ตรวจสอบผลลัพธ์สุดท้าย
-- ========================================
SELECT 
  unit_number,
  username,
  CASE 
    WHEN password IS NOT NULL THEN '✅ มีรหัสผ่าน'
    ELSE '❌ ไม่มีรหัสผ่าน'
  END as password_status,
  CASE 
    WHEN user_id IS NOT NULL THEN '✅ มี Supabase Auth'
    ELSE '❌ ไม่มี Supabase Auth'
  END as auth_status
FROM units 
ORDER BY unit_number;

-- ========================================
-- ตัวอย่างการใช้งาน:
-- 1. รัน SQL script นี้
-- 2. ทดสอบ login ด้วย username: t001, password: 12345678
-- 3. ทดสอบ login ด้วย username: AD222, password: 12345678
-- ========================================



















