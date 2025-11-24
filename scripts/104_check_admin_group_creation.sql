-- Check if admin recommended group was created
-- This script will verify if the group exists and troubleshoot

SELECT 
  '===== CHECKING ADMIN RECOMMENDED GROUP =====' as debug_info;

-- 1. Check if the group exists
SELECT 
  'Group Existence Check' as check_type,
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
  OR ug.display_name = 'แอดมิน'
ORDER BY ug.created_at DESC;

-- 2. Check all groups with 'admin' in the name
SELECT 
  'All Admin Groups' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  r.name as base_role,
  ug.is_active
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
WHERE ug.name LIKE '%admin%'
  OR ug.display_name LIKE '%แอดมิน%'
ORDER BY ug.created_at DESC;

-- 3. Check if permissions were created
SELECT 
  'Permissions Check' as check_type,
  ugp.user_group_id,
  ug.name as group_name,
  ug.display_name,
  COUNT(*) as permission_count
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'admin_recommended'
  OR ug.display_name = 'แอดมิน'
GROUP BY ugp.user_group_id, ug.name, ug.display_name;

-- 4. Check all recent groups created
SELECT 
  'Recent Groups' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  r.name as base_role,
  ug.is_active,
  ug.created_at
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
WHERE ug.created_at >= NOW() - INTERVAL '1 hour'
ORDER BY ug.created_at DESC;

-- 5. Check if there are any errors in the group creation
SELECT 
  'Error Check' as check_type,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM user_groups WHERE name = 'admin_recommended') THEN 'Group not created'
    WHEN NOT EXISTS (SELECT 1 FROM user_group_permissions ugp JOIN user_groups ug ON ugp.user_group_id = ug.id WHERE ug.name = 'admin_recommended') THEN 'Group created but no permissions'
    ELSE 'Group and permissions exist'
  END as status;
