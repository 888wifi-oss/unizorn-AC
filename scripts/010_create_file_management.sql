-- scripts/010_create_file_management.sql

-- Create file_categories table
CREATE TABLE IF NOT EXISTS public.file_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create files table
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  file_extension VARCHAR(20),
  category_id UUID REFERENCES public.file_categories(id) ON DELETE SET NULL,
  uploaded_by VARCHAR(255) NOT NULL,
  unit_number VARCHAR(20) REFERENCES public.units(unit_number) ON DELETE CASCADE,
  description TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  parent_file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create file_permissions table
CREATE TABLE IF NOT EXISTS public.file_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  unit_number VARCHAR(20) REFERENCES public.units(unit_number) ON DELETE CASCADE,
  permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('read', 'write', 'admin')),
  granted_by VARCHAR(255) NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

-- Create file_downloads table for tracking
CREATE TABLE IF NOT EXISTS public.file_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  downloaded_by VARCHAR(255) NOT NULL,
  unit_number VARCHAR(20) REFERENCES public.units(unit_number) ON DELETE CASCADE,
  download_ip INET,
  user_agent TEXT,
  downloaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_files_category_id ON public.files(category_id);
CREATE INDEX IF NOT EXISTS idx_files_unit_number ON public.files(unit_number);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_mime_type ON public.files(mime_type);
CREATE INDEX IF NOT EXISTS idx_files_is_public ON public.files(is_public);
CREATE INDEX IF NOT EXISTS idx_files_is_active ON public.files(is_active);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at);
CREATE INDEX IF NOT EXISTS idx_files_tags ON public.files USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_file_permissions_file_id ON public.file_permissions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_permissions_unit_number ON public.file_permissions(unit_number);
CREATE INDEX IF NOT EXISTS idx_file_permissions_permission_type ON public.file_permissions(permission_type);

CREATE INDEX IF NOT EXISTS idx_file_downloads_file_id ON public.file_downloads(file_id);
CREATE INDEX IF NOT EXISTS idx_file_downloads_downloaded_by ON public.file_downloads(downloaded_by);
CREATE INDEX IF NOT EXISTS idx_file_downloads_downloaded_at ON public.file_downloads(downloaded_at);

-- Enable RLS
ALTER TABLE public.file_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_downloads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on file_categories" ON public.file_categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on files" ON public.files FOR ALL USING (true);
CREATE POLICY "Allow all operations on file_permissions" ON public.file_permissions FOR ALL USING (true);
CREATE POLICY "Allow all operations on file_downloads" ON public.file_downloads FOR ALL USING (true);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_files_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_file_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers
CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW
    EXECUTE FUNCTION update_files_updated_at();

CREATE TRIGGER update_file_categories_updated_at
    BEFORE UPDATE ON public.file_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_file_categories_updated_at();

-- Insert default file categories
INSERT INTO public.file_categories (name, description, icon, color) VALUES
('เอกสารทั่วไป', 'เอกสารทั่วไปของคอนโด', 'FileText', 'blue'),
('สัญญา', 'สัญญาและเอกสารทางกฎหมาย', 'FileCheck', 'green'),
('บิลและใบเสร็จ', 'บิลค่าใช้จ่ายและใบเสร็จ', 'Receipt', 'orange'),
('รายงาน', 'รายงานการประชุมและรายงานประจำเดือน', 'BarChart3', 'purple'),
('ภาพถ่าย', 'ภาพถ่ายกิจกรรมและสถานที่', 'Camera', 'pink'),
('วิดีโอ', 'วิดีโอกิจกรรมและประชุม', 'Video', 'red'),
('เอกสารการซ่อมบำรุง', 'เอกสารการซ่อมบำรุงและบำรุงรักษา', 'Wrench', 'yellow'),
('เอกสารพัสดุ', 'เอกสารที่เกี่ยวข้องกับพัสดุ', 'Package', 'indigo'),
('เอกสารการเงิน', 'เอกสารการเงินและบัญชี', 'DollarSign', 'emerald'),
('เอกสารอื่นๆ', 'เอกสารอื่นๆ ที่ไม่จัดอยู่ในหมวดหมู่ข้างต้น', 'File', 'gray')
ON CONFLICT (name) DO NOTHING;
