-- DEBUG: Why NULL project permissions are not included
-- ตรวจสอบ: ทำไม permissions ที่มี project_id = NULL ไม่ถูกรวม

-- Step 1: Check if the function is actually updated
SELECT 
  'DEBUG - Check Function Definition' as info,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'get_user_aggregated_permissions'
  AND routine_schema = 'public';

-- Step 2: Test the function step by step
-- First, check what the function actually returns
SELECT 
  'DEBUG - Function Step by Step' as info,
  ugp.module,
  ugp.project_id,
  p.name as project_name,
  ugp.can_access,
  ugp.can_view
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ug.is_active = true
ORDER BY ugp.module, ugp.project_id;

-- Step 3: Check if there are any filters in the function
-- Let's see what happens when we run the exact query from the function
SELECT 
  'DEBUG - Function Query Test' as info,
  ugp.module,
  BOOL_OR(ugp.can_access) as can_access,
  BOOL_OR(ugp.can_view) as can_view,
  BOOL_OR(ugp.can_add) as can_add,
  BOOL_OR(ugp.can_edit) as can_edit,
  BOOL_OR(ugp.can_delete) as can_delete
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ug.is_active = true
GROUP BY ugp.module
ORDER BY ugp.module;

-- Step 4: Check if there are any hidden filters
-- Let's check if there are any WHERE conditions that might be filtering out NULL project_id
SELECT 
  'DEBUG - Check for Hidden Filters' as info,
  'All Permissions' as type,
  COUNT(*) as total_count,
  COUNT(DISTINCT ugp.module) as unique_modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ug.is_active = true

UNION ALL

SELECT 
  'DEBUG - Check for Hidden Filters' as info,
  'Non-NULL Project Permissions' as type,
  COUNT(*) as total_count,
  COUNT(DISTINCT ugp.module) as unique_modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ug.is_active = true
  AND ugp.project_id IS NOT NULL

UNION ALL

SELECT 
  'DEBUG - Check for Hidden Filters' as info,
  'NULL Project Permissions' as type,
  COUNT(*) as total_count,
  COUNT(DISTINCT ugp.module) as unique_modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ug.is_active = true
  AND ugp.project_id IS NULL;

-- Step 5: Check if the function is actually being called correctly
SELECT 
  'DEBUG - Function Call Test' as info,
  module,
  can_access,
  can_view
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)
ORDER BY module;
