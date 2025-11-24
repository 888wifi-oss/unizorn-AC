-- Debug the testaa group permissions issue
-- This script will check why the testaa group has 0 permissions

SELECT 
  '===== DEBUGGING TESTAA GROUP =====' as debug_info;

-- 1. Check the testaa group details
SELECT 
  'Group Details' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  ug.role_id,
  r.name as role_name,
  ug.company_id,
  ug.is_active
FROM user_groups ug
LEFT JOIN roles r ON ug.role_id = r.id
WHERE ug.name = 'testaa';

-- 2. Check permissions for testaa group
SELECT 
  'Group Permissions' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit,
  ugp.can_delete,
  ugp.can_print,
  ugp.can_export,
  ugp.can_approve,
  ugp.can_assign,
  ugp.project_id,
  CASE 
    WHEN ugp.project_id IS NULL THEN 'Global'
    ELSE 'Project-specific'
  END as permission_type
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'testaa'
ORDER BY ugp.module;

-- 3. Count permissions by type
SELECT 
  'Permission Counts' as check_type,
  COUNT(*) as total_permissions,
  COUNT(CASE WHEN project_id IS NULL THEN 1 END) as global_permissions,
  COUNT(CASE WHEN project_id IS NOT NULL THEN 1 END) as project_permissions,
  COUNT(CASE WHEN project_id = '4555643e-3298-4f4b-9d11-6c51680bc307' THEN 1 END) as target_project_permissions
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'testaa';

-- 4. Check if user is properly assigned to the group
SELECT 
  'User Group Membership' as check_type,
  ugm.user_id,
  ugm.user_group_id,
  ug.name as group_name,
  ug.display_name,
  ugm.created_at
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
WHERE ugm.user_id = '8b94bd45-b283-415d-8eb0-f4316b7dad0a'
  AND ug.name = 'testaa';

-- 5. Check all groups for this user
SELECT 
  'All User Groups' as check_type,
  ug.name as group_name,
  ug.display_name,
  COUNT(ugp.module) as permission_count
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '8b94bd45-b283-415d-8eb0-f4316b7dad0a'
GROUP BY ug.id, ug.name, ug.display_name
ORDER BY ug.display_name;
