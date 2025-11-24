-- Universal fix for any group with missing permissions
-- This script will add basic permissions to any group that has 0 permissions

SELECT 
  '===== UNIVERSAL GROUP PERMISSIONS FIX =====' as debug_info;

-- 1. Find groups with 0 permissions and show them
SELECT 
  'Groups with No Permissions' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  COUNT(ugp.module) as permission_count
FROM user_groups ug
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.is_active = true
GROUP BY ug.id, ug.name, ug.display_name
HAVING COUNT(ugp.module) = 0
ORDER BY ug.display_name;

-- 2. Add global permissions to groups with no permissions
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
  'dashboard',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug
WHERE ug.is_active = true
  AND ug.id NOT IN (
    SELECT DISTINCT user_group_id 
    FROM user_group_permissions 
    WHERE module = 'dashboard' AND project_id IS NULL
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

-- 3. Add more modules
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
  'units',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug
WHERE ug.is_active = true
  AND ug.id NOT IN (
    SELECT DISTINCT user_group_id 
    FROM user_group_permissions 
    WHERE module = 'units' AND project_id IS NULL
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

-- 4. Add project-specific permissions for the target project
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
  'dashboard',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug
WHERE ug.is_active = true
  AND ug.id NOT IN (
    SELECT DISTINCT user_group_id 
    FROM user_group_permissions 
    WHERE module = 'dashboard' AND project_id = '4555643e-3298-4f4b-9d11-6c51680bc307'
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

-- 5. Verify the fix
SELECT 
  'After Fix - All Groups Status' as check_type,
  ug.name,
  ug.display_name,
  COUNT(ugp.module) as total_permissions,
  COUNT(CASE WHEN ugp.project_id IS NULL THEN 1 END) as global_permissions,
  COUNT(CASE WHEN ugp.project_id IS NOT NULL THEN 1 END) as project_permissions
FROM user_groups ug
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.is_active = true
GROUP BY ug.id, ug.name, ug.display_name
ORDER BY ug.display_name;
