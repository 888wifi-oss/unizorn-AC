-- scripts/155_step2_update_resident_names.sql
-- ขั้นตอนที่ 2: อัปเดตชื่อจริงของผู้อาศัยตาม username

-- ตรวจสอบข้อมูลปัจจุบัน
SELECT 
  id,
  unit_number,
  username,
  owner_name,
  resident_name,
  CASE 
    WHEN username IS NULL THEN '❌ ไม่มี username'
    WHEN resident_name IS NULL THEN '⚠️ ยังไม่มีชื่อจริง'
    ELSE '✅ มีชื่อจริง'
  END as status
FROM units 
WHERE username IS NOT NULL
ORDER BY unit_number;

-- อัปเดตชื่อจริงของผู้อาศัยแต่ละคน
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

-- ตรวจสอบผลลัพธ์
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
