-- Add Performance Module to Specific Project
-- Use this script to add performance module to a specific project
-- Replace 'YOUR_PROJECT_ID_HERE' with the actual project ID

-- Example: Add performance module to project '4555643e-3298-4f4b-9d11-6c51680bc307'
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

-- Verify the addition
SELECT 
  'Performance Module Added to Project' as check_type,
  ug.name as group_name,
  ug.display_name,
  ugp.can_access,
  ugp.can_view,
  ugp.project_id
FROM user_groups ug
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.is_active = true
  AND ugp.module = 'performance'
  AND ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307'
ORDER BY ug.display_name;
