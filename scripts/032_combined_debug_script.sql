-- Combined Debug Script: Check Table Structure and Permission Discrepancy
-- รวมทุกการตรวจสอบไว้ในไฟล์เดียว

-- ===========================
-- PART 1: Check Table Structure
-- ===========================

-- Step 1: Check user_group_members table structure
SELECT 
  'user_group_members Table Structure' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_group_members' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check user_group_permissions table structure
SELECT 
  'user_group_permissions Table Structure' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_group_permissions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 3: Check if project_id column exists in user_group_permissions
SELECT 
  'project_id Column Check' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'user_group_permissions' 
        AND column_name = 'project_id'
        AND table_schema = 'public'
    ) THEN 'EXISTS' 
    ELSE 'NOT EXISTS' 
  END as project_id_status;

-- ===========================
-- PART 2: Check Data
-- ===========================

-- Step 4: Sample data from user_group_permissions
SELECT 
  'Sample user_group_permissions Data' as info,
  user_group_id,
  module,
  project_id,
  can_access,
  can_view
FROM user_group_permissions
LIMIT 10;

-- Step 5: Check if there are any permissions with project_id
SELECT 
  'Permissions with Project ID' as info,
  COUNT(*) as total_permissions,
  COUNT(project_id) as permissions_with_project_id,
  COUNT(*) - COUNT(project_id) as permissions_without_project_id
FROM user_group_permissions;

-- ===========================
-- PART 3: Check User Data
-- ===========================

-- Step 6: Check user group memberships for the specific user
SELECT 
  'User Group Memberships' as info,
  ug.name as group_name,
  ug.company_id,
  c.name as company_name,
  ugm.is_active
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
LEFT JOIN companies c ON ug.company_id = c.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
ORDER BY ug.name;

-- Step 7: Check total permissions in user groups (all projects)
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

-- Step 8: Check permissions for specific project (95ae2a41-cc9e-45d0-8dfc-38b635c06457)
-- Note: This will only work if user_group_permissions has project_id column
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

-- Step 9: Test the database function directly
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

-- Step 10: Check all projects available
SELECT 
  'Available Projects' as info,
  id,
  name,
  is_active
FROM projects
WHERE is_active = true
ORDER BY name;
