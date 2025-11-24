-- scripts/154_step1_add_resident_name_column.sql
-- ขั้นตอนที่ 1: เพิ่มคอลัมน์ resident_name

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS resident_name TEXT;

-- ตรวจสอบว่าคอลัมน์ถูกเพิ่มแล้ว
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'units' AND column_name = 'resident_name';
