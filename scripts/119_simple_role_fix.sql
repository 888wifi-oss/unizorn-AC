-- Simple and safe role fix script
-- This script will fix the role issues without using is_active column

SELECT 
  '===== SIMPLE ROLE FIX =====' as debug_info;

-- 1. Check current roles
SELECT 
  'Current Roles' as check_type,
  r.id,
  r.name,
  r.display_name,
  r.level
FROM roles r
ORDER BY r.level DESC;

-- 2. Check if staff role exists, if not create it
INSERT INTO roles (id, name, display_name, level, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'staff',
  'เจ้าหน้าที่',
  3,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'staff');

-- 3. Check if resident role exists, if not create it
INSERT INTO roles (id, name, display_name, level, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'resident',
  'ผู้อยู่อาศัย',
  2,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'resident');

-- 4. Update manager_group to use staff role
UPDATE user_groups 
SET role_id = (SELECT id FROM roles WHERE name = 'staff' LIMIT 1),
    updated_at = NOW()
WHERE name = 'manager_group';

-- 5. Verify the fix
SELECT 
  'Verification' as check_type,
  ug.name as group_name,
  ug.display_name,
  r.name as role_name,
  r.display_name as role_display_name,
  r.level as role_level
FROM user_groups ug
LEFT JOIN roles r ON ug.role_id = r.id
WHERE ug.name = 'manager_group';

-- 6. Test role lookup (same as createPredefinedGroup function)
SELECT 
  'Role Lookup Test' as check_type,
  r.id,
  r.name,
  r.display_name,
  r.level
FROM roles r
WHERE r.name = 'staff';

-- 7. Show all groups
SELECT 
  'All Groups' as check_type,
  ug.name as group_name,
  ug.display_name,
  r.name as role_name,
  r.level as role_level
FROM user_groups ug
LEFT JOIN roles r ON ug.role_id = r.id
ORDER BY ug.display_name;
