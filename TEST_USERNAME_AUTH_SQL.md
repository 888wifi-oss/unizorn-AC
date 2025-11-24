-- 🔧 SQL Script สำหรับทดสอบ Username Authentication System
-- ใช้สำหรับตรวจสอบและแก้ไขปัญหา Login ไม่สำเร็จ

-- ========================================
-- 1. ตรวจสอบ username_mapping table
-- ========================================
SELECT 
  um.id,
  um.username,
  um.auth_user_id,
  um.unit_id,
  um.created_at,
  u.unit_number,
  u.owner_name,
  u.owner_email
FROM username_mapping um
LEFT JOIN units u ON um.unit_id = u.id
ORDER BY um.created_at DESC;

-- ========================================
-- 2. ตรวจสอบ auth.users สำหรับ username ที่มีปัญหา
-- ========================================
-- แทนที่ 't001' ด้วย username ที่มีปัญหา
SELECT 
  au.id,
  au.email,
  au.user_metadata,
  au.created_at
FROM auth.users au
WHERE au.user_metadata->>'username' = 't001'
   OR au.email LIKE '%t001%';

-- ========================================
-- 3. ตรวจสอบ units ที่เกี่ยวข้อง
-- ========================================
SELECT 
  u.id,
  u.unit_number,
  u.owner_name,
  u.owner_email,
  u.user_id,
  um.username
FROM units u
LEFT JOIN username_mapping um ON u.id = um.unit_id
WHERE u.unit_number LIKE '%t001%'
   OR u.owner_name LIKE '%t001%'
   OR um.username = 't001';

-- ========================================
-- 4. สร้าง username mapping สำหรับบัญชีเก่า (ถ้าจำเป็น)
-- ========================================
-- ใช้เฉพาะเมื่อพบว่ามี auth user แต่ไม่มี mapping

-- ขั้นตอน:
-- 1. หา auth_user_id จาก auth.users
-- 2. หา unit_id จาก units
-- 3. สร้าง mapping

-- ตัวอย่าง:
-- INSERT INTO username_mapping (username, auth_user_id, unit_id)
-- VALUES ('t001', 'auth-user-id-here', 'unit-id-here');

-- ========================================
-- 5. ตรวจสอบ invitations สำหรับ username ที่มีปัญหา
-- ========================================
SELECT 
  i.id,
  i.code,
  i.email,
  i.status,
  i.expires_at,
  i.used_at,
  u.unit_number,
  u.owner_name
FROM invitations i
LEFT JOIN units u ON i.unit_id = u.id
WHERE i.email LIKE '%t001%'
   OR u.unit_number LIKE '%t001%'
ORDER BY i.created_at DESC;

-- ========================================
-- 6. ลบ mapping ที่ซ้ำ (ถ้าจำเป็น)
-- ========================================
-- ใช้เฉพาะเมื่อมี mapping ซ้ำ
-- DELETE FROM username_mapping WHERE username = 't001' AND id != 'keep-this-id';

-- ========================================
-- 7. ตรวจสอบ RLS Policies
-- ========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'username_mapping';

-- ========================================
-- 8. ทดสอบการสร้าง mapping ใหม่
-- ========================================
-- ใช้สำหรับทดสอบการสร้าง mapping
-- INSERT INTO username_mapping (username, auth_user_id, unit_id)
-- VALUES ('test001', 'test-auth-user-id', 'test-unit-id');

-- ========================================
-- 9. ตรวจสอบข้อมูลทั้งหมดสำหรับ username ที่มีปัญหา
-- ========================================
-- แทนที่ 't001' ด้วย username ที่มีปัญหา
WITH user_data AS (
  SELECT 
    um.username,
    um.auth_user_id,
    um.unit_id,
    u.unit_number,
    u.owner_name,
    u.owner_email,
    u.user_id as unit_user_id
  FROM username_mapping um
  LEFT JOIN units u ON um.unit_id = u.id
  WHERE um.username = 't001'
)
SELECT 
  ud.*,
  CASE 
    WHEN ud.auth_user_id = ud.unit_user_id THEN '✅ Linked Correctly'
    ELSE '❌ Not Linked'
  END as link_status
FROM user_data ud;

-- ========================================
-- 10. แก้ไข mapping ที่ไม่ถูกต้อง (ถ้าจำเป็น)
-- ========================================
-- ใช้เฉพาะเมื่อพบว่า mapping ไม่ถูกต้อง
-- UPDATE username_mapping 
-- SET auth_user_id = 'correct-auth-user-id'
-- WHERE username = 't001';

-- ========================================
-- สรุปการใช้งาน:
-- 1. รัน query 1-3 เพื่อตรวจสอบข้อมูล
-- 2. ถ้าไม่พบ mapping ให้ใช้ query 4 สร้างใหม่
-- 3. ถ้ามี mapping ซ้ำ ให้ใช้ query 6 ลบ
-- 4. ทดสอบด้วย query 8
-- 5. ตรวจสอบผลลัพธ์ด้วย query 9
-- ========================================
