-- Check why admin group is not showing in UI
-- This script will verify the group exists and check UI requirements

SELECT 
  '===== CHECKING UI DISPLAY ISSUE =====' as debug_info;

-- 1. Verify the group exists with correct configuration
SELECT 
  'Group Verification' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  r.name as base_role,
  r.level as role_level,
  ug.is_active,
  ug.created_at
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
WHERE ug.name = 'admin_recommended'
ORDER BY ug.created_at DESC;

-- 2. Check if the group has the right number of permissions
SELECT 
  'Permission Count Verification' as check_type,
  ug.name,
  ug.display_name,
  COUNT(ugp.module) as total_permissions,
  COUNT(CASE WHEN ugp.can_access = true THEN 1 END) as can_access_count,
  COUNT(CASE WHEN ugp.can_view = true THEN 1 END) as can_view_count
FROM user_groups ug
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.name = 'admin_recommended'
GROUP BY ug.id, ug.name, ug.display_name;

-- 3. Check if the group is properly configured for UI display
SELECT 
  'UI Configuration Check' as check_type,
  CASE 
    WHEN ug.id IS NULL THEN 'Group does not exist'
    WHEN ug.is_active = false THEN 'Group is inactive'
    WHEN ug.display_name IS NULL THEN 'Group has no display name'
    WHEN r.name IS NULL THEN 'Group has no base role'
    WHEN COUNT(ugp.module) < 30 THEN 'Group has insufficient permissions'
    ELSE 'Group is properly configured for UI'
  END as status,
  ug.display_name,
  r.name as base_role,
  COUNT(ugp.module) as permission_count
FROM user_groups ug
LEFT JOIN roles r ON ug.role_id = r.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.name = 'admin_recommended'
GROUP BY ug.id, ug.is_active, ug.display_name, r.name;

-- 4. Check if there are any other groups with similar names
SELECT 
  'Similar Groups Check' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  r.name as base_role,
  COUNT(ugp.module) as permission_count
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.display_name LIKE '%แอดมิน%'
  OR ug.name LIKE '%admin%'
GROUP BY ug.id, ug.name, ug.display_name, ug.description, r.name
ORDER BY ug.created_at DESC;

-- 5. Check if the group needs to be in a specific category
SELECT 
  'Category Check' as check_type,
  ug.name,
  ug.display_name,
  ug.company_id,
  ug.role_id,
  r.name as base_role
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
WHERE ug.name = 'admin_recommended';

-- 6. Force refresh by updating the group
UPDATE user_groups 
SET updated_at = NOW()
WHERE name = 'admin_recommended';

-- 7. Final verification
SELECT 
  'Final Status' as check_type,
  'Group exists' as group_status,
  'Permissions configured' as permission_status,
  'Ready for UI display' as ui_status
FROM user_groups ug
WHERE ug.name = 'admin_recommended'
  AND ug.is_active = true
  AND EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.can_access = true
  );
