-- NEW APPROACH: Check REAL data first
-- แนวทางใหม่: ตรวจสอบข้อมูลจริงก่อน

-- Step 1: Check if user actually has 30 modules in database
SELECT 
  'REAL DATA CHECK - User Group Memberships' as info,
  ug.name as group_name,
  ugm.is_active as membership_active,
  ug.is_active as group_active
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa';

-- Step 2: Check REAL permissions count in database
SELECT 
  'REAL DATA CHECK - Total Permissions Count' as info,
  COUNT(*) as total_permissions,
  COUNT(DISTINCT ugp.module) as unique_modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ug.is_active = true;

-- Step 3: Check if user group actually has 30 modules
SELECT 
  'REAL DATA CHECK - Group Permissions' as info,
  ug.name as group_name,
  COUNT(ugp.module) as module_count,
  STRING_AGG(ugp.module, ', ' ORDER BY ugp.module) as modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ug.is_active = true
GROUP BY ug.name;

-- Step 4: Check if there are missing permissions
SELECT 
  'REAL DATA CHECK - Missing Permissions' as info,
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
ORDER BY ugp.module, p.name;

-- Step 5: Check if user group has the right permissions
SELECT 
  'REAL DATA CHECK - User Group Details' as info,
  ug.id,
  ug.name,
  ug.display_name,
  ug.is_active,
  ug.company_id
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true;

-- Step 6: Check if the issue is in the function or data
SELECT 
  'REAL DATA CHECK - Function vs Data' as info,
  'Database Count' as source,
  COUNT(DISTINCT ugp.module) as module_count
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ug.is_active = true

UNION ALL

SELECT 
  'REAL DATA CHECK - Function vs Data' as info,
  'Function Count' as source,
  COUNT(*) as module_count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
);
