-- Check user_group_permissions table structure
-- ตรวจสอบโครงสร้างตาราง user_group_permissions

-- Step 1: Check user_group_permissions table structure
SELECT 
  'user_group_permissions Table Structure' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_group_permissions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 2: Check if project_id column exists in user_group_permissions
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

-- Step 3: Sample data from user_group_permissions
SELECT 
  'Sample user_group_permissions Data' as info,
  user_group_id,
  module,
  project_id,
  can_access,
  can_view
FROM user_group_permissions
LIMIT 10;

-- Step 4: Check if there are any permissions with project_id
SELECT 
  'Permissions with Project ID' as info,
  COUNT(*) as total_permissions,
  COUNT(project_id) as permissions_with_project_id,
  COUNT(*) - COUNT(project_id) as permissions_without_project_id
FROM user_group_permissions;
