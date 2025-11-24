-- Check roles in database to fix "Role not found" error
-- This script will identify the issue with role lookup

SELECT 
  '===== CHECKING ROLES IN DATABASE =====' as debug_info;

-- 1. Check all roles in the system
SELECT 
  'All Roles' as check_type,
  r.id,
  r.name,
  r.display_name,
  r.level,
  r.created_at
FROM roles r
ORDER BY r.level DESC, r.name;

-- 2. Check if 'staff' role exists
SELECT 
  'Staff Role Check' as check_type,
  CASE 
    WHEN EXISTS (SELECT 1 FROM roles WHERE name = 'staff') THEN 'EXISTS'
    ELSE 'NOT FOUND'
  END as status,
  r.id,
  r.name,
  r.display_name,
  r.level
FROM roles r
WHERE r.name = 'staff';

-- 3. Check all role names (case sensitive)
SELECT 
  'Role Names (Case Sensitive)' as check_type,
  r.name,
  LENGTH(r.name) as name_length,
  ASCII(SUBSTRING(r.name, 1, 1)) as first_char_ascii
FROM roles r
ORDER BY r.name;

-- 4. Check if there are any similar role names
SELECT 
  'Similar Role Names' as check_type,
  r.name,
  r.display_name,
  r.level
FROM roles r
WHERE LOWER(r.name) LIKE '%staff%' 
   OR LOWER(r.name) LIKE '%employee%'
   OR LOWER(r.name) LIKE '%worker%'
ORDER BY r.name;

-- 5. Check the manager_group configuration
SELECT 
  'Manager Group Configuration' as check_type,
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

-- 6. Show all user groups and their roles
SELECT 
  'All User Groups and Roles' as check_type,
  ug.name as group_name,
  ug.display_name as group_display_name,
  r.name as role_name,
  r.display_name as role_display_name,
  r.level as role_level
FROM user_groups ug
LEFT JOIN roles r ON ug.role_id = r.id
ORDER BY ug.display_name;
