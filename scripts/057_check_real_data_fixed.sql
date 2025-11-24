-- NEW APPROACH: Check REAL data first (Fixed)
-- แนวทางใหม่: ตรวจสอบข้อมูลจริงก่อน (แก้ไขแล้ว)

-- Step 1: Check if user actually has group memberships
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

-- Step 3: Check if user group actually has modules
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

-- Step 4: Check all permissions details
SELECT 
  'REAL DATA CHECK - All Permissions Details' as info,
  ug.name as group_name,
  ugp.module,
  ugp.project_id,
  p.name as project_name,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit,
  ugp.can_delete
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ug.is_active = true
ORDER BY ug.name, ugp.module, p.name;

-- Step 5: Check user group details
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

-- Step 6: Compare database count vs function count
SELECT 
  'REAL DATA CHECK - Database vs Function' as info,
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
  'REAL DATA CHECK - Database vs Function' as info,
  'Function Count' as source,
  COUNT(*) as module_count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
);

-- Step 7: Check if there are permissions with NULL project_id
SELECT 
  'REAL DATA CHECK - NULL Project Permissions' as info,
  COUNT(*) as null_project_count,
  COUNT(DISTINCT ugp.module) as null_project_modules,
  STRING_AGG(DISTINCT ugp.module, ', ' ORDER BY ugp.module) as modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ug.is_active = true
  AND ugp.project_id IS NULL;
