-- Fix user_group_members table by adding unique constraint (using real data)
-- แก้ไข table user_group_members โดยเพิ่ม unique constraint (ใช้ข้อมูลจริง)

-- Step 1: Check for duplicate records first
SELECT 
  'Duplicate Records Check' as info,
  user_group_id,
  user_id,
  COUNT(*) as count
FROM user_group_members
GROUP BY user_group_id, user_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 2: Remove duplicate records (keep the latest one)
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_group_id, user_id 
      ORDER BY created_at DESC, id DESC
    ) as rn
  FROM user_group_members
)
DELETE FROM user_group_members 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 3: Add unique constraint
ALTER TABLE user_group_members 
ADD CONSTRAINT unique_user_group_membership 
UNIQUE (user_group_id, user_id);

-- Step 4: Verify the constraint was added
SELECT 
  'New Constraints' as info,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_group_members'
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name, kcu.ordinal_position;

-- Step 5: Get a real user group ID for testing
SELECT 
  'Real User Group ID' as info,
  id as group_id,
  name as group_name
FROM user_groups
WHERE is_active = true
LIMIT 1;

-- Step 6: Test the constraint with real data
-- First, let's get a real user group ID and user ID
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

-- Step 7: Clean up test record (if it was created)
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
