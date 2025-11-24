-- Check User Group permissions for debugging
-- This script will help identify why menus are not showing correctly

SELECT 
  '===== USER GROUP PERMISSIONS DEBUG =====' as debug_info;

-- 1. Check user group memberships
SELECT 
  'User Group Memberships' as check_type,
  ugm.user_id,
  ugm.user_group_id,
  ug.name as group_name,
  ug.is_active as group_active,
  ugm.is_active as membership_active
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true;

-- 2. Check user group permissions (global permissions - project_id = null)
SELECT 
  'Global User Group Permissions' as check_type,
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
  AND ugp.project_id IS NULL
ORDER BY ugp.module;

-- 3. Check user group permissions (project-specific permissions)
SELECT 
  'Project-Specific User Group Permissions' as check_type,
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
  ugp.project_id,
  p.name as project_name
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
JOIN user_group_members ugm ON ug.id = ugm.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true
  AND ugp.project_id IS NOT NULL
ORDER BY ugp.project_id, ugp.module;

-- 4. Count total permissions by type
SELECT 
  'Permission Count Summary' as check_type,
  'Global Permissions' as permission_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN can_access = true THEN 1 END) as can_access_count,
  COUNT(CASE WHEN can_view = true THEN 1 END) as can_view_count
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
JOIN user_group_members ugm ON ug.id = ugm.user_group_id
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true
  AND ugp.project_id IS NULL

UNION ALL

SELECT 
  'Permission Count Summary' as check_type,
  'Project-Specific Permissions' as permission_type,
  COUNT(*) as total_count,
  COUNT(CASE WHEN can_access = true THEN 1 END) as can_access_count,
  COUNT(CASE WHEN can_view = true THEN 1 END) as can_view_count
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
JOIN user_group_members ugm ON ug.id = ugm.user_group_id
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true
  AND ugp.project_id IS NOT NULL;

-- 5. Check if user has any accessible modules
SELECT 
  'Accessible Modules Summary' as check_type,
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
  AND (ugp.project_id IS NULL OR ugp.project_id IS NOT NULL)
GROUP BY ugp.module
ORDER BY ugp.module;
