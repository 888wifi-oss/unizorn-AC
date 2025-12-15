-- 🔧 อัปเดตชื่อจริงของลูกบ้าน
-- รัน script นี้ใน Supabase SQL Editor หลังจากรัน FIX_RESIDENT_NAME_DISPLAY.sql

-- ตัวอย่างการอัปเดตชื่อจริงของลูกบ้าน
-- กรุณาแก้ไขชื่อให้ตรงกับข้อมูลจริง

UPDATE units 
SET resident_name = CASE 
  WHEN unit_number = '1001' THEN 'สมชาย ใจดี'
  WHEN unit_number = '1002' THEN 'สมหญิง รักดี'
  WHEN unit_number = '1003' THEN 'สมศักดิ์ มั่นใจ'
  WHEN unit_number = '1004' THEN 'สมพร ดีใจ'
  WHEN unit_number = '1005' THEN 'สมบูรณ์ สุขใจ'
  WHEN unit_number = 'ASD001' THEN 'อานนท์ สมบูรณ์'
  WHEN unit_number = 'AD222' THEN 'อารีย์ ดีใจ'
  WHEN unit_number = 'SM001' THEN 'สมศักดิ์ มั่นใจ'
  WHEN unit_number = 'ABCD234' THEN 'อภิสิทธิ์ ชัยชนะ'
  WHEN unit_number = 'T001' THEN 'ธนาคาร เงินดี'
  ELSE resident_name -- ไม่เปลี่ยนถ้าไม่มีในรายการ
END
WHERE username IS NOT NULL;

-- ตรวจสอบผลลัพธ์
SELECT 
  unit_number,
  username,
  owner_name,
  resident_name,
  CASE 
    WHEN resident_name IS NULL OR resident_name = '' THEN '❌ ยังไม่มีชื่อ'
    WHEN resident_name LIKE 'ลูกบ้านห้อง%' THEN '⚠️ ใช้ชื่อ generic'
    ELSE '✅ มีชื่อจริง'
  END as status
FROM units 
WHERE username IS NOT NULL
ORDER BY unit_number;


















