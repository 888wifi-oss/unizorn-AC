-- Fix role issues for manager group creation
-- This script will ensure the correct role is used

SELECT 
  '===== FIXING ROLE ISSUES =====' as debug_info;

-- 1. Check what roles are available
SELECT 
  'Available Roles' as check_type,
  r.id,
  r.name,
  r.display_name,
  r.level
FROM roles r
ORDER BY r.level DESC;

-- 2. Update manager_group to use the correct role
-- First, let's see what role should be used
WITH correct_role AS (
  SELECT id FROM roles 
  WHERE name = 'staff'
  LIMIT 1
)
UPDATE user_groups 
SET role_id = (SELECT id FROM correct_role),
    updated_at = NOW()
WHERE name = 'manager_group'
  AND EXISTS (SELECT 1 FROM correct_role);

-- 3. If staff role doesn't exist, try to find alternative
WITH alternative_role AS (
  SELECT id FROM roles 
  WHERE (name = 'staff' OR name = 'employee' OR name = 'worker')
  LIMIT 1
)
UPDATE user_groups 
SET role_id = (SELECT id FROM alternative_role),
    updated_at = NOW()
WHERE name = 'manager_group'
  AND role_id IS NULL
  AND EXISTS (SELECT 1 FROM alternative_role);

-- 4. If still no role, use the first available role
WITH fallback_role AS (
  SELECT id FROM roles 
  ORDER BY level DESC
  LIMIT 1
)
UPDATE user_groups 
SET role_id = (SELECT id FROM fallback_role),
    updated_at = NOW()
WHERE name = 'manager_group'
  AND role_id IS NULL
  AND EXISTS (SELECT 1 FROM fallback_role);

-- 5. Verify the fix
SELECT 
  'Fixed Configuration' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.role_id,
  r.name as role_name,
  r.display_name as role_display_name,
  r.level as role_level
FROM user_groups ug
LEFT JOIN roles r ON ug.role_id = r.id
WHERE ug.name = 'manager_group';

-- 6. Show all groups with their roles
SELECT 
  'All Groups Status' as check_type,
  ug.name as group_name,
  ug.display_name as group_display_name,
  r.name as role_name,
  r.display_name as role_display_name,
  r.level as role_level,
  CASE 
    WHEN r.id IS NULL THEN 'NO ROLE ASSIGNED'
    ELSE 'OK'
  END as status
FROM user_groups ug
LEFT JOIN roles r ON ug.role_id = r.id
ORDER BY ug.display_name;
