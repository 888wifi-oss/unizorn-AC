-- scripts/014_user_groups.sql
-- User Groups for fine-grained permission management

-- ===========================
-- 1. USER GROUPS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS public.user_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, company_id, project_id)
);

-- ===========================
-- 2. USER_GROUP_MEMBERS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS public.user_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_group_id, user_id)
);

-- ===========================
-- 3. USER_GROUP_PERMISSIONS TABLE
-- ===========================
CREATE TABLE IF NOT EXISTS public.user_group_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_group_id UUID NOT NULL REFERENCES public.user_groups(id) ON DELETE CASCADE,
  module VARCHAR(100) NOT NULL,
  can_access BOOLEAN DEFAULT false,
  can_view BOOLEAN DEFAULT false,
  can_add BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_print BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  can_approve BOOLEAN DEFAULT false,
  can_assign BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_group_id, module)
);

-- ===========================
-- INDEXES
-- ===========================
CREATE INDEX IF NOT EXISTS idx_user_groups_company_id ON public.user_groups(company_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_project_id ON public.user_groups(project_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_role_id ON public.user_groups(role_id);
CREATE INDEX IF NOT EXISTS idx_user_groups_is_active ON public.user_groups(is_active);

CREATE INDEX IF NOT EXISTS idx_user_group_members_group_id ON public.user_group_members(user_group_id);
CREATE INDEX IF NOT EXISTS idx_user_group_members_user_id ON public.user_group_members(user_id);

CREATE INDEX IF NOT EXISTS idx_user_group_permissions_group_id ON public.user_group_permissions(user_group_id);
CREATE INDEX IF NOT EXISTS idx_user_group_permissions_module ON public.user_group_permissions(module);

-- ===========================
-- RLS POLICIES
-- ===========================
ALTER TABLE public.user_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access to user_groups" ON public.user_groups;
DROP POLICY IF EXISTS "Allow all access to user_group_members" ON public.user_group_members;
DROP POLICY IF EXISTS "Allow all access to user_group_permissions" ON public.user_group_permissions;

CREATE POLICY "Allow all access to user_groups" ON public.user_groups FOR ALL USING (true);
CREATE POLICY "Allow all access to user_group_members" ON public.user_group_members FOR ALL USING (true);
CREATE POLICY "Allow all access to user_group_permissions" ON public.user_group_permissions FOR ALL USING (true);

-- ===========================
-- TRIGGERS
-- ===========================
CREATE TRIGGER update_user_groups_updated_at 
  BEFORE UPDATE ON public.user_groups 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_group_permissions_updated_at 
  BEFORE UPDATE ON public.user_group_permissions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================
-- INSERT DEFAULT USER GROUPS
-- ===========================
DO $$
DECLARE
  demo_company_id UUID := '00000000-0000-0000-0000-000000000010';
  demo_project_id UUID := '00000000-0000-0000-0000-000000000020';
  staff_role_id UUID;
  resident_role_id UUID;
  accountant_group_id UUID;
  committee_group_id UUID;
  auditor_group_id UUID;
  support_group_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO staff_role_id FROM public.roles WHERE name = 'staff';
  SELECT id INTO resident_role_id FROM public.roles WHERE name = 'resident';

  -- Create Accountant Group (เจ้าหน้าที่บัญชี)
  INSERT INTO public.user_groups (name, display_name, description, role_id, company_id, project_id) VALUES
  ('accountant', 'เจ้าหน้าที่บัญชี', 'ฝ่ายบัญชี/การเงิน - บันทึกรายรับ-รายจ่าย', staff_role_id, demo_company_id, demo_project_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO accountant_group_id;

  -- Create Committee Group (กรรมการอาคาร)
  INSERT INTO public.user_groups (name, display_name, description, role_id, company_id, project_id) VALUES
  ('committee', 'กรรมการอาคารชุด', 'กรรมการนิติบุคคล - ดูรายงานเท่านั้น', resident_role_id, demo_company_id, demo_project_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO committee_group_id;

  -- Create Auditor Group (ผู้ตรวจสอบบัญชี)
  INSERT INTO public.user_groups (name, display_name, description, role_id, company_id, project_id) VALUES
  ('auditor', 'ผู้ตรวจสอบบัญชี', 'ผู้ตรวจสอบภายนอก - เข้าถึงงบการเงินอย่างเดียว', resident_role_id, demo_company_id, demo_project_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO auditor_group_id;

  -- Create Support Staff Group (เจ้าหน้าที่ทั่วไป)
  INSERT INTO public.user_groups (name, display_name, description, role_id, company_id, project_id) VALUES
  ('support_staff', 'เจ้าหน้าที่ทั่วไป', 'เจ้าหน้าที่อาคารที่ไม่เกี่ยวบัญชี - พัสดุ/แจ้งซ่อม', staff_role_id, demo_company_id, demo_project_id)
  ON CONFLICT DO NOTHING
  RETURNING id INTO support_group_id;

  -- Set permissions for Accountant Group
  IF accountant_group_id IS NOT NULL THEN
    INSERT INTO public.user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export) VALUES
    (accountant_group_id, 'billing', true, true, true, true, false, true, true),
    (accountant_group_id, 'payments', true, true, true, true, false, true, true),
    (accountant_group_id, 'revenue', true, true, true, true, false, true, true),
    (accountant_group_id, 'expenses', true, true, true, true, false, true, true),
    (accountant_group_id, 'chart_of_accounts', true, true, true, true, false, true, true),
    (accountant_group_id, 'journal_vouchers', true, true, true, true, false, true, true),
    (accountant_group_id, 'general_ledger', true, true, false, false, false, true, true),
    (accountant_group_id, 'financial_statements', true, true, false, false, false, true, true),
    (accountant_group_id, 'reports', true, true, false, false, false, true, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Set permissions for Committee Group (Read-only)
  IF committee_group_id IS NOT NULL THEN
    INSERT INTO public.user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export) VALUES
    (committee_group_id, 'reports', true, true, false, false, false, true, true),
    (committee_group_id, 'financial_statements', true, true, false, false, false, true, true),
    (committee_group_id, 'revenue_reports', true, true, false, false, false, true, true),
    (committee_group_id, 'budget_report', true, true, false, false, false, true, true),
    (committee_group_id, 'analytics', true, true, false, false, false, true, true)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Set permissions for Auditor Group (Financial reports only)
  IF auditor_group_id IS NOT NULL THEN
    INSERT INTO public.user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export) VALUES
    (auditor_group_id, 'financial_statements', true, true, false, false, false, true, true),
    (auditor_group_id, 'general_ledger', true, true, false, false, false, true, true),
    (auditor_group_id, 'journal_vouchers', true, true, false, false, false, true, false),
    (auditor_group_id, 'chart_of_accounts', true, true, false, false, false, true, false)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Set permissions for Support Staff Group (Operations only)
  IF support_group_id IS NOT NULL THEN
    INSERT INTO public.user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export) VALUES
    (support_group_id, 'parcels', true, true, true, true, false, true, true),
    (support_group_id, 'maintenance', true, true, true, true, false, true, true),
    (support_group_id, 'announcements', true, true, true, true, false, true, false),
    (support_group_id, 'files', true, true, true, true, false, false, true)
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE 'User groups created: Accountant, Committee, Auditor, Support Staff';
END $$;

-- ===========================
-- COMPLETION MESSAGE
-- ===========================
DO $$
BEGIN
  RAISE NOTICE '=================================';
  RAISE NOTICE 'User Groups System installed!';
  RAISE NOTICE '=================================';
  RAISE NOTICE '4 default groups created:';
  RAISE NOTICE '  - Accountant (เจ้าหน้าที่บัญชี)';
  RAISE NOTICE '  - Committee (กรรมการอาคาร)';
  RAISE NOTICE '  - Auditor (ผู้ตรวจสอบบัญชี)';
  RAISE NOTICE '  - Support Staff (เจ้าหน้าที่ทั่วไป)';
END $$;
