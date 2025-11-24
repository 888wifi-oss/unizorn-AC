-- scripts/015_user_groups_multi_project.sql
-- Upgrade User Groups to support Multi-Project

-- ===========================
-- 1. ADD project_id to user_group_members
-- ===========================

-- Add project_id column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_group_members' 
    AND column_name = 'project_id'
  ) THEN
    ALTER TABLE public.user_group_members 
    ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
    
    RAISE NOTICE 'Added project_id column to user_group_members';
  END IF;
END $$;

-- ===========================
-- 2. UPDATE existing data
-- ===========================

-- Update existing user_group_members with project_id from user_groups
UPDATE public.user_group_members ugm
SET project_id = ug.project_id
FROM public.user_groups ug
WHERE ugm.user_group_id = ug.id
AND ugm.project_id IS NULL;

-- ===========================
-- 3. CREATE new indexes
-- ===========================

CREATE INDEX IF NOT EXISTS idx_user_group_members_project_id 
ON public.user_group_members(project_id);

CREATE INDEX IF NOT EXISTS idx_user_group_members_user_project 
ON public.user_group_members(user_id, project_id);

-- ===========================
-- 4. UPDATE RLS policies
-- ===========================

-- Drop existing policy
DROP POLICY IF EXISTS "Allow all access to user_group_members" ON public.user_group_members;

-- Create new policy with project_id awareness
CREATE POLICY "Allow all access to user_group_members" 
ON public.user_group_members 
FOR ALL 
USING (true);

-- ===========================
-- 5. CREATE helper functions
-- ===========================

-- Function to get user's groups in a specific project
CREATE OR REPLACE FUNCTION get_user_groups_in_project(
  p_user_id UUID,
  p_project_id UUID
)
RETURNS TABLE (
  group_id UUID,
  group_name VARCHAR,
  group_display_name VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ug.id,
    ug.name,
    ug.display_name
  FROM public.user_groups ug
  JOIN public.user_group_members ugm ON ug.id = ugm.user_group_id
  WHERE ugm.user_id = p_user_id
    AND ugm.project_id = p_project_id
    AND ugm.is_active = true
    AND ug.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's permissions in a specific project (from groups)
CREATE OR REPLACE FUNCTION get_user_group_permissions_in_project(
  p_user_id UUID,
  p_project_id UUID
)
RETURNS TABLE (
  module VARCHAR,
  can_access BOOLEAN,
  can_view BOOLEAN,
  can_add BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN,
  can_print BOOLEAN,
  can_export BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ugp.module,
    bool_or(ugp.can_access) as can_access,
    bool_or(ugp.can_view) as can_view,
    bool_or(ugp.can_add) as can_add,
    bool_or(ugp.can_edit) as can_edit,
    bool_or(ugp.can_delete) as can_delete,
    bool_or(ugp.can_print) as can_print,
    bool_or(ugp.can_export) as can_export
  FROM public.user_group_permissions ugp
  JOIN public.user_group_members ugm ON ugp.user_group_id = ugm.user_group_id
  WHERE ugm.user_id = p_user_id
    AND ugm.project_id = p_project_id
    AND ugm.is_active = true
  GROUP BY ugp.module;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has specific permission in project (from groups)
CREATE OR REPLACE FUNCTION user_has_group_permission_in_project(
  p_user_id UUID,
  p_project_id UUID,
  p_module VARCHAR,
  p_action VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := false;
BEGIN
  SELECT 
    CASE p_action
      WHEN 'view' THEN bool_or(ugp.can_view)
      WHEN 'add' THEN bool_or(ugp.can_add)
      WHEN 'edit' THEN bool_or(ugp.can_edit)
      WHEN 'delete' THEN bool_or(ugp.can_delete)
      WHEN 'print' THEN bool_or(ugp.can_print)
      WHEN 'export' THEN bool_or(ugp.can_export)
      WHEN 'access' THEN bool_or(ugp.can_access)
      ELSE false
    END INTO v_has_permission
  FROM public.user_group_permissions ugp
  JOIN public.user_group_members ugm ON ugp.user_group_id = ugm.user_group_id
  WHERE ugm.user_id = p_user_id
    AND ugm.project_id = p_project_id
    AND ugm.is_active = true
    AND ugp.module = p_module;
  
  RETURN COALESCE(v_has_permission, false);
END;
$$ LANGUAGE plpgsql;

-- ===========================
-- 6. CREATE view for easy querying
-- ===========================

CREATE OR REPLACE VIEW v_user_group_memberships AS
SELECT 
  ugm.id,
  ugm.user_id,
  u.email,
  u.full_name,
  ugm.user_group_id,
  ug.name as group_name,
  ug.display_name as group_display_name,
  ugm.project_id,
  p.name as project_name,
  ug.company_id,
  c.name as company_name,
  ugm.is_active,
  ugm.created_at
FROM public.user_group_members ugm
JOIN public.users u ON ugm.user_id = u.id
JOIN public.user_groups ug ON ugm.user_group_id = ug.id
LEFT JOIN public.projects p ON ugm.project_id = p.id
LEFT JOIN public.companies c ON ug.company_id = c.id;

-- ===========================
-- 7. UPDATE unique constraint
-- ===========================

-- Drop old constraint if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_constraint 
    WHERE conname = 'user_group_members_user_group_id_user_id_key'
  ) THEN
    ALTER TABLE public.user_group_members 
    DROP CONSTRAINT user_group_members_user_group_id_user_id_key;
    
    RAISE NOTICE 'Dropped old unique constraint';
  END IF;
END $$;

-- Add new unique constraint with project_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_constraint 
    WHERE conname = 'user_group_members_unique_per_project'
  ) THEN
    ALTER TABLE public.user_group_members 
    ADD CONSTRAINT user_group_members_unique_per_project 
    UNIQUE (user_group_id, user_id, project_id);
    
    RAISE NOTICE 'Added new unique constraint with project_id';
  END IF;
END $$;

-- ===========================
-- COMPLETION MESSAGE
-- ===========================

DO $$
BEGIN
  RAISE NOTICE '=================================';
  RAISE NOTICE 'User Groups Multi-Project Upgrade Complete!';
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Changes:';
  RAISE NOTICE '  ✅ Added project_id to user_group_members';
  RAISE NOTICE '  ✅ Updated existing data';
  RAISE NOTICE '  ✅ Created indexes';
  RAISE NOTICE '  ✅ Updated RLS policies';
  RAISE NOTICE '  ✅ Created helper functions:';
  RAISE NOTICE '     - get_user_groups_in_project()';
  RAISE NOTICE '     - get_user_group_permissions_in_project()';
  RAISE NOTICE '     - user_has_group_permission_in_project()';
  RAISE NOTICE '  ✅ Created v_user_group_memberships view';
  RAISE NOTICE '  ✅ Updated unique constraint';
  RAISE NOTICE '';
  RAISE NOTICE 'Users can now be in different groups per project!';
END $$;
