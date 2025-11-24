-- scripts/013_multi_tenancy_permissions.sql
-- Multi-tenancy Permission System
-- Company → Projects → Units → Users

-- ===========================
-- 1. COMPANIES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  tax_id VARCHAR(50),
  subscription_plan VARCHAR(50) DEFAULT 'basic',
  subscription_status VARCHAR(20) DEFAULT 'active',
  subscription_expires_at TIMESTAMPTZ,
  max_projects INTEGER DEFAULT 1,
  max_units INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 2. PROJECTS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  code VARCHAR(50),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  manager_name VARCHAR(255),
  manager_phone VARCHAR(20),
  manager_email VARCHAR(255),
  total_units INTEGER DEFAULT 0,
  total_floors INTEGER DEFAULT 0,
  project_type VARCHAR(50) DEFAULT 'condo',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, slug)
);

-- ===========================
-- 3. ROLES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  level INTEGER NOT NULL, -- 0=SuperAdmin, 1=CompanyAdmin, 2=ProjectAdmin, 3=Staff, 4=Resident
  is_system BOOLEAN DEFAULT false, -- System roles cannot be deleted
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 4. PERMISSIONS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  module VARCHAR(50) NOT NULL, -- billing, maintenance, parcels, etc.
  action VARCHAR(50) NOT NULL, -- view, create, update, delete, manage
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 5. ROLE_PERMISSIONS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, permission_id)
);

-- ===========================
-- 6. USERS TABLE (Enhanced)
-- ===========================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 7. USER_ROLES TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role_id, company_id, project_id)
);

-- ===========================
-- 8. AUDIT_LOGS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- INDEXES
-- ===========================
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_subscription_status ON public.companies(subscription_status);

CREATE INDEX IF NOT EXISTS idx_projects_company_id ON public.projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON public.projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON public.projects(is_active);

CREATE INDEX IF NOT EXISTS idx_roles_name ON public.roles(name);
CREATE INDEX IF NOT EXISTS idx_roles_level ON public.roles(level);

CREATE INDEX IF NOT EXISTS idx_permissions_module ON public.permissions(module);
CREATE INDEX IF NOT EXISTS idx_permissions_action ON public.permissions(action);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON public.user_roles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_project_id ON public.user_roles(project_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON public.user_roles(role_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_project_id ON public.audit_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ===========================
-- RLS POLICIES
-- ===========================
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated access to companies" ON public.companies;
DROP POLICY IF EXISTS "Allow authenticated access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow authenticated access to roles" ON public.roles;
DROP POLICY IF EXISTS "Allow authenticated access to permissions" ON public.permissions;
DROP POLICY IF EXISTS "Allow authenticated access to role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow authenticated access to users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated access to user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow authenticated access to audit_logs" ON public.audit_logs;

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - will be controlled by application logic)
CREATE POLICY "Allow authenticated access to companies" ON public.companies FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to projects" ON public.projects FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to roles" ON public.roles FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to permissions" ON public.permissions FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to role_permissions" ON public.role_permissions FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to user_roles" ON public.user_roles FOR ALL USING (true);
CREATE POLICY "Allow authenticated access to audit_logs" ON public.audit_logs FOR ALL USING (true);

-- ===========================
-- TRIGGERS
-- ===========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- INSERT DEFAULT ROLES
-- ===========================
INSERT INTO public.roles (name, display_name, description, level, is_system) VALUES
('super_admin', 'Super Admin', 'ผู้ดูแลระบบสูงสุด - เข้าถึงทุกอย่างในแพลตฟอร์ม', 0, true),
('company_admin', 'Company Admin', 'ผู้ดูแลบริษัท - จัดการโครงการและผู้ใช้ในบริษัท', 1, true),
('project_admin', 'Project Admin', 'ผู้จัดการโครงการ - จัดการนิติบุคคล/อาคาร', 2, true),
('staff', 'Staff', 'เจ้าหน้าที่ - บันทึกข้อมูลทั่วไป', 3, true),
('engineer', 'Engineer', 'ช่างซ่อม - รับมอบหมายงานและอัปเดตสถานะ', 3, true),
('resident', 'Resident', 'ลูกบ้าน - แจ้งซ่อม ตรวจสอบพัสดุ', 4, true)
ON CONFLICT (name) DO NOTHING;

-- ===========================
-- INSERT DEFAULT PERMISSIONS
-- ===========================
INSERT INTO public.permissions (name, display_name, description, module, action) VALUES
-- Company Management
('companies.view', 'ดูข้อมูลบริษัท', 'ดูข้อมูลบริษัททั้งหมด', 'companies', 'view'),
('companies.create', 'สร้างบริษัท', 'สร้างบริษัทใหม่', 'companies', 'create'),
('companies.update', 'แก้ไขบริษัท', 'แก้ไขข้อมูลบริษัท', 'companies', 'update'),
('companies.delete', 'ลบบริษัท', 'ลบบริษัท', 'companies', 'delete'),
('companies.manage', 'จัดการบริษัท', 'จัดการบริษัททั้งหมด', 'companies', 'manage'),

-- Project Management
('projects.view', 'ดูข้อมูลโครงการ', 'ดูข้อมูลโครงการ', 'projects', 'view'),
('projects.create', 'สร้างโครงการ', 'สร้างโครงการใหม่', 'projects', 'create'),
('projects.update', 'แก้ไขโครงการ', 'แก้ไขข้อมูลโครงการ', 'projects', 'update'),
('projects.delete', 'ลบโครงการ', 'ลบโครงการ', 'projects', 'delete'),
('projects.manage', 'จัดการโครงการ', 'จัดการโครงการทั้งหมด', 'projects', 'manage'),

-- User Management
('users.view', 'ดูข้อมูลผู้ใช้', 'ดูข้อมูลผู้ใช้', 'users', 'view'),
('users.create', 'สร้างผู้ใช้', 'สร้างผู้ใช้ใหม่', 'users', 'create'),
('users.update', 'แก้ไขผู้ใช้', 'แก้ไขข้อมูลผู้ใช้', 'users', 'update'),
('users.delete', 'ลบผู้ใช้', 'ลบผู้ใช้', 'users', 'delete'),
('users.manage', 'จัดการผู้ใช้', 'จัดการผู้ใช้ทั้งหมด', 'users', 'manage'),

-- Units Management
('units.view', 'ดูข้อมูลยูนิต', 'ดูข้อมูลยูนิต', 'units', 'view'),
('units.create', 'สร้างยูนิต', 'สร้างยูนิตใหม่', 'units', 'create'),
('units.update', 'แก้ไขยูนิต', 'แก้ไขข้อมูลยูนิต', 'units', 'update'),
('units.delete', 'ลบยูนิต', 'ลบยูนิต', 'units', 'delete'),

-- Billing Management
('billing.view', 'ดูข้อมูลบัญชี', 'ดูข้อมูลบิลและการชำระเงิน', 'billing', 'view'),
('billing.create', 'สร้างบิล', 'สร้างบิลใหม่', 'billing', 'create'),
('billing.update', 'แก้ไขบิล', 'แก้ไขข้อมูลบิล', 'billing', 'update'),
('billing.delete', 'ลบบิล', 'ลบบิล', 'billing', 'delete'),
('billing.manage', 'จัดการบัญชี', 'จัดการระบบบัญชีทั้งหมด', 'billing', 'manage'),

-- Maintenance Management
('maintenance.view', 'ดูงานแจ้งซ่อม', 'ดูรายการแจ้งซ่อม', 'maintenance', 'view'),
('maintenance.create', 'สร้างงานแจ้งซ่อม', 'สร้างรายการแจ้งซ่อมใหม่', 'maintenance', 'create'),
('maintenance.update', 'อัปเดตงานแจ้งซ่อม', 'อัปเดตสถานะและข้อมูลงานซ่อม', 'maintenance', 'update'),
('maintenance.delete', 'ลบงานแจ้งซ่อม', 'ลบรายการแจ้งซ่อม', 'maintenance', 'delete'),
('maintenance.assign', 'มอบหมายงานซ่อม', 'มอบหมายงานซ่อมให้ช่าง', 'maintenance', 'assign'),

-- Parcels Management
('parcels.view', 'ดูข้อมูลพัสดุ', 'ดูรายการพัสดุ', 'parcels', 'view'),
('parcels.create', 'ลงทะเบียนพัสดุ', 'ลงทะเบียนพัสดุใหม่', 'parcels', 'create'),
('parcels.update', 'อัปเดตพัสดุ', 'อัปเดตสถานะพัสดุ', 'parcels', 'update'),
('parcels.delete', 'ลบพัสดุ', 'ลบรายการพัสดุ', 'parcels', 'delete'),

-- Announcements
('announcements.view', 'ดูประกาศ', 'ดูประกาศทั้งหมด', 'announcements', 'view'),
('announcements.create', 'สร้างประกาศ', 'สร้างประกาศใหม่', 'announcements', 'create'),
('announcements.update', 'แก้ไขประกาศ', 'แก้ไขประกาศ', 'announcements', 'update'),
('announcements.delete', 'ลบประกาศ', 'ลบประกาศ', 'announcements', 'delete'),

-- Reports
('reports.view', 'ดูรายงาน', 'ดูรายงานทั้งหมด', 'reports', 'view'),
('reports.export', 'ส่งออกรายงาน', 'ส่งออกรายงานเป็นไฟล์', 'reports', 'export'),

-- Settings
('settings.view', 'ดูการตั้งค่า', 'ดูการตั้งค่าระบบ', 'settings', 'view'),
('settings.update', 'แก้ไขการตั้งค่า', 'แก้ไขการตั้งค่าระบบ', 'settings', 'update')
ON CONFLICT (name) DO NOTHING;

-- ===========================
-- ASSIGN PERMISSIONS TO ROLES
-- ===========================
DO $$
DECLARE
  super_admin_id UUID;
  company_admin_id UUID;
  project_admin_id UUID;
  staff_id UUID;
  engineer_id UUID;
  resident_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_id FROM public.roles WHERE name = 'super_admin';
  SELECT id INTO company_admin_id FROM public.roles WHERE name = 'company_admin';
  SELECT id INTO project_admin_id FROM public.roles WHERE name = 'project_admin';
  SELECT id INTO staff_id FROM public.roles WHERE name = 'staff';
  SELECT id INTO engineer_id FROM public.roles WHERE name = 'engineer';
  SELECT id INTO resident_id FROM public.roles WHERE name = 'resident';

  -- Super Admin: All permissions
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT super_admin_id, id FROM public.permissions
  ON CONFLICT DO NOTHING;

  -- Company Admin: Company and project management
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT company_admin_id, id FROM public.permissions 
  WHERE module IN ('companies', 'projects', 'users', 'reports', 'settings')
  ON CONFLICT DO NOTHING;

  -- Project Admin: Project operations
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT project_admin_id, id FROM public.permissions 
  WHERE module IN ('projects', 'users', 'units', 'billing', 'maintenance', 'parcels', 'announcements', 'reports')
    AND action != 'delete'
  ON CONFLICT DO NOTHING;

  -- Staff: Daily operations
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT staff_id, id FROM public.permissions 
  WHERE module IN ('units', 'billing', 'maintenance', 'parcels', 'announcements')
    AND action IN ('view', 'create', 'update')
  ON CONFLICT DO NOTHING;

  -- Engineer: Maintenance work
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT engineer_id, id FROM public.permissions 
  WHERE module = 'maintenance'
  ON CONFLICT DO NOTHING;

  -- Resident: View own data
  INSERT INTO public.role_permissions (role_id, permission_id)
  SELECT resident_id, id FROM public.permissions 
  WHERE action = 'view' OR (module = 'maintenance' AND action = 'create')
  ON CONFLICT DO NOTHING;
END $$;

-- ===========================
-- INSERT MOCK USERS FOR DEVELOPMENT
-- ===========================
DO $$
DECLARE
  super_admin_role_id UUID;
  company_admin_role_id UUID;
  project_admin_role_id UUID;
  staff_role_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_role_id FROM public.roles WHERE name = 'super_admin';
  SELECT id INTO company_admin_role_id FROM public.roles WHERE name = 'company_admin';
  SELECT id INTO project_admin_role_id FROM public.roles WHERE name = 'project_admin';
  SELECT id INTO staff_role_id FROM public.roles WHERE name = 'staff';

  -- Insert mock users
  INSERT INTO public.users (id, email, full_name, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', 'superadmin@unizorn.com', 'Super Admin', true),
  ('00000000-0000-0000-0000-000000000002', 'company@example.com', 'Company Admin', true),
  ('00000000-0000-0000-0000-000000000003', 'project@example.com', 'Project Admin', true),
  ('00000000-0000-0000-0000-000000000004', 'staff@example.com', 'Staff User', true)
  ON CONFLICT (id) DO NOTHING;

  -- Assign Super Admin role
  INSERT INTO public.user_roles (user_id, role_id, is_active) VALUES
  ('00000000-0000-0000-0000-000000000001', super_admin_role_id, true)
  ON CONFLICT DO NOTHING;

  -- Create demo company
  INSERT INTO public.companies (id, name, slug, subscription_plan, max_projects, max_units, is_active) VALUES
  ('00000000-0000-0000-0000-000000000010', 'Demo Company', 'demo-company', 'premium', 10, 1000, true)
  ON CONFLICT (slug) DO NOTHING;

  -- Assign Company Admin role to demo company
  INSERT INTO public.user_roles (user_id, role_id, company_id, is_active) VALUES
  ('00000000-0000-0000-0000-000000000002', company_admin_role_id, '00000000-0000-0000-0000-000000000010', true)
  ON CONFLICT DO NOTHING;

  -- Create demo project
  INSERT INTO public.projects (id, company_id, name, slug, total_units, total_floors, is_active) VALUES
  ('00000000-0000-0000-0000-000000000020', '00000000-0000-0000-0000-000000000010', 'Demo Project', 'demo-project', 100, 10, true)
  ON CONFLICT DO NOTHING;

  -- Assign Project Admin role to demo project
  INSERT INTO public.user_roles (user_id, role_id, company_id, project_id, is_active) VALUES
  ('00000000-0000-0000-0000-000000000003', project_admin_role_id, '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', true)
  ON CONFLICT DO NOTHING;

  -- Assign Staff role to demo project
  INSERT INTO public.user_roles (user_id, role_id, company_id, project_id, is_active) VALUES
  ('00000000-0000-0000-0000-000000000004', staff_role_id, '00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000020', true)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Mock users and demo data created';
END $$;

-- ===========================
-- COMPLETION MESSAGE
-- ===========================
DO $$
BEGIN
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Multi-tenancy Permission System installed successfully!';
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Roles created: Super Admin, Company Admin, Project Admin, Staff, Engineer, Resident';
  RAISE NOTICE 'Permissions assigned to roles';
  RAISE NOTICE 'Mock users created for development:';
  RAISE NOTICE '  - superadmin@unizorn.com (Super Admin)';
  RAISE NOTICE '  - company@example.com (Company Admin)';
  RAISE NOTICE '  - project@example.com (Project Admin)';
  RAISE NOTICE '  - staff@example.com (Staff)';
  RAISE NOTICE 'Demo Company and Project created';
END $$;
