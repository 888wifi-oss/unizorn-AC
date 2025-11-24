-- Test getUserAccessibleProjects function
-- This script tests the logic used in getUserAccessibleProjects

-- Test user: 00000000-0000-0000-0000-000000000003 (Staff role)
-- Expected: Should only see projects that user has access to

SELECT 
  '===== TEST USER ACCESSIBLE PROJECTS =====' as test_info;

-- 1. Check user roles
SELECT 
  'User Roles' as test_type,
  ur.user_id,
  ur.project_id,
  ur.company_id,
  r.name as role_name,
  r.level as role_level,
  ur.is_active
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
  AND ur.is_active = true
ORDER BY r.level;

-- 2. Check all projects
SELECT 
  'All Projects' as test_type,
  p.id,
  p.name,
  p.company_id,
  p.is_active,
  c.name as company_name
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.is_active = true
ORDER BY p.name;

-- 3. Check projects user should have access to (based on roles)
SELECT 
  'Projects User Should Access' as test_type,
  p.id,
  p.name,
  p.company_id,
  c.name as company_name,
  ur.role_id,
  r.name as role_name,
  r.level as role_level
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN user_roles ur ON (
  ur.project_id = p.id OR 
  (ur.company_id = p.company_id AND ur.project_id IS NULL)
)
LEFT JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
  AND ur.is_active = true
  AND p.is_active = true
ORDER BY p.name;

-- 4. Check if user is super admin
SELECT 
  'Super Admin Check' as test_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND r.name = 'super_admin'
        AND ur.is_active = true
    ) THEN 'YES'
    ELSE 'NO'
  END as is_super_admin;

-- 5. Check company admin access
SELECT 
  'Company Admin Check' as test_type,
  ur.company_id,
  c.name as company_name,
  r.name as role_name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
LEFT JOIN companies c ON ur.company_id = c.id
WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
  AND r.name = 'company_admin'
  AND ur.is_active = true;

-- 6. Check project admin access
SELECT 
  'Project Admin Check' as test_type,
  ur.project_id,
  ur.company_id,
  p.name as project_name,
  c.name as company_name,
  r.name as role_name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
LEFT JOIN projects p ON ur.project_id = p.id
LEFT JOIN companies c ON ur.company_id = c.id
WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
  AND r.name = 'project_admin'
  AND ur.is_active = true;

-- 7. Check staff access
SELECT 
  'Staff Access Check' as test_type,
  ur.project_id,
  ur.company_id,
  p.name as project_name,
  c.name as company_name,
  r.name as role_name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
LEFT JOIN projects p ON ur.project_id = p.id
LEFT JOIN companies c ON ur.company_id = c.id
WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
  AND r.name = 'staff'
  AND ur.is_active = true;

-- 8. Final result - projects user should see
SELECT 
  'FINAL RESULT - Projects User Should See' as test_type,
  p.id,
  p.name,
  p.company_id,
  c.name as company_name,
  'Access via: ' || COALESCE(
    CASE 
      WHEN ur.project_id = p.id THEN 'Direct Project Role'
      WHEN ur.company_id = p.company_id AND ur.project_id IS NULL THEN 'Company Role'
      ELSE 'No Access'
    END, 'No Access'
  ) as access_method
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
LEFT JOIN user_roles ur ON (
  ur.project_id = p.id OR 
  (ur.company_id = p.company_id AND ur.project_id IS NULL)
)
LEFT JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
  AND ur.is_active = true
  AND p.is_active = true
GROUP BY p.id, p.name, p.company_id, c.name, ur.project_id, ur.company_id
ORDER BY p.name;
