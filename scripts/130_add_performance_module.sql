-- Add Performance Module to All User Groups
-- This script adds the 'performance' module to all existing user groups

SELECT 
  '===== ADDING PERFORMANCE MODULE TO ALL USER GROUPS =====' as debug_info;

-- 1. Show current groups and their permission counts
SELECT 
  'Current Groups Status' as check_type,
  ug.name as group_name,
  ug.display_name,
  COUNT(ugp.module) as current_permissions
FROM user_groups ug
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.is_active = true
GROUP BY ug.id, ug.name, ug.display_name
ORDER BY ug.display_name;

-- 2. Add performance module to all active groups (Global permissions)
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
  ug.id,
  'performance',
  true, true, false, false, false, true, true, false, false, NULL::uuid
FROM user_groups ug
WHERE ug.is_active = true
  AND ug.id NOT IN (
    SELECT DISTINCT user_group_id 
    FROM user_group_permissions 
    WHERE module = 'performance' AND project_id IS NULL
  )
ON CONFLICT (user_group_id, module, project_id) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  can_view = EXCLUDED.can_view,
  can_add = EXCLUDED.can_add,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete,
  can_print = EXCLUDED.can_print,
  can_export = EXCLUDED.can_export,
  can_approve = EXCLUDED.can_approve,
  can_assign = EXCLUDED.can_assign;

-- 3. Add performance module to all active groups (Project-specific permissions)
-- Replace '4555643e-3298-4f4b-9d11-6c51680bc307' with the actual project ID
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
  ug.id,
  'performance',
  true, true, false, false, false, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug
WHERE ug.is_active = true
  AND ug.id NOT IN (
    SELECT DISTINCT user_group_id 
    FROM user_group_permissions 
    WHERE module = 'performance' AND project_id = '4555643e-3298-4f4b-9d11-6c51680bc307'
  )
ON CONFLICT (user_group_id, module, project_id) DO UPDATE SET
  can_access = EXCLUDED.can_access,
  can_view = EXCLUDED.can_view,
  can_add = EXCLUDED.can_add,
  can_edit = EXCLUDED.can_edit,
  can_delete = EXCLUDED.can_delete,
  can_print = EXCLUDED.can_print,
  can_export = EXCLUDED.can_export,
  can_approve = EXCLUDED.can_approve,
  can_assign = EXCLUDED.can_assign;

-- 4. Verify the additions
SELECT 
  'After Adding Performance Module' as check_type,
  ug.name as group_name,
  ug.display_name,
  COUNT(ugp.module) as total_permissions,
  COUNT(CASE WHEN ugp.module = 'performance' THEN 1 END) as performance_permissions,
  COUNT(CASE WHEN ugp.project_id IS NULL THEN 1 END) as global_permissions,
  COUNT(CASE WHEN ugp.project_id IS NOT NULL THEN 1 END) as project_permissions
FROM user_groups ug
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.is_active = true
GROUP BY ug.id, ug.name, ug.display_name
ORDER BY ug.display_name;

-- 5. Show performance module permissions specifically
SELECT 
  'Performance Module Permissions' as check_type,
  ug.name as group_name,
  ug.display_name,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit,
  ugp.can_delete,
  ugp.can_print,
  ugp.can_export,
  ugp.project_id
FROM user_groups ug
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.is_active = true
  AND ugp.module = 'performance'
ORDER BY ug.display_name, ugp.project_id;
