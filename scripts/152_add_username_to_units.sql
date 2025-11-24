-- เพิ่ม username column ใน units table
-- สำหรับระบบ Username Authentication แบบง่าย

-- เพิ่ม column username
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- สร้าง index สำหรับ username
CREATE INDEX IF NOT EXISTS idx_units_username ON public.units(username);

-- อัปเดต RLS policy สำหรับ username
CREATE POLICY "Allow read access to units by username" ON public.units 
FOR SELECT USING (true);

CREATE POLICY "Allow update username for authenticated users" ON public.units 
FOR UPDATE USING (auth.uid() = user_id);

-- ตัวอย่างการใช้งาน:
-- UPDATE units SET username = 't001' WHERE unit_number = 'T001';
-- UPDATE units SET username = 'sm001' WHERE unit_number = 'SM001';
