-- Check user_group_members table structure and constraints
-- ตรวจสอบโครงสร้าง table user_group_members และ constraints

-- Step 1: Check table structure
SELECT 
  'Table Structure' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_group_members'
ORDER BY ordinal_position;

-- Step 2: Check constraints
SELECT 
  'Constraints' as info,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  tc.is_deferrable,
  tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_group_members'
ORDER BY tc.constraint_type, kcu.ordinal_position;

-- Step 3: Check indexes
SELECT 
  'Indexes' as info,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'user_group_members'
ORDER BY indexname;

-- Step 4: Check if there's a unique constraint on user_group_id, user_id
SELECT 
  'Unique Check' as info,
  COUNT(*) as duplicate_count
FROM user_group_members
GROUP BY user_group_id, user_id
HAVING COUNT(*) > 1;
