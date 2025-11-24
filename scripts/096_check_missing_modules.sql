-- Check missing modules in User Group permissions
-- This script will identify which modules are missing from User Group permissions

SELECT 
  '===== MISSING MODULES CHECK =====' as debug_info;

-- 1. Get all modules that should exist (from menu groups)
SELECT 
  'Expected Modules' as check_type,
  'companies' as module UNION ALL
SELECT 'Expected Modules', 'projects' UNION ALL
SELECT 'Expected Modules', 'users' UNION ALL
SELECT 'Expected Modules', 'user_groups' UNION ALL
SELECT 'Expected Modules', 'api' UNION ALL
SELECT 'Expected Modules', 'dashboard' UNION ALL
SELECT 'Expected Modules', 'units' UNION ALL
SELECT 'Expected Modules', 'team_management' UNION ALL
SELECT 'Expected Modules', 'announcements' UNION ALL
SELECT 'Expected Modules', 'maintenance' UNION ALL
SELECT 'Expected Modules', 'resident_accounts' UNION ALL
SELECT 'Expected Modules', 'notifications' UNION ALL
SELECT 'Expected Modules', 'parcels' UNION ALL
SELECT 'Expected Modules', 'parcel_reports' UNION ALL
SELECT 'Expected Modules', 'files' UNION ALL
SELECT 'Expected Modules', 'billing' UNION ALL
SELECT 'Expected Modules', 'payments' UNION ALL
SELECT 'Expected Modules', 'revenue' UNION ALL
SELECT 'Expected Modules', 'accounts_receivable' UNION ALL
SELECT 'Expected Modules', 'expenses' UNION ALL
SELECT 'Expected Modules', 'fixed_assets' UNION ALL
SELECT 'Expected Modules', 'depreciation' UNION ALL
SELECT 'Expected Modules', 'chart_of_accounts' UNION ALL
SELECT 'Expected Modules', 'journal_vouchers' UNION ALL
SELECT 'Expected Modules', 'general_ledger' UNION ALL
SELECT 'Expected Modules', 'revenue_budget' UNION ALL
SELECT 'Expected Modules', 'expense_budget' UNION ALL
SELECT 'Expected Modules', 'budget_report' UNION ALL
SELECT 'Expected Modules', 'revenue_reports' UNION ALL
SELECT 'Expected Modules', 'financial_statements' UNION ALL
SELECT 'Expected Modules', 'reports' UNION ALL
SELECT 'Expected Modules', 'analytics' UNION ALL
SELECT 'Expected Modules', 'automation' UNION ALL
SELECT 'Expected Modules', 'theme_settings'
ORDER BY module;

-- 2. Get modules that exist in User Group permissions
SELECT 
  'Existing Modules' as check_type,
  ugp.module
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
JOIN user_group_members ugm ON ug.id = ugm.user_group_id
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true
ORDER BY ugp.module;

-- 3. Find missing modules (using subquery instead of CTE)
SELECT 
  'Missing Modules' as check_type,
  expected.module,
  'NOT FOUND' as status
FROM (
  SELECT 'companies' as module UNION ALL
  SELECT 'projects' UNION ALL
  SELECT 'users' UNION ALL
  SELECT 'user_groups' UNION ALL
  SELECT 'api' UNION ALL
  SELECT 'dashboard' UNION ALL
  SELECT 'units' UNION ALL
  SELECT 'team_management' UNION ALL
  SELECT 'announcements' UNION ALL
  SELECT 'maintenance' UNION ALL
  SELECT 'resident_accounts' UNION ALL
  SELECT 'notifications' UNION ALL
  SELECT 'parcels' UNION ALL
  SELECT 'parcel_reports' UNION ALL
  SELECT 'files' UNION ALL
  SELECT 'billing' UNION ALL
  SELECT 'payments' UNION ALL
  SELECT 'revenue' UNION ALL
  SELECT 'accounts_receivable' UNION ALL
  SELECT 'expenses' UNION ALL
  SELECT 'fixed_assets' UNION ALL
  SELECT 'depreciation' UNION ALL
  SELECT 'chart_of_accounts' UNION ALL
  SELECT 'journal_vouchers' UNION ALL
  SELECT 'general_ledger' UNION ALL
  SELECT 'revenue_budget' UNION ALL
  SELECT 'expense_budget' UNION ALL
  SELECT 'budget_report' UNION ALL
  SELECT 'revenue_reports' UNION ALL
  SELECT 'financial_statements' UNION ALL
  SELECT 'reports' UNION ALL
  SELECT 'analytics' UNION ALL
  SELECT 'automation' UNION ALL
  SELECT 'theme_settings'
) expected
LEFT JOIN (
  SELECT DISTINCT ugp.module
  FROM user_group_permissions ugp
  JOIN user_groups ug ON ugp.user_group_id = ug.id
  JOIN user_group_members ugm ON ug.id = ugm.user_group_id
  WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
    AND ugm.is_active = true
    AND ug.is_active = true
) existing ON expected.module = existing.module
WHERE existing.module IS NULL
ORDER BY expected.module;

-- 4. Summary count
SELECT 
  'Summary' as check_type,
  'Expected Modules' as type,
  35 as count

UNION ALL

SELECT 
  'Summary' as check_type,
  'Existing Modules' as type,
  COUNT(*) as count
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
JOIN user_group_members ugm ON ug.id = ugm.user_group_id
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true;
