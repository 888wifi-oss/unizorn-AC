-- scripts/158_complete_resident_name_fix.sql
-- แก้ไขปัญหาการแสดงชื่อลูกบ้าน - ไฟล์เดียวครบทุกขั้นตอน

-- ========================================
-- ขั้นตอนที่ 1: เพิ่มคอลัมน์ resident_name
-- ========================================
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS resident_name TEXT;

-- ตรวจสอบว่าคอลัมน์ถูกเพิ่มแล้ว
SELECT '✅ คอลัมน์ resident_name ถูกเพิ่มแล้ว' as status;

-- ========================================
-- ขั้นตอนที่ 2: ตรวจสอบข้อมูลปัจจุบัน
-- ========================================
SELECT 
  id,
  unit_number,
  username,
  owner_name,
  owner_email,
  resident_name,
  CASE 
    WHEN username IS NULL THEN '❌ ไม่มี username'
    WHEN resident_name IS NULL THEN '⚠️ ยังไม่มีชื่อจริง'
    ELSE '✅ มีชื่อจริง'
  END as status
FROM units 
WHERE username IS NOT NULL
ORDER BY unit_number;

-- ========================================
-- ขั้นตอนที่ 3: อัปเดตชื่อจริงของผู้อาศัยแต่ละคน
-- ========================================
-- กรุณาแก้ไขชื่อให้ตรงกับข้อมูลจริงของผู้อาศัยที่ลงทะเบียนด้วย username นั้น
UPDATE units 
SET resident_name = CASE 
  -- ตัวอย่างการตั้งชื่อจริงตาม username
  WHEN username = 'ADD' THEN 'อานนท์ ดีใจ'
  WHEN username = 'SM001' THEN 'สมศักดิ์ มั่นใจ'
  WHEN username = 'T001' THEN 'ธนาคาร เงินดี'
  WHEN username = 'ABCD234' THEN 'อภิสิทธิ์ ชัยชนะ'
  WHEN username = 'AD222' THEN 'อารีย์ ดีใจ'
  WHEN username = 'ASD001' THEN 'อานนท์ สมบูรณ์'
  -- เพิ่มรายการตาม username ที่มีจริง
  ELSE NULL -- ไม่ตั้งชื่อถ้าไม่รู้จัก username
END
WHERE username IS NOT NULL;

-- อัปเดตชื่อจาก email (ถ้าไม่มีชื่อจริง)
UPDATE units 
SET resident_name = CASE 
  WHEN resident_name IS NULL OR resident_name = '' THEN 
    CASE 
      WHEN owner_email IS NOT NULL AND owner_email != '' THEN 
        SPLIT_PART(owner_email, '@', 1)
      ELSE NULL
    END
  ELSE resident_name
END
WHERE username IS NOT NULL;

-- ========================================
-- ขั้นตอนที่ 4: ตรวจสอบผลลัพธ์
-- ========================================
SELECT 
  unit_number,
  username,
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
  id,
  unit_number,
  username,
  COALESCE(resident_name, owner_name, CONCAT('ผู้อาศัยห้อง ', unit_number)) as display_name,
  owner_email,
  password,
  created_at,
  updated_at
FROM units
WHERE username IS NOT NULL;

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
SELECT 
  unit_number as "หมายเลขห้อง",
  username as "ชื่อผู้ใช้",
  display_name as "ชื่อจริง",
  owner_email as "อีเมล"
FROM resident_info
ORDER BY unit_number;
