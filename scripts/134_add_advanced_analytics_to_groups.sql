-- scripts/134_add_advanced_analytics_to_groups.sql
-- Add 'advanced_analytics' module to all user groups (global and project-specific)

SELECT 
  '===== ADDING ADVANCED_ANALYTICS MODULE TO USER GROUPS =====' as debug_info;

-- 1. Add advanced_analytics module to all active groups (Global permissions)
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
  'advanced_analytics',
  true, true, false, false, false, true, true, false, false, NULL::uuid
FROM user_groups ug
WHERE ug.is_active = true
  AND ug.id NOT IN (
    SELECT DISTINCT user_group_id 
    FROM user_group_permissions 
    WHERE module = 'advanced_analytics' AND project_id IS NULL
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

-- 2. Add advanced_analytics module to specific project (replace with actual project ID)
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
  'advanced_analytics',
  true, true, false, false, false, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug
WHERE ug.is_active = true
  AND ug.id NOT IN (
    SELECT DISTINCT user_group_id 
    FROM user_group_permissions 
    WHERE module = 'advanced_analytics' AND project_id = '4555643e-3298-4f4b-9d11-6c51680bc307'
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

-- 3. Verify the permissions for advanced_analytics module
SELECT 
  'Advanced Analytics Permissions Verification' as check_type,
  ug.name as group_name,
  ug.display_name as group_display_name,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.can_print,
  ugp.can_export,
  CASE 
    WHEN ugp.project_id IS NULL THEN 'Global'
    ELSE 'Project: ' || ugp.project_id
  END as scope
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ugp.module = 'advanced_analytics'
  AND ug.is_active = true
ORDER BY ug.display_name, ugp.project_id;

-- 4. Count the number of groups with advanced_analytics permissions
SELECT 
  'Advanced Analytics Groups Count' as check_type,
  COUNT(DISTINCT ug.id) as total_groups,
  COUNT(CASE WHEN ugp.project_id IS NULL THEN 1 END) as global_permissions,
  COUNT(CASE WHEN ugp.project_id IS NOT NULL THEN 1 END) as project_permissions
FROM user_groups ug
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugp.module = 'advanced_analytics'
  AND ug.is_active = true;

-- 5. Show all modules available in the system
SELECT 
  'All Available Modules' as check_type,
  module,
  COUNT(*) as permission_count,
  COUNT(CASE WHEN project_id IS NULL THEN 1 END) as global_count,
  COUNT(CASE WHEN project_id IS NOT NULL THEN 1 END) as project_count
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.is_active = true
GROUP BY module
ORDER BY module;
