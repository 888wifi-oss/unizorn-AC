-- Quick fix for missing Super Admin menus
-- This script will immediately restore Super Admin menu access

SELECT 
  '===== QUICK FIX FOR SUPER ADMIN MENUS =====' as debug_info;

-- 1. Check current user's Super Admin module access
SELECT 
  'Current Super Admin Access' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.project_id,
  ug.name as group_name
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
JOIN user_group_members ugm ON ug.id = ugm.user_group_id
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true
  AND ugp.module IN ('companies', 'projects', 'user_groups', 'api')
ORDER BY ugp.module;

-- 2. Add Super Admin modules to ALL User Groups immediately
INSERT INTO user_group_permissions (
  user_group_id,
  module,
  can_access,
  can_view,
  can_add,
  can_edit,
  can_delete,
  can_print,
  can_export,
  can_approve,
  can_assign,
  project_id
)
SELECT 
  ug.id as user_group_id,
  'companies' as module,
  true as can_access,
  true as can_view,
  true as can_add,
  true as can_edit,
  true as can_delete,
  true as can_print,
  true as can_export,
  false as can_approve,
  false as can_assign,
  NULL as project_id
FROM user_groups ug
WHERE ug.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp
    WHERE ugp.user_group_id = ug.id
      AND ugp.module = 'companies'
      AND ugp.project_id IS NULL
  );

-- 3. Add projects module
INSERT INTO user_group_permissions (
  user_group_id,
  module,
  can_access,
  can_view,
  can_add,
  can_edit,
  can_delete,
  can_print,
  can_export,
  can_approve,
  can_assign,
  project_id
)
SELECT 
  ug.id as user_group_id,
  'projects' as module,
  true as can_access,
  true as can_view,
  true as can_add,
  true as can_edit,
  true as can_delete,
  true as can_print,
  true as can_export,
  false as can_approve,
  false as can_assign,
  NULL as project_id
FROM user_groups ug
WHERE ug.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp
    WHERE ugp.user_group_id = ug.id
      AND ugp.module = 'projects'
      AND ugp.project_id IS NULL
  );

-- 4. Add user_groups module
INSERT INTO user_group_permissions (
  user_group_id,
  module,
  can_access,
  can_view,
  can_add,
  can_edit,
  can_delete,
  can_print,
  can_export,
  can_approve,
  can_assign,
  project_id
)
SELECT 
  ug.id as user_group_id,
  'user_groups' as module,
  true as can_access,
  true as can_view,
  true as can_add,
  true as can_edit,
  true as can_delete,
  true as can_print,
  true as can_export,
  false as can_approve,
  false as can_assign,
  NULL as project_id
FROM user_groups ug
WHERE ug.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp
    WHERE ugp.user_group_id = ug.id
      AND ugp.module = 'user_groups'
      AND ugp.project_id IS NULL
  );

-- 5. Add api module
INSERT INTO user_group_permissions (
  user_group_id,
  module,
  can_access,
  can_view,
  can_add,
  can_edit,
  can_delete,
  can_print,
  can_export,
  can_approve,
  can_assign,
  project_id
)
SELECT 
  ug.id as user_group_id,
  'api' as module,
  true as can_access,
  true as can_view,
  true as can_add,
  true as can_edit,
  true as can_delete,
  true as can_print,
  true as can_export,
  false as can_approve,
  false as can_assign,
  NULL as project_id
FROM user_groups ug
WHERE ug.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp
    WHERE ugp.user_group_id = ug.id
      AND ugp.module = 'api'
      AND ugp.project_id IS NULL
  );

-- 6. Verify the fix
SELECT 
  'VERIFICATION - Super Admin Modules Restored' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ug.name as group_name
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
JOIN user_group_members ugm ON ug.id = ugm.user_group_id
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true
  AND ugp.module IN ('companies', 'projects', 'user_groups', 'api')
  AND ugp.project_id IS NULL
ORDER BY ugp.module;
