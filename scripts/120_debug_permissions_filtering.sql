-- Debug permissions filtering issue
-- This script will check why permissions are not showing for the project

SELECT 
  '===== DEBUG PERMISSIONS FILTERING =====' as debug_info;

-- 1. Check the manager_group permissions
SELECT 
  'Manager Group Permissions' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.project_id,
  CASE 
    WHEN ugp.project_id IS NULL THEN 'GLOBAL PERMISSION'
    WHEN ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307' THEN 'PROJECT PERMISSION'
    ELSE 'OTHER PROJECT PERMISSION'
  END as permission_type
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'manager_group'
ORDER BY ugp.project_id, ugp.module;

-- 2. Check if there are any global permissions (project_id IS NULL)
SELECT 
  'Global Permissions Count' as check_type,
  COUNT(*) as global_permissions_count
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'manager_group'
  AND ugp.project_id IS NULL;

-- 3. Check if there are any project-specific permissions
SELECT 
  'Project-Specific Permissions Count' as check_type,
  COUNT(*) as project_permissions_count
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'manager_group'
  AND ugp.project_id IS NOT NULL;

-- 4. Check the specific project permissions
SELECT 
  'Specific Project Permissions' as check_type,
  COUNT(*) as specific_project_permissions_count
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'manager_group'
  AND ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307';

-- 5. Show sample permissions
SELECT 
  'Sample Permissions' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.project_id
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'manager_group'
LIMIT 10;

-- 6. Check the user group details
SELECT 
  'User Group Details' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  ug.role_id,
  ug.company_id,
  ug.is_active
FROM user_groups ug
WHERE ug.name = 'manager_group';
