-- Debug getUserAccessibleProjects for Staff user
-- This script debugs why projects are not filtered correctly

SELECT 
  '===== DEBUG PROJECT ACCESS FOR STAFF USER =====' as debug_info;

-- 1. Check user roles for staff user
SELECT 
  'User Roles Check' as debug_type,
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

-- 2. Check all projects
SELECT 
  'All Projects' as debug_type,
  p.id,
  p.name,
  p.company_id,
  p.is_active,
  c.name as company_name
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.is_active = true
ORDER BY p.name;

-- 3. Check projects user should have access to (simulate getUserAccessibleProjects logic)
WITH user_accessible_projects AS (
  -- Super Admin check
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND r.name = 'super_admin'
        AND ur.is_active = true
    ) THEN (
      SELECT array_agg(p.id) FROM projects p WHERE p.is_active = true
    )
    ELSE (
      -- Get projects based on user roles
      SELECT array_agg(DISTINCT p.id) FROM (
        -- Direct project access
        SELECT p.id FROM projects p
        JOIN user_roles ur ON ur.project_id = p.id
        WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
          AND ur.is_active = true
          AND p.is_active = true
        
        UNION
        
        -- Company admin access
        SELECT p.id FROM projects p
        JOIN user_roles ur ON ur.company_id = p.company_id
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
          AND r.name = 'company_admin'
          AND ur.is_active = true
          AND p.is_active = true
        
        UNION
        
        -- Project admin access
        SELECT p.id FROM projects p
        JOIN user_roles ur ON ur.company_id = p.company_id
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
          AND r.name = 'project_admin'
          AND ur.is_active = true
          AND p.is_active = true
        
        UNION
        
        -- Staff access
        SELECT p.id FROM projects p
        JOIN user_roles ur ON ur.company_id = p.company_id
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
          AND r.name = 'staff'
          AND ur.is_active = true
          AND p.is_active = true
      ) p
    )
  END as accessible_project_ids
)
SELECT 
  'Accessible Projects' as debug_type,
  accessible_project_ids,
  array_length(accessible_project_ids, 1) as project_count
FROM user_accessible_projects;

-- 4. Check specific project "ABCD" access
SELECT 
  'ABCD Project Access Check' as debug_type,
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
WHERE p.name = 'ABCD' OR p.name ILIKE '%ABCD%';

-- 5. Check if user is super admin
SELECT 
  'Super Admin Check' as debug_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND r.name = 'super_admin'
        AND ur.is_active = true
    ) THEN 'YES - User is Super Admin'
    ELSE 'NO - User is not Super Admin'
  END as is_super_admin;

-- 6. Final result - what projects should be shown
SELECT 
  'FINAL RESULT - Projects to Show' as debug_type,
  p.id,
  p.name,
  p.company_id,
  c.name as company_name,
  'Should be visible' as status
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.is_active = true
  AND (
    -- Direct project access
    EXISTS (
      SELECT 1 FROM user_roles ur
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
    OR
    -- Super admin access
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
        AND r.name = 'super_admin'
        AND ur.is_active = true
    )
  )
ORDER BY p.name;
