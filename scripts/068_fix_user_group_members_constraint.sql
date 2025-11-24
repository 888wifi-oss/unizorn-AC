-- Fix user_group_members table by adding unique constraint
-- แก้ไข table user_group_members โดยเพิ่ม unique constraint

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

-- Step 5: Test the constraint
INSERT INTO user_group_members (user_group_id, user_id, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', true)
ON CONFLICT (user_group_id, user_id) 
DO UPDATE SET 
  is_active = EXCLUDED.is_active;

-- Clean up test record
DELETE FROM user_group_members 
WHERE user_group_id = '00000000-0000-0000-0000-000000000001' 
  AND user_id = '00000000-0000-0000-0000-000000000001';
