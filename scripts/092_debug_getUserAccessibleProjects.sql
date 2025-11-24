-- Debug getUserAccessibleProjects function
-- This script debugs the getUserAccessibleProjects function step by step

SELECT 
  '===== DEBUG getUserAccessibleProjects FUNCTION =====' as debug_info;

-- Test user: 00000000-0000-0000-0000-000000000003 (Staff role)

-- 1. Check if user is super admin
SELECT 
  'Step 1: Super Admin Check' as debug_step,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND r.name = 'super_admin'
        AND ur.is_active = true
    ) THEN 'YES - User is Super Admin (should see all projects)'
    ELSE 'NO - User is not Super Admin (should see limited projects)'
  END as result;

-- 2. Get user's roles
SELECT 
  'Step 2: User Roles' as debug_step,
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

-- 3. Check all projects
SELECT 
  'Step 3: All Projects' as debug_step,
  p.id,
  p.name,
  p.company_id,
  p.is_active,
  c.name as company_name
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.is_active = true
ORDER BY p.name;

-- 4. Simulate getUserAccessibleProjects logic step by step
SELECT 
  'Step 4: Accessible Projects' as debug_step,
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
  AND (
    -- Direct project access
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND ur.project_id = p.id
        AND ur.is_active = true
    )
    OR
    -- Company access (company_admin, project_admin, staff)
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND ur.company_id = p.company_id
        AND r.name IN ('company_admin', 'project_admin', 'staff')
        AND ur.is_active = true
    )
  )
ORDER BY p.name;

-- 5. Check specific project "ABCD" access
SELECT 
  'Step 5: ABCD Project Access' as debug_step,
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
    ) THEN 'Direct Project Access - SHOULD BE VISIBLE'
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND ur.company_id = p.company_id
        AND r.name IN ('company_admin', 'project_admin', 'staff')
        AND ur.is_active = true
    ) THEN 'Company Access - SHOULD BE VISIBLE'
    ELSE 'No Access - SHOULD NOT BE VISIBLE'
  END as access_method
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.name = 'ABCD' OR p.name ILIKE '%ABCD%';

-- 6. Final result - what projects should be shown in dropdown
SELECT 
  'Step 6: Final Result - Projects for Dropdown' as debug_step,
  COUNT(*) as total_projects,
  array_agg(p.name ORDER BY p.name) as project_names
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.is_active = true
  AND (
    -- Direct project access
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND ur.project_id = p.id
        AND ur.is_active = true
    )
    OR
    -- Company access
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND ur.company_id = p.company_id
        AND r.name IN ('company_admin', 'project_admin', 'staff')
        AND ur.is_active = true
    )
  );
