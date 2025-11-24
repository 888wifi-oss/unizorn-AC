-- Test getUserAccessibleProjects function for Staff user
-- This script simulates the getUserAccessibleProjects logic

SELECT 
  '===== TEST getUserAccessibleProjects FOR STAFF USER =====' as test_info;

-- Test user: 00000000-0000-0000-0000-000000000003 (Staff role)

-- 1. Check if user is super admin
SELECT 
  'Super Admin Check' as test_type,
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

-- 2. Get user's roles
SELECT 
  'User Roles' as test_type,
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

-- 3. Simulate getUserAccessibleProjects logic
WITH accessible_projects AS (
  -- Step 1: Check if super admin (if yes, return all projects)
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
      -- Step 2: Get projects based on user roles
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
  END as project_ids
)
SELECT 
  'Accessible Project IDs' as test_type,
  project_ids,
  array_length(project_ids, 1) as project_count
FROM accessible_projects;

-- 4. Show actual projects user should see
WITH accessible_projects AS (
  SELECT array_agg(DISTINCT p.id) as project_ids FROM (
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
SELECT 
  'Projects User Should See' as test_type,
  p.id,
  p.name,
  p.company_id,
  c.name as company_name,
  p.is_active,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
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
CROSS JOIN accessible_projects ap
WHERE p.id = ANY(ap.project_ids)
ORDER BY p.name;

-- 5. Check if ABCD project should be visible
SELECT 
  'ABCD Project Check' as test_type,
  p.id,
  p.name,
  p.company_id,
  c.name as company_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM user_roles ur
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
