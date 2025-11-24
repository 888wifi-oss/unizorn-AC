-- Final fix for role issues
-- This script will ensure all roles exist and are properly configured

SELECT 
  '===== FINAL ROLE FIX =====' as debug_info;

-- 1. Check all roles
SELECT 
  'All Roles' as check_type,
  r.id,
  r.name,
  r.display_name,
  r.level
FROM roles r
ORDER BY r.level DESC;

-- 2. Ensure 'staff' role exists
INSERT INTO roles (id, name, display_name, level, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'staff',
  'เจ้าหน้าที่',
  3,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'staff');

-- 3. Ensure 'resident' role exists
INSERT INTO roles (id, name, display_name, level, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  'resident',
  'ผู้อยู่อาศัย',
  2,
  NOW(),
  NOW()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'resident');

-- 4. Update manager_group to use correct role
UPDATE user_groups 
SET role_id = (SELECT id FROM roles WHERE name = 'staff' LIMIT 1),
    updated_at = NOW()
WHERE name = 'manager_group'
  AND EXISTS (SELECT 1 FROM roles WHERE name = 'staff');

-- 5. Verify all groups have correct roles
SELECT 
  'Groups with Roles' as check_type,
  ug.name as group_name,
  ug.display_name,
  r.name as role_name,
  r.display_name as role_display_name,
  r.level as role_level
FROM user_groups ug
LEFT JOIN roles r ON ug.role_id = r.id
ORDER BY ug.display_name;

-- 6. Test role lookup (same as in createPredefinedGroup function)
SELECT 
  'Role Lookup Test' as check_type,
  r.id,
  r.name,
  r.display_name,
  r.level
FROM roles r
WHERE r.name = 'staff';

-- 7. Final verification
SELECT 
  'Final Status' as check_type,
  'All roles exist' as roles_status,
  'Manager group configured' as group_status,
  'Ready for creation' as creation_status
FROM roles r
WHERE r.name IN ('staff', 'resident')
  AND EXISTS (
    SELECT 1 FROM user_groups ug 
    WHERE ug.name = 'manager_group' 
    AND ug.role_id = r.id
  );
