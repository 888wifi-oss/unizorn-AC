-- Debug Permission Discrepancy: 15 modules vs 30 modules
-- ตรวจสอบปัญหาที่แสดง 15 โมดูล แต่ usergroup ผูกไว้ 30 โมดูล

-- Step 1: Check table structure first
SELECT 
  'Table Structure Check' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_group_members' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check user group memberships for the specific user
SELECT 
  'User Group Memberships' as info,
  ug.name as group_name,
  ug.project_id,
  p.name as project_name,
  ugm.is_active
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
LEFT JOIN projects p ON ug.project_id = p.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
ORDER BY ug.name, p.name;

-- Step 3: Check total permissions in user groups (all projects)
SELECT 
  'Total Permissions in Groups' as info,
  ug.name as group_name,
  COUNT(ugp.module) as total_modules,
  STRING_AGG(ugp.module, ', ' ORDER BY ugp.module) as modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
GROUP BY ug.name
ORDER BY ug.name;

-- Step 4: Check permissions for specific project (95ae2a41-cc9e-45d0-8dfc-38b635c06457)
SELECT 
  'Permissions for Project APSH' as info,
  ug.name as group_name,
  COUNT(ugp.module) as project_modules,
  STRING_AGG(ugp.module, ', ' ORDER BY ugp.module) as modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ugp.project_id = '95ae2a41-cc9e-45d0-8dfc-38b635c06457'
GROUP BY ug.name
ORDER BY ug.name;

-- Step 5: Test the database function directly
SELECT 
  'Database Function Result' as info,
  module,
  can_access,
  can_view,
  can_add,
  can_edit,
  can_delete
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)
ORDER BY module;

-- Step 6: Check if there are permissions without project_id (NULL values)
SELECT 
  'Permissions without Project ID' as info,
  ug.name as group_name,
  ugp.module,
  ugp.project_id,
  ugp.can_access
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ugp.project_id IS NULL
ORDER BY ug.name, ugp.module;

-- Step 7: Check all projects available
SELECT 
  'Available Projects' as info,
  id,
  name,
  is_active
FROM projects
WHERE is_active = true
ORDER BY name;

-- Step 8: Check user group permissions structure
SELECT 
  'User Group Permissions Structure' as info,
  ug.name as group_name,
  ugp.project_id,
  p.name as project_name,
  ugp.module,
  ugp.can_access,
  ugp.can_view
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
ORDER BY ug.name, p.name, ugp.module;
