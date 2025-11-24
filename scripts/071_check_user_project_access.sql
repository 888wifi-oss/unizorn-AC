-- Check user project access permissions
-- ตรวจสอบสิทธิ์การเข้าถึงโครงการของผู้ใช้

-- Step 1: Get current user info
SELECT 
  'Current User Info' as info,
  u.id as user_id,
  u.email,
  u.full_name
FROM users u
WHERE u.email = 'com-p@example.com'  -- Replace with actual user email
LIMIT 1;

-- Step 2: Check user roles
SELECT 
  'User Roles' as info,
  ur.id as role_id,
  r.name as role_name,
  r.level as role_level,
  ur.company_id,
  ur.project_id,
  ur.is_active
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'  -- Replace with actual user ID
ORDER BY r.level;

-- Step 3: Check project access
SELECT 
  'Project Access Check' as info,
  p.id as project_id,
  p.name as project_name,
  p.company_id,
  c.name as company_name
FROM projects p
JOIN companies c ON p.company_id = c.id
WHERE p.id = '95ae2a41-cc9e-45d0-8dfc-38b635c06457';  -- Replace with actual project ID

-- Step 4: Check if user has access to this project
SELECT 
  'User Project Access' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
        AND ur.project_id = '95ae2a41-cc9e-45d0-8dfc-38b635c06457'
        AND ur.is_active = true
    ) THEN 'HAS ACCESS'
    ELSE 'NO ACCESS'
  END as access_status;

-- Step 5: Check company admin access
SELECT 
  'Company Admin Access' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
        AND r.name = 'company_admin'
        AND ur.company_id = (
          SELECT company_id FROM projects 
          WHERE id = '95ae2a41-cc9e-45d0-8dfc-38b635c06457'
        )
        AND ur.is_active = true
    ) THEN 'HAS COMPANY ADMIN ACCESS'
    ELSE 'NO COMPANY ADMIN ACCESS'
  END as company_admin_status;

-- Step 6: Check super admin access
SELECT 
  'Super Admin Access' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
        AND r.name = 'super_admin'
        AND ur.is_active = true
    ) THEN 'HAS SUPER ADMIN ACCESS'
    ELSE 'NO SUPER ADMIN ACCESS'
  END as super_admin_status;
