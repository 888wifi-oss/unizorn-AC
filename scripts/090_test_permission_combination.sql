-- Test Role + User Group permissions combination
-- This script tests the permission merging logic

SELECT 
  '===== TEST ROLE + USER GROUP PERMISSIONS COMBINATION =====' as test_info;

-- Test user: 00000000-0000-0000-0000-000000000003 (Staff role)

-- 1. Get Role-based permissions
SELECT 
  'Role-based Permissions' as test_type,
  r.name as role_name,
  r.level as role_level,
  p.name as permission_name,
  p.module as module_name
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
  AND ur.is_active = true
ORDER BY r.level, p.module;

-- 2. Get User Group permissions
SELECT 
  'User Group Permissions' as test_type,
  ug.name as group_name,
  ugp.module as module_name,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit,
  ugp.can_delete,
  ugp.project_id
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '00000000-0000-0000-0000-000000000003'
  AND ugm.is_active = true
  AND ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307'
ORDER BY ug.name, ugp.module;

-- 3. Simulate permission merging logic
WITH role_modules AS (
  SELECT DISTINCT p.module
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  JOIN role_permissions rp ON r.id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
    AND ur.is_active = true
),
group_modules AS (
  SELECT DISTINCT ugp.module
  FROM user_group_members ugm
  JOIN user_groups ug ON ugm.user_group_id = ug.id
  JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
  WHERE ugm.user_id = '00000000-0000-0000-0000-000000000003'
    AND ugm.is_active = true
    AND ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307'
    AND (ugp.can_access = true OR ugp.can_view = true)
),
combined_modules AS (
  SELECT module FROM role_modules
  UNION
  SELECT module FROM group_modules
)
SELECT 
  'Combined Permissions' as test_type,
  module,
  CASE 
    WHEN module IN (SELECT module FROM role_modules) THEN 'Role'
    ELSE ''
  END as from_role,
  CASE 
    WHEN module IN (SELECT module FROM group_modules) THEN 'User Group'
    ELSE ''
  END as from_group,
  CASE 
    WHEN module IN (SELECT module FROM role_modules) AND module IN (SELECT module FROM group_modules) THEN 'Both'
    WHEN module IN (SELECT module FROM role_modules) THEN 'Role Only'
    WHEN module IN (SELECT module FROM group_modules) THEN 'User Group Only'
    ELSE 'Unknown'
  END as source
FROM combined_modules
ORDER BY module;

-- 4. Count permissions
WITH role_modules AS (
  SELECT DISTINCT p.module
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  JOIN role_permissions rp ON r.id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
    AND ur.is_active = true
),
group_modules AS (
  SELECT DISTINCT ugp.module
  FROM user_group_members ugm
  JOIN user_groups ug ON ugm.user_group_id = ug.id
  JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
  WHERE ugm.user_id = '00000000-0000-0000-0000-000000000003'
    AND ugm.is_active = true
    AND ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307'
    AND (ugp.can_access = true OR ugp.can_view = true)
)
SELECT 
  'Permission Counts' as test_type,
  (SELECT COUNT(*) FROM role_modules) as role_module_count,
  (SELECT COUNT(*) FROM group_modules) as group_module_count,
  (SELECT COUNT(*) FROM (
    SELECT module FROM role_modules
    UNION
    SELECT module FROM group_modules
  ) combined) as total_unique_count;

-- 5. Check specific modules that should be visible for Staff
SELECT 
  'Staff Module Visibility Check' as test_type,
  module,
  CASE 
    WHEN module IN ('dashboard', 'units', 'team_management', 'announcements', 'maintenance', 
                   'resident_accounts', 'notifications', 'parcels', 'parcel_reports', 'files') THEN 'Main Menu (minLevel: 3) - VISIBLE'
    WHEN module IN ('billing', 'payments', 'revenue', 'accounts_receivable') THEN 'Revenue (minLevel: 3) - VISIBLE'
    WHEN module IN ('revenue_budget', 'expense_budget', 'budget_report', 'revenue_reports', 
                   'financial_statements', 'reports') THEN 'Reports (minLevel: 3) - VISIBLE'
    WHEN module IN ('expenses', 'expense_approval', 'expense_reports') THEN 'Expenses (minLevel: 4) - HIDDEN for Staff'
    WHEN module IN ('fixed_assets', 'depreciation', 'chart_of_accounts', 'journal_vouchers', 
                   'general_ledger', 'trial_balance') THEN 'Accounting (minLevel: 4) - HIDDEN for Staff'
    WHEN module IN ('analytics', 'automation', 'theme_settings') THEN 'Advanced (minLevel: 4) - HIDDEN for Staff'
    WHEN module IN ('projects', 'user_management', 'user_groups', 'api') THEN 'System (minLevel: 4) - HIDDEN for Staff'
    WHEN module IN ('companies') THEN 'Super Admin (minLevel: 6) - HIDDEN for Staff'
    ELSE 'Unknown Group'
  END as visibility_status
FROM (
  SELECT DISTINCT p.module
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  JOIN role_permissions rp ON r.id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
    AND ur.is_active = true
  
  UNION
  
  SELECT DISTINCT ugp.module
  FROM user_group_members ugm
  JOIN user_groups ug ON ugm.user_group_id = ug.id
  JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
  WHERE ugm.user_id = '00000000-0000-0000-0000-000000000003'
    AND ugm.is_active = true
    AND ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307'
    AND (ugp.can_access = true OR ugp.can_view = true)
) all_modules
ORDER BY module;
