-- Debug: Why only 19 modules instead of 30
-- ตรวจสอบว่าทำไมแสดงแค่ 19 โมดูลแทนที่จะเป็น 30 โมดูล

-- Step 1: Check total permissions in user groups (all projects)
SELECT 
  'Total Permissions in All Groups' as info,
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

-- Step 2: Check current function result
SELECT 
  'Current Function Result (19 modules)' as info,
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

-- Step 3: Check if there are permissions with project_id = NULL
SELECT 
  'Permissions with NULL project_id' as info,
  ug.name as group_name,
  COUNT(ugp.module) as null_project_modules,
  STRING_AGG(ugp.module, ', ' ORDER BY ugp.module) as modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ugp.project_id IS NULL
GROUP BY ug.name
ORDER BY ug.name;

-- Step 4: Check if there are permissions with different project_id
SELECT 
  'Permissions with Different project_id' as info,
  ug.name as group_name,
  ugp.project_id,
  p.name as project_name,
  COUNT(ugp.module) as other_project_modules,
  STRING_AGG(ugp.module, ', ' ORDER BY ugp.module) as modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ugp.project_id IS NOT NULL
GROUP BY ug.name, ugp.project_id, p.name
ORDER BY ug.name, p.name;

-- Step 5: Check if there are duplicate modules across different projects
SELECT 
  'Duplicate Modules Across Projects' as info,
  ugp.module,
  COUNT(DISTINCT ugp.project_id) as project_count,
  STRING_AGG(DISTINCT p.name, ', ' ORDER BY p.name) as projects
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
GROUP BY ugp.module
HAVING COUNT(DISTINCT ugp.project_id) > 1
ORDER BY ugp.module;

-- Step 6: Check if there are modules that are not being aggregated properly
SELECT 
  'Modules Not Being Aggregated' as info,
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
  AND ugp.module NOT IN (
    SELECT module FROM get_user_aggregated_permissions(
      '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
      '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
    )
  )
ORDER BY ugp.module, p.name;

-- Step 7: Count total unique modules
SELECT 
  'Total Unique Modules Count' as info,
  COUNT(DISTINCT ugp.module) as total_unique_modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true;
