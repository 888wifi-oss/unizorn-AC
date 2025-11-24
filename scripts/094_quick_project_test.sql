-- Quick test for project access issue
-- This script tests why projects are not showing

SELECT 
  '===== QUICK TEST FOR PROJECT ACCESS ISSUE =====' as test_info;

-- Test user: 00000000-0000-0000-0000-000000000003 (Staff role)

-- 1. Check user roles
SELECT 
  'User Roles Check' as test_type,
  ur.user_id,
  ur.project_id,
  ur.company_id,
  r.name as role_name,
  r.level as role_level,
  ur.is_active,
  p.name as project_name,
  c.name as company_name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
LEFT JOIN projects p ON ur.project_id = p.id
LEFT JOIN companies c ON ur.company_id = c.id
WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
  AND ur.is_active = true
ORDER BY r.level;

-- 2. Check if user has any project access
SELECT 
  'Project Access Check' as test_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND ur.is_active = true
        AND (ur.project_id IS NOT NULL OR ur.company_id IS NOT NULL)
    ) THEN 'User has project/company access'
    ELSE 'User has NO project/company access'
  END as result;

-- 3. Check specific projects user should see
SELECT 
  'Projects User Should See' as test_type,
  p.id,
  p.name,
  p.company_id,
  c.name as company_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND ur.project_id = p.id
        AND ur.is_active = true
    ) THEN 'Direct Project Access'
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND ur.company_id = p.company_id
        AND r.name IN ('company_admin', 'project_admin', 'staff')
        AND ur.is_active = true
    ) THEN 'Company Access'
    ELSE 'No Access'
  END as access_method
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.is_active = true
ORDER BY p.name;

-- 4. Count accessible projects
SELECT 
  'Accessible Projects Count' as test_type,
  COUNT(*) as total_accessible_projects
FROM projects p
WHERE p.is_active = true
  AND (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND ur.project_id = p.id
        AND ur.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND ur.company_id = p.company_id
        AND r.name IN ('company_admin', 'project_admin', 'staff')
        AND ur.is_active = true
    )
  );
