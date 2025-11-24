-- Check if companies module exists in User Group permissions
-- This script will verify if the companies module is properly configured

SELECT 
  '===== CHECKING COMPANIES MODULE =====' as debug_info;

-- 1. Check if companies module exists in User Group permissions
SELECT 
  'Companies Module Check' as check_type,
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

-- 2. Check all modules for the user
SELECT 
  'All User Modules' as check_type,
  ugp.module,
  COUNT(*) as permission_count,
  MAX(CASE WHEN ugp.can_access = true THEN 1 ELSE 0 END) as has_access,
  MAX(CASE WHEN ugp.can_view = true THEN 1 ELSE 0 END) as has_view
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
JOIN user_group_members ugm ON ug.id = ugm.user_group_id
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true
GROUP BY ugp.module
ORDER BY ugp.module;

-- 3. Check if companies module is missing
SELECT 
  'Missing Companies Module' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_group_permissions ugp
      JOIN user_groups ug ON ugp.user_group_id = ug.id
      JOIN user_group_members ugm ON ug.id = ugm.user_group_id
      WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
        AND ugm.is_active = true
        AND ug.is_active = true
        AND ugp.module = 'companies'
    ) THEN 'Companies module EXISTS'
    ELSE 'Companies module MISSING'
  END as result;
