-- Debug why full_access_manager group is not showing in UI
-- This script will check the specific issue with this group

SELECT 
  '===== DEBUGGING FULL ACCESS MANAGER GROUP =====' as debug_info;

-- 1. Check the specific group details
SELECT 
  'Group Details' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  ug.role_id,
  ug.company_id,
  ug.is_active,
  ug.created_at,
  ug.updated_at,
  r.name as base_role,
  r.level as role_level
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
WHERE ug.name = 'full_access_manager';

-- 2. Check permissions for this group
SELECT 
  'Permission Details' as check_type,
  COUNT(*) as total_permissions,
  COUNT(CASE WHEN can_access = true THEN 1 END) as can_access_count,
  COUNT(CASE WHEN can_view = true THEN 1 END) as can_view_count,
  COUNT(CASE WHEN project_id IS NULL THEN 1 END) as global_permissions,
  COUNT(CASE WHEN project_id IS NOT NULL THEN 1 END) as project_permissions
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'full_access_manager';

-- 3. Check if there are any issues with the group configuration
SELECT 
  'Configuration Issues' as check_type,
  CASE 
    WHEN ug.id IS NULL THEN 'Group does not exist'
    WHEN ug.is_active = false THEN 'Group is inactive'
    WHEN ug.display_name IS NULL THEN 'Group has no display name'
    WHEN ug.description IS NULL THEN 'Group has no description'
    WHEN r.id IS NULL THEN 'Group has no base role'
    WHEN COUNT(ugp.module) < 30 THEN 'Group has insufficient permissions'
    WHEN COUNT(CASE WHEN ugp.project_id IS NOT NULL THEN 1 END) > 0 THEN 'Group has project-specific permissions'
    ELSE 'Group configuration looks correct'
  END as status,
  ug.display_name,
  r.name as base_role,
  COUNT(ugp.module) as permission_count
FROM user_groups ug
LEFT JOIN roles r ON ug.role_id = r.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.name = 'full_access_manager'
GROUP BY ug.id, ug.is_active, ug.display_name, ug.description, r.id, r.name;

-- 4. Compare with other groups that are showing
SELECT 
  'Comparison with Working Groups' as check_type,
  ug.name,
  ug.display_name,
  ug.is_active,
  r.name as base_role,
  COUNT(ugp.module) as permission_count,
  COUNT(CASE WHEN ugp.project_id IS NULL THEN 1 END) as global_permissions,
  COUNT(CASE WHEN ugp.project_id IS NOT NULL THEN 1 END) as project_permissions
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.name IN ('accountant', 'committee', 'auditor', 'support_staff', 'full_access_manager')
GROUP BY ug.id, ug.name, ug.display_name, ug.is_active, r.name
ORDER BY ug.name;

-- 5. Check if the group needs to be in a specific category or have specific properties
SELECT 
  'Category Check' as check_type,
  ug.name,
  ug.display_name,
  ug.company_id,
  ug.role_id,
  r.name as base_role,
  r.level as role_level
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
WHERE ug.name = 'full_access_manager';

-- 6. Try to force refresh by updating the group
UPDATE user_groups 
SET updated_at = NOW()
WHERE name = 'full_access_manager';

-- 7. Check if there are any duplicate groups
SELECT 
  'Duplicate Check' as check_type,
  ug.display_name,
  COUNT(*) as count,
  STRING_AGG(ug.name, ', ') as group_names
FROM user_groups ug
WHERE ug.display_name = 'ผู้จัดการระบบ'
GROUP BY ug.display_name;

-- 8. Final verification
SELECT 
  'Final Status' as check_type,
  'Group exists in database' as group_status,
  'Permissions configured' as permission_status,
  'Should appear in UI' as ui_status
FROM user_groups ug
WHERE ug.name = 'full_access_manager'
  AND ug.is_active = true
  AND EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.can_access = true
  );
