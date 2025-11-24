-- scripts/156_step3_create_resident_view.sql
-- ขั้นตอนที่ 3: สร้าง View และทดสอบ

-- สร้าง View สำหรับแสดงข้อมูลผู้อาศัยที่สมบูรณ์
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

-- ทดสอบ View
SELECT * FROM resident_info ORDER BY unit_number;

-- ตรวจสอบข้อมูลสุดท้าย
SELECT 
  'สรุปผลการแก้ไข' as summary,
  COUNT(*) as total_residents,
  COUNT(CASE WHEN resident_name IS NOT NULL AND resident_name != '' THEN 1 END) as residents_with_names,
  COUNT(CASE WHEN resident_name IS NULL OR resident_name = '' THEN 1 END) as residents_without_names
FROM units 
WHERE username IS NOT NULL;

-- ตัวอย่างการใช้งาน
SELECT 
  unit_number as "หมายเลขห้อง",
  username as "ชื่อผู้ใช้",
  display_name as "ชื่อจริง",
  owner_email as "อีเมล"
FROM resident_info
ORDER BY unit_number;
