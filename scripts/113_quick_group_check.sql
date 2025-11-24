-- Quick check if the system_manager group was created successfully
-- This script will verify the group creation and show all groups

SELECT 
  '===== QUICK GROUP VERIFICATION =====' as debug_info;

-- 1. Check if system_manager group exists
SELECT 
  'Group Exists Check' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  ug.is_active,
  r.name as base_role,
  COUNT(ugp.module) as module_count
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.name = 'system_manager'
GROUP BY ug.id, ug.name, ug.display_name, ug.description, ug.is_active, r.name;

-- 2. Show all groups in the system
SELECT 
  'All Groups Summary' as check_type,
  ug.name,
  ug.display_name,
  ug.description,
  ug.is_active,
  r.name as base_role,
  COUNT(ugp.module) as module_count,
  CASE 
    WHEN ug.name = 'system_manager' THEN 'NEW GROUP'
    WHEN ug.name IN ('accountant', 'committee', 'auditor', 'support_staff') THEN 'EXISTING GROUP'
    ELSE 'OTHER GROUP'
  END as group_type
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
GROUP BY ug.id, ug.name, ug.display_name, ug.description, ug.is_active, r.name
ORDER BY group_type, ug.display_name;

-- 3. Check if there are any duplicate display names
SELECT 
  'Duplicate Check' as check_type,
  ug.display_name,
  COUNT(*) as count,
  STRING_AGG(ug.name, ', ') as group_names
FROM user_groups ug
GROUP BY ug.display_name
HAVING COUNT(*) > 1;

-- 4. Show permissions for system_manager group
SELECT 
  'System Manager Permissions' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.project_id
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'system_manager'
ORDER BY ugp.module;

-- 5. Count total modules for system_manager
SELECT 
  'Module Count' as check_type,
  COUNT(*) as total_modules
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'system_manager';
