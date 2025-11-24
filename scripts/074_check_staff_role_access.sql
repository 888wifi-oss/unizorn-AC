-- Check Staff role and user roles
-- ตรวจสอบ Role Staff และ user roles

-- Step 1: Check Staff role definition
SELECT 
  'Staff Role Definition' as info,
  id,
  name,
  display_name,
  level,
  is_active
FROM roles
WHERE name = 'staff'
ORDER BY level;

-- Step 2: Check user roles for Staff
SELECT 
  'User Roles for Staff' as info,
  ur.id as role_id,
  r.name as role_name,
  r.level as role_level,
  ur.user_id,
  ur.company_id,
  ur.project_id,
  ur.is_active,
  u.email,
  u.full_name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN users u ON ur.user_id = u.id
WHERE r.name = 'staff'
  AND ur.is_active = true
ORDER BY ur.created_at DESC;

-- Step 3: Check specific user with Staff role
SELECT 
  'Specific User Staff Role' as info,
  ur.id as role_id,
  r.name as role_name,
  r.level as role_level,
  ur.user_id,
  ur.company_id,
  ur.project_id,
  ur.is_active,
  u.email,
  u.full_name,
  p.name as project_name,
  c.name as company_name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN users u ON ur.user_id = u.id
LEFT JOIN projects p ON ur.project_id = p.id
LEFT JOIN companies c ON ur.company_id = c.id
WHERE ur.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ur.is_active = true
ORDER BY r.level;

-- Step 4: Test getUserAccessibleProjects logic for Staff
WITH staff_user_roles AS (
  SELECT 
    ur.project_id,
    ur.company_id,
    r.name as role_name,
    r.level as role_level
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
    AND ur.is_active = true
),
accessible_projects AS (
  SELECT DISTINCT p.id as project_id, p.name as project_name
  FROM staff_user_roles sur
  JOIN projects p ON (
    (sur.project_id = p.id) OR 
    (sur.role_name = 'company_admin' AND sur.company_id = p.company_id)
  )
  WHERE p.is_active = true
)
SELECT 
  'Accessible Projects for Staff User' as info,
  project_id,
  project_name
FROM accessible_projects
ORDER BY project_name;
