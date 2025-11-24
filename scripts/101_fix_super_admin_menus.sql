-- Check and add missing Super Admin menu modules
-- This script will identify and add missing modules for Super Admin menus

SELECT 
  '===== CHECKING SUPER ADMIN MENU MODULES =====' as debug_info;

-- 1. Check which Super Admin modules exist for the user
SELECT 
  'Super Admin Modules Check' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit,
  ugp.can_delete,
  ugp.can_print,
  ugp.can_export,
  ugp.can_approve,
  ugp.can_assign,
  ugp.project_id
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
JOIN user_group_members ugm ON ug.id = ugm.user_group_id
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true
  AND ugp.module IN ('companies', 'projects', 'user_groups', 'api')
ORDER BY ugp.module, ugp.project_id;

-- 2. Check if all Super Admin modules are missing
SELECT 
  'Missing Super Admin Modules' as check_type,
  module_list.module,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_group_permissions ugp
      JOIN user_groups ug ON ugp.user_group_id = ug.id
      JOIN user_group_members ugm ON ug.id = ugm.user_group_id
      WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
        AND ugm.is_active = true
        AND ug.is_active = true
        AND ugp.module = module_list.module
    ) THEN 'EXISTS'
    ELSE 'MISSING'
  END as status
FROM (
  SELECT 'companies' as module UNION ALL
  SELECT 'projects' UNION ALL
  SELECT 'user_groups' UNION ALL
  SELECT 'api'
) module_list
ORDER BY module_list.module;

-- 3. Add missing Super Admin modules to User Groups
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
  module_list.module,
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
CROSS JOIN (
  SELECT 'companies' as module UNION ALL
  SELECT 'projects' UNION ALL
  SELECT 'user_groups' UNION ALL
  SELECT 'api'
) module_list
WHERE ug.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp
    WHERE ugp.user_group_id = ug.id
      AND ugp.module = module_list.module
      AND ugp.project_id IS NULL
  );

-- 4. Verify the additions
SELECT 
  'Verification - Super Admin Modules Added' as check_type,
  ugp.user_group_id,
  ug.name as group_name,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit,
  ugp.can_delete,
  ugp.can_print,
  ugp.can_export,
  ugp.can_approve,
  ugp.can_assign,
  ugp.project_id
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ugp.module IN ('companies', 'projects', 'user_groups', 'api')
  AND ugp.project_id IS NULL
ORDER BY ug.name, ugp.module;

-- 5. Check user access to Super Admin modules
SELECT 
  'User Access to Super Admin Modules' as check_type,
  ugp.user_group_id,
  ug.name as group_name,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit,
  ugp.can_delete,
  ugp.can_print,
  ugp.can_export,
  ugp.can_approve,
  ugp.can_assign,
  ugp.project_id
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
JOIN user_group_members ugm ON ug.id = ugm.user_group_id
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true
  AND ugp.module IN ('companies', 'projects', 'user_groups', 'api')
ORDER BY ugp.module, ugp.project_id;
