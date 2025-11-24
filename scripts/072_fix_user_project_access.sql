-- Check user project access and fix permissions
-- ตรวจสอบสิทธิ์การเข้าถึงโครงการและแก้ไข permissions

-- Step 1: Get all user roles for this user
SELECT 
  'All User Roles' as info,
  ur.id as role_id,
  r.name as role_name,
  r.level as role_level,
  ur.company_id,
  ur.project_id,
  ur.is_active,
  c.name as company_name,
  p.name as project_name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
LEFT JOIN companies c ON ur.company_id = c.id
LEFT JOIN projects p ON ur.project_id = p.id
WHERE ur.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
ORDER BY r.level DESC, ur.is_active DESC;

-- Step 2: Check if user has any role in the specific project
SELECT 
  'Project Specific Roles' as info,
  ur.id as role_id,
  r.name as role_name,
  r.level as role_level,
  ur.is_active
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ur.project_id = '95ae2a41-cc9e-45d0-8dfc-38b635c06457'
ORDER BY r.level DESC;

-- Step 3: Check if user is company admin for this project's company
SELECT 
  'Company Admin Check' as info,
  ur.id as role_id,
  r.name as role_name,
  ur.company_id,
  c.name as company_name,
  ur.is_active
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN companies c ON ur.company_id = c.id
WHERE ur.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND r.name = 'company_admin'
  AND ur.company_id = (
    SELECT company_id FROM projects 
    WHERE id = '95ae2a41-cc9e-45d0-8dfc-38b635c06457'
  )
ORDER BY ur.is_active DESC;

-- Step 4: Get project and company info
SELECT 
  'Project Info' as info,
  p.id as project_id,
  p.name as project_name,
  p.company_id,
  c.name as company_name
FROM projects p
JOIN companies c ON p.company_id = c.id
WHERE p.id = '95ae2a41-cc9e-45d0-8dfc-38b635c06457';

-- Step 5: Add project admin role for this user (if needed)
-- First check if user already has project_admin role
SELECT 
  'Existing Project Admin Role' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
        AND r.name = 'project_admin'
        AND ur.project_id = '95ae2a41-cc9e-45d0-8dfc-38b635c06457'
        AND ur.is_active = true
    ) THEN 'ALREADY HAS PROJECT ADMIN ROLE'
    ELSE 'NEEDS PROJECT ADMIN ROLE'
  END as project_admin_status;

-- Step 6: Add project admin role if needed
INSERT INTO user_roles (user_id, role_id, project_id, is_active)
SELECT 
  '386ac5d5-d486-41ee-875f-5e543f2e6efa' as user_id,
  r.id as role_id,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457' as project_id,
  true as is_active
FROM roles r
WHERE r.name = 'project_admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
      AND ur.role_id = r.id
      AND ur.project_id = '95ae2a41-cc9e-45d0-8dfc-38b635c06457'
  );

-- Step 7: Verify the fix
SELECT 
  'After Adding Role' as info,
  ur.id as role_id,
  r.name as role_name,
  r.level as role_level,
  ur.project_id,
  ur.is_active
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ur.project_id = '95ae2a41-cc9e-45d0-8dfc-38b635c06457'
ORDER BY r.level DESC;
