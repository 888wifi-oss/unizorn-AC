-- scripts/151_create_username_mapping.sql
-- สร้างตาราง username_mapping สำหรับระบบ Username Authentication

-- สร้างตาราง username_mapping
CREATE TABLE IF NOT EXISTS username_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- สร้าง indexes สำหรับ performance
CREATE INDEX IF NOT EXISTS idx_username_mapping_username ON username_mapping(username);
CREATE INDEX IF NOT EXISTS idx_username_mapping_auth_user_id ON username_mapping(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_username_mapping_unit_id ON username_mapping(unit_id);

-- สร้าง RLS policies
ALTER TABLE username_mapping ENABLE ROW LEVEL SECURITY;

-- Policy สำหรับ SELECT - ให้ทุกคนอ่านได้
CREATE POLICY "Allow all operations on username_mapping" ON public.username_mapping 
FOR ALL USING (true) WITH CHECK (true);

-- สร้าง function สำหรับอัปเดต updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- สร้าง trigger สำหรับอัปเดต updated_at
CREATE TRIGGER update_username_mapping_updated_at 
    BEFORE UPDATE ON username_mapping 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- เพิ่ม comment
COMMENT ON TABLE username_mapping IS 'ตารางสำหรับ map username กับ Supabase Auth user';
COMMENT ON COLUMN username_mapping.username IS 'Username ที่ผู้ใช้ตั้งไว้';
COMMENT ON COLUMN username_mapping.auth_user_id IS 'ID ของ Supabase Auth user';
COMMENT ON COLUMN username_mapping.unit_id IS 'ID ของ unit ที่เกี่ยวข้อง';
