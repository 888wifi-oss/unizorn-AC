-- Simple test for Role + User Group permissions combination
-- This script tests the permission merging logic without complex CTEs

SELECT 
  '===== SIMPLE TEST ROLE + USER GROUP PERMISSIONS =====' as test_info;

-- Test user: 00000000-0000-0000-0000-000000000003 (Staff role)

-- 1. Get Role-based permissions count
SELECT 
  'Role-based Permissions Count' as test_type,
  COUNT(DISTINCT p.module) as module_count,
  array_agg(DISTINCT p.module ORDER BY p.module) as modules
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE ur.user_id = '00000000-0000-0000-0000-000000000003'
  AND ur.is_active = true;

-- 2. Get User Group permissions count
SELECT 
  'User Group Permissions Count' as test_type,
  COUNT(DISTINCT ugp.module) as module_count,
  array_agg(DISTINCT ugp.module ORDER BY ugp.module) as modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '00000000-0000-0000-0000-000000000003'
  AND ugm.is_active = true
  AND ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307'
  AND (ugp.can_access = true OR ugp.can_view = true);

-- 3. Get combined permissions (no duplicates)
SELECT 
  'Combined Permissions Count' as test_type,
  COUNT(DISTINCT module) as total_unique_count,
  array_agg(DISTINCT module ORDER BY module) as all_modules
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
) combined;

-- 4. Check specific modules visibility for Staff role
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

-- 5. Summary
SELECT 
  'SUMMARY' as test_type,
  'Staff user should see only modules from Main Menu, Revenue, and Reports groups' as expected_result,
  'Modules from Expenses, Accounting, Advanced, System, and Super Admin should be hidden' as hidden_modules;
