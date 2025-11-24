-- Debug missing menu items
-- This script checks which menu items are missing (39 modules vs 33 menus)

SELECT 
  '===== DEBUG MISSING MENU ITEMS =====' as debug_info;

-- 1. Check all modules in getUserAggregatedPermissions result
SELECT 
  'Modules from getUserAggregatedPermissions' as debug_type,
  module,
  can_access,
  can_view,
  can_add,
  can_edit,
  can_delete,
  can_print,
  can_export,
  can_approve,
  can_assign
FROM user_group_permissions ugp
JOIN user_group_members ugm ON ugp.user_group_id = ugm.user_group_id
WHERE ugm.user_id = '00000000-0000-0000-0000-000000000003'
  AND ugm.is_active = true
  AND ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307'
ORDER BY module;

-- 2. Check menu groups and their minRoleLevel
SELECT 
  'Menu Groups Analysis' as debug_type,
  'Super Admin' as group_name,
  6 as min_role_level,
  'Companies' as items,
  CASE WHEN 3 < 6 THEN 'HIDDEN' ELSE 'VISIBLE' END as visibility_for_staff;

SELECT 
  'Menu Groups Analysis' as debug_type,
  'System' as group_name,
  4 as min_role_level,
  'Projects, User Management, User Groups, API' as items,
  CASE WHEN 3 < 4 THEN 'HIDDEN' ELSE 'VISIBLE' END as visibility_for_staff;

SELECT 
  'Menu Groups Analysis' as debug_type,
  'Main Menu' as group_name,
  3 as min_role_level,
  'Dashboard, Units, Team Management, Announcements, Maintenance, Resident Accounts, Notifications, Parcels, Parcel Reports, Files' as items,
  CASE WHEN 3 < 3 THEN 'HIDDEN' ELSE 'VISIBLE' END as visibility_for_staff;

SELECT 
  'Menu Groups Analysis' as debug_type,
  'Revenue' as group_name,
  3 as min_role_level,
  'Billing, Payments, Revenue, Accounts Receivable' as items,
  CASE WHEN 3 < 3 THEN 'HIDDEN' ELSE 'VISIBLE' END as visibility_for_staff;

SELECT 
  'Menu Groups Analysis' as debug_type,
  'Expenses' as group_name,
  4 as min_role_level,
  'Expenses' as items,
  CASE WHEN 3 < 4 THEN 'HIDDEN' ELSE 'VISIBLE' END as visibility_for_staff;

SELECT 
  'Menu Groups Analysis' as debug_type,
  'Accounting' as group_name,
  4 as min_role_level,
  'Fixed Assets, Depreciation, Chart of Accounts, Journal Vouchers, General Ledger' as items,
  CASE WHEN 3 < 4 THEN 'HIDDEN' ELSE 'VISIBLE' END as visibility_for_staff;

SELECT 
  'Menu Groups Analysis' as debug_type,
  'Reports' as group_name,
  3 as min_role_level,
  'Revenue Budget, Expense Budget, Budget Report, Revenue Reports, Financial Statements, Reports' as items,
  CASE WHEN 3 < 3 THEN 'HIDDEN' ELSE 'VISIBLE' END as visibility_for_staff;

SELECT 
  'Menu Groups Analysis' as debug_type,
  'Advanced' as group_name,
  4 as min_role_level,
  'Analytics, Automation, Theme Settings' as items,
  CASE WHEN 3 < 4 THEN 'HIDDEN' ELSE 'VISIBLE' END as visibility_for_staff;

-- 3. Count expected visible menu items for Staff role
SELECT 
  'Expected Menu Count for Staff' as debug_type,
  'Main Menu' as group_name,
  10 as item_count,
  'Dashboard, Units, Team Management, Announcements, Maintenance, Resident Accounts, Notifications, Parcels, Parcel Reports, Files' as items;

SELECT 
  'Expected Menu Count for Staff' as debug_type,
  'Revenue' as group_name,
  4 as item_count,
  'Billing, Payments, Revenue, Accounts Receivable' as items;

SELECT 
  'Expected Menu Count for Staff' as debug_type,
  'Reports' as group_name,
  6 as item_count,
  'Revenue Budget, Expense Budget, Budget Report, Revenue Reports, Financial Statements, Reports' as items;

-- 4. Total expected count
SELECT 
  'TOTAL EXPECTED COUNT' as debug_type,
  20 as total_expected_menus,
  'Main Menu (10) + Revenue (4) + Reports (6) = 20' as calculation;

-- 5. Check if there are additional modules that should be visible
SELECT 
  'Additional Modules Check' as debug_type,
  module,
  'Should be visible if in User Group permissions' as note
FROM user_group_permissions ugp
JOIN user_group_members ugm ON ugp.user_group_id = ugm.user_group_id
WHERE ugm.user_id = '00000000-0000-0000-0000-000000000003'
  AND ugm.is_active = true
  AND ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307'
  AND (ugp.can_access = true OR ugp.can_view = true)
  AND module NOT IN (
    'dashboard', 'units', 'team_management', 'announcements', 'maintenance', 
    'resident_accounts', 'notifications', 'parcels', 'parcel_reports', 'files',
    'billing', 'payments', 'revenue', 'accounts_receivable',
    'revenue_budget', 'expense_budget', 'budget_report', 'revenue_reports', 
    'financial_statements', 'reports'
  )
ORDER BY module;

-- 6. Check if missing modules are in hidden groups
SELECT 
  'Missing Modules Analysis' as debug_type,
  module,
  CASE 
    WHEN module IN ('expenses', 'expense_approval', 'expense_reports') THEN 'Expenses Group (minLevel: 4) - HIDDEN for Staff'
    WHEN module IN ('fixed_assets', 'depreciation', 'chart_of_accounts', 'journal_vouchers', 'general_ledger', 'trial_balance') THEN 'Accounting Group (minLevel: 4) - HIDDEN for Staff'
    WHEN module IN ('analytics', 'automation', 'theme_settings') THEN 'Advanced Group (minLevel: 4) - HIDDEN for Staff'
    WHEN module IN ('projects', 'user_management', 'user_groups', 'api') THEN 'System Group (minLevel: 4) - HIDDEN for Staff'
    WHEN module IN ('companies') THEN 'Super Admin Group (minLevel: 6) - HIDDEN for Staff'
    ELSE 'Unknown Group'
  END as group_analysis
FROM user_group_permissions ugp
JOIN user_group_members ugm ON ugp.user_group_id = ugm.user_group_id
WHERE ugm.user_id = '00000000-0000-0000-0000-000000000003'
  AND ugm.is_active = true
  AND ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307'
  AND (ugp.can_access = true OR ugp.can_view = true)
  AND module NOT IN (
    'dashboard', 'units', 'team_management', 'announcements', 'maintenance', 
    'resident_accounts', 'notifications', 'parcels', 'parcel_reports', 'files',
    'billing', 'payments', 'revenue', 'accounts_receivable',
    'revenue_budget', 'expense_budget', 'budget_report', 'revenue_reports', 
    'financial_statements', 'reports'
  )
ORDER BY module;
