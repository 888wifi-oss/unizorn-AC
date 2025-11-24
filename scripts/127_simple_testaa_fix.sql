-- Simple fix for testaa group permissions
-- This script will add basic permissions to testaa group

SELECT 
  '===== SIMPLE FIX FOR TESTAA GROUP =====' as debug_info;

-- 1. Get the testaa group ID
WITH testaa_group AS (
  SELECT id FROM user_groups WHERE name = 'testaa'
)
-- 2. Add basic global permissions
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
  tg.id,
  'dashboard',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM testaa_group tg
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

-- 3. Add more modules one by one
WITH testaa_group AS (
  SELECT id FROM user_groups WHERE name = 'testaa'
)
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
  tg.id,
  'units',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM testaa_group tg
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
WITH testaa_group AS (
  SELECT id FROM user_groups WHERE name = 'testaa'
)
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
  tg.id,
  'dashboard',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM testaa_group tg
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
  'After Fix - Permission Count' as check_type,
  COUNT(*) as total_permissions,
  COUNT(CASE WHEN project_id IS NULL THEN 1 END) as global_permissions,
  COUNT(CASE WHEN project_id = '4555643e-3298-4f4b-9d11-6c51680bc307' THEN 1 END) as target_project_permissions
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'testaa';

-- 6. Show the permissions
SELECT 
  'Final Permissions' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.project_id,
  CASE 
    WHEN ugp.project_id IS NULL THEN 'Global'
    WHEN ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307' THEN 'Target Project'
    ELSE 'Other Project'
  END as permission_type
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'testaa'
ORDER BY ugp.module, ugp.project_id;
