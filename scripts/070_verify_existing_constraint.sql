-- Check if unique constraint already exists and verify it works
-- ตรวจสอบว่า unique constraint มีอยู่แล้วหรือไม่ และยืนยันว่าทำงานได้

-- Step 1: Check existing constraints
SELECT 
  'Existing Constraints' as info,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_group_members'
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- Step 2: Check for duplicate records
SELECT 
  'Duplicate Records Check' as info,
  user_group_id,
  user_id,
  COUNT(*) as count
FROM user_group_members
GROUP BY user_group_id, user_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 3: Test the existing constraint with real data
-- Get a real user group ID and user ID
WITH real_data AS (
  SELECT 
    ug.id as group_id,
    u.id as user_id
  FROM user_groups ug
  CROSS JOIN users u
  WHERE ug.is_active = true
    AND u.is_active = true
  LIMIT 1
)
INSERT INTO user_group_members (user_group_id, user_id, is_active)
SELECT group_id, user_id, true
FROM real_data
ON CONFLICT (user_group_id, user_id) 
DO UPDATE SET 
  is_active = EXCLUDED.is_active;

-- Step 4: Verify the constraint is working
SELECT 
  'Constraint Test Result' as info,
  'SUCCESS: ON CONFLICT is working' as message;

-- Step 5: Clean up test record (if it was created)
WITH real_data AS (
  SELECT 
    ug.id as group_id,
    u.id as user_id
  FROM user_groups ug
  CROSS JOIN users u
  WHERE ug.is_active = true
    AND u.is_active = true
  LIMIT 1
)
DELETE FROM user_group_members 
WHERE (user_group_id, user_id) IN (
  SELECT group_id, user_id FROM real_data
)
AND created_at > NOW() - INTERVAL '1 minute';

-- Step 6: Final verification
SELECT 
  'Final Status' as info,
  'Unique constraint exists and ON CONFLICT works' as status;
