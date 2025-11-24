-- Check user_group_permissions table structure
-- This script will show the table structure and constraints

SELECT 
  '===== CHECKING USER_GROUP_PERMISSIONS TABLE STRUCTURE =====' as debug_info;

-- 1. Show table structure
SELECT 
  'Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'user_group_permissions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Show constraints
SELECT 
  'Constraints' as check_type,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  tc.is_deferrable,
  tc.initially_deferred
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_group_permissions' 
  AND tc.table_schema = 'public'
ORDER BY tc.constraint_name;

-- 3. Show indexes
SELECT 
  'Indexes' as check_type,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'user_group_permissions' 
  AND schemaname = 'public'
ORDER BY indexname;
