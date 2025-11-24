-- Add companies module to User Group permissions
-- This script will add the companies module to existing User Groups

SELECT 
  '===== ADDING COMPANIES MODULE =====' as debug_info;

-- 1. Add companies module to all User Groups that don't have it
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

-- 2. Verify the addition
SELECT 
  'Verification - Companies Module Added' as check_type,
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
WHERE ugp.module = 'companies'
  AND ugp.project_id IS NULL
ORDER BY ug.name;

-- 3. Check if the user now has access to companies module
SELECT 
  'User Access Check' as check_type,
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
  AND ugp.module = 'companies'
ORDER BY ugp.project_id;
