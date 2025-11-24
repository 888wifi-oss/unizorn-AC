-- Check why admin group is not showing in recommended groups
-- This script will debug the issue

SELECT 
  '===== DEBUGGING ADMIN GROUP DISPLAY =====' as debug_info;

-- 1. Check if the group exists
SELECT 
  'Group Exists Check' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  r.name as base_role,
  ug.is_active,
  ug.created_at
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
WHERE ug.name = 'admin_recommended'
  OR ug.display_name = 'แอดมิน'
ORDER BY ug.created_at DESC;

-- 2. Check permissions count
SELECT 
  'Permissions Count Check' as check_type,
  ug.name,
  ug.display_name,
  COUNT(ugp.module) as permission_count
FROM user_groups ug
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.name = 'admin_recommended'
  OR ug.display_name = 'แอดมิน'
GROUP BY ug.id, ug.name, ug.display_name;

-- 3. Check all groups to see what's different
SELECT 
  'All Groups Comparison' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  r.name as base_role,
  ug.is_active,
  COUNT(ugp.module) as permission_count
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.is_active = true
GROUP BY ug.id, ug.name, ug.display_name, ug.description, r.name, ug.is_active
ORDER BY ug.created_at DESC;

-- 4. Check if the group has the right permissions
SELECT 
  'Permission Details Check' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.project_id
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'admin_recommended'
  OR ug.display_name = 'แอดมิน'
ORDER BY ugp.module;

-- 5. Check if there are any duplicate groups
SELECT 
  'Duplicate Check' as check_type,
  ug.display_name,
  COUNT(*) as count
FROM user_groups ug
WHERE ug.display_name = 'แอดมิน'
GROUP BY ug.display_name;

-- 6. Check if the group is properly configured
SELECT 
  'Configuration Check' as check_type,
  CASE 
    WHEN ug.id IS NULL THEN 'Group does not exist'
    WHEN ugp.module IS NULL THEN 'Group exists but no permissions'
    WHEN COUNT(ugp.module) < 30 THEN 'Group has insufficient permissions'
    ELSE 'Group is properly configured'
  END as status
FROM user_groups ug
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.name = 'admin_recommended'
GROUP BY ug.id, ugp.module;
