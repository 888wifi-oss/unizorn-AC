-- Check user_group_permissions table structure
-- ตรวจสอบโครงสร้าง table user_group_permissions

-- Step 1: Check table structure
SELECT 
  'Table Structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_group_permissions'
ORDER BY ordinal_position;

-- Step 2: Check sample data
SELECT 
  'Sample Data' as info,
  *
FROM user_group_permissions
LIMIT 3;
