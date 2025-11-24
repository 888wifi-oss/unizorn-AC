-- Check missing pages and menu mapping
-- This script will identify which menu items don't have corresponding pages

SELECT 
  '===== CHECKING MISSING PAGES =====' as debug_info;

-- 1. List all modules that should have pages based on menuGroups
WITH expected_modules AS (
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
),
-- 2. List all existing pages based on file structure
existing_pages AS (
  SELECT 'companies' as page UNION ALL
  SELECT 'projects' UNION ALL
  SELECT 'user-management' UNION ALL
  SELECT 'user-groups' UNION ALL
  SELECT 'api-management' UNION ALL
  SELECT 'dashboard' UNION ALL
  SELECT 'units' UNION ALL
  SELECT 'team-management' UNION ALL
  SELECT 'announcements' UNION ALL
  SELECT 'maintenance' UNION ALL
  SELECT 'resident-accounts' UNION ALL
  SELECT 'notifications' UNION ALL
  SELECT 'parcels' UNION ALL
  SELECT 'parcels/reports' UNION ALL
  SELECT 'file-management' UNION ALL
  SELECT 'billing' UNION ALL
  SELECT 'payments' UNION ALL
  SELECT 'revenue' UNION ALL
  SELECT 'accounts-receivable' UNION ALL
  SELECT 'expenses' UNION ALL
  SELECT 'fixed-assets' UNION ALL
  SELECT 'depreciation' UNION ALL
  SELECT 'chart-of-accounts' UNION ALL
  SELECT 'journal-vouchers' UNION ALL
  SELECT 'general-ledger' UNION ALL
  SELECT 'revenue-budget' UNION ALL
  SELECT 'expense-budget' UNION ALL
  SELECT 'budget-report' UNION ALL
  SELECT 'revenue-reports' UNION ALL
  SELECT 'financial-statements' UNION ALL
  SELECT 'reports' UNION ALL
  SELECT 'analytics' UNION ALL
  SELECT 'automation' UNION ALL
  SELECT 'theme-settings'
)
-- 3. Find missing pages
SELECT 
  'Missing Pages Analysis' as check_type,
  em.module,
  CASE 
    WHEN ep.page IS NULL THEN 'MISSING PAGE'
    ELSE 'PAGE EXISTS'
  END as status,
  CASE 
    WHEN em.module = 'companies' THEN '/companies'
    WHEN em.module = 'projects' THEN '/projects'
    WHEN em.module = 'users' THEN '/user-management'
    WHEN em.module = 'user_groups' THEN '/user-groups'
    WHEN em.module = 'api' THEN '/api-management'
    WHEN em.module = 'dashboard' THEN '/'
    WHEN em.module = 'units' THEN '/units'
    WHEN em.module = 'team_management' THEN '/team-management'
    WHEN em.module = 'announcements' THEN '/announcements'
    WHEN em.module = 'maintenance' THEN '/maintenance'
    WHEN em.module = 'resident_accounts' THEN '/resident-accounts'
    WHEN em.module = 'notifications' THEN '/notifications'
    WHEN em.module = 'parcels' THEN '/parcels'
    WHEN em.module = 'parcel_reports' THEN '/parcels/reports'
    WHEN em.module = 'files' THEN '/file-management'
    WHEN em.module = 'billing' THEN '/billing'
    WHEN em.module = 'payments' THEN '/payments'
    WHEN em.module = 'revenue' THEN '/revenue'
    WHEN em.module = 'accounts_receivable' THEN '/accounts-receivable'
    WHEN em.module = 'expenses' THEN '/expenses'
    WHEN em.module = 'fixed_assets' THEN '/fixed-assets'
    WHEN em.module = 'depreciation' THEN '/depreciation'
    WHEN em.module = 'chart_of_accounts' THEN '/chart-of-accounts'
    WHEN em.module = 'journal_vouchers' THEN '/journal-vouchers'
    WHEN em.module = 'general_ledger' THEN '/general-ledger'
    WHEN em.module = 'revenue_budget' THEN '/revenue-budget'
    WHEN em.module = 'expense_budget' THEN '/expense-budget'
    WHEN em.module = 'budget_report' THEN '/budget-report'
    WHEN em.module = 'revenue_reports' THEN '/revenue-reports'
    WHEN em.module = 'financial_statements' THEN '/financial-statements'
    WHEN em.module = 'reports' THEN '/reports'
    WHEN em.module = 'analytics' THEN '/analytics'
    WHEN em.module = 'automation' THEN '/automation'
    WHEN em.module = 'theme_settings' THEN '/theme-settings'
    ELSE 'UNKNOWN'
  END as expected_path
FROM expected_modules em
LEFT JOIN existing_pages ep ON (
  CASE 
    WHEN em.module = 'companies' THEN ep.page = 'companies'
    WHEN em.module = 'projects' THEN ep.page = 'projects'
    WHEN em.module = 'users' THEN ep.page = 'user-management'
    WHEN em.module = 'user_groups' THEN ep.page = 'user-groups'
    WHEN em.module = 'api' THEN ep.page = 'api-management'
    WHEN em.module = 'dashboard' THEN ep.page = 'dashboard'
    WHEN em.module = 'units' THEN ep.page = 'units'
    WHEN em.module = 'team_management' THEN ep.page = 'team-management'
    WHEN em.module = 'announcements' THEN ep.page = 'announcements'
    WHEN em.module = 'maintenance' THEN ep.page = 'maintenance'
    WHEN em.module = 'resident_accounts' THEN ep.page = 'resident-accounts'
    WHEN em.module = 'notifications' THEN ep.page = 'notifications'
    WHEN em.module = 'parcels' THEN ep.page = 'parcels'
    WHEN em.module = 'parcel_reports' THEN ep.page = 'parcels/reports'
    WHEN em.module = 'files' THEN ep.page = 'file-management'
    WHEN em.module = 'billing' THEN ep.page = 'billing'
    WHEN em.module = 'payments' THEN ep.page = 'payments'
    WHEN em.module = 'revenue' THEN ep.page = 'revenue'
    WHEN em.module = 'accounts_receivable' THEN ep.page = 'accounts-receivable'
    WHEN em.module = 'expenses' THEN ep.page = 'expenses'
    WHEN em.module = 'fixed_assets' THEN ep.page = 'fixed-assets'
    WHEN em.module = 'depreciation' THEN ep.page = 'depreciation'
    WHEN em.module = 'chart_of_accounts' THEN ep.page = 'chart-of-accounts'
    WHEN em.module = 'journal_vouchers' THEN ep.page = 'journal-vouchers'
    WHEN em.module = 'general_ledger' THEN ep.page = 'general-ledger'
    WHEN em.module = 'revenue_budget' THEN ep.page = 'revenue-budget'
    WHEN em.module = 'expense_budget' THEN ep.page = 'expense-budget'
    WHEN em.module = 'budget_report' THEN ep.page = 'budget-report'
    WHEN em.module = 'revenue_reports' THEN ep.page = 'revenue-reports'
    WHEN em.module = 'financial_statements' THEN ep.page = 'financial-statements'
    WHEN em.module = 'reports' THEN ep.page = 'reports'
    WHEN em.module = 'analytics' THEN ep.page = 'analytics'
    WHEN em.module = 'automation' THEN ep.page = 'automation'
    WHEN em.module = 'theme_settings' THEN ep.page = 'theme-settings'
    ELSE false
  END
)
ORDER BY status, em.module;
