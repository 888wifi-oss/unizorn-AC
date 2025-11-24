-- Comprehensive test for menu and project access
-- This script tests both menu visibility and project access

SELECT 
  '===== COMPREHENSIVE TEST FOR MENU AND PROJECT ACCESS =====' as test_info;

-- Test user: 00000000-0000-0000-0000-000000000003 (Staff role)

-- 1. Test menu visibility logic
SELECT 
  'Menu Visibility Test' as test_type,
  'Staff Role (Level 3)' as user_role,
  'Super Admin Group (minLevel: 6)' as group_name,
  CASE WHEN 3 < 6 THEN 'HIDDEN' ELSE 'VISIBLE' END as should_be,
  'Companies' as items;

SELECT 
  'Menu Visibility Test' as test_type,
  'Staff Role (Level 3)' as user_role,
  'System Group (minLevel: 4)' as group_name,
  CASE WHEN 3 < 4 THEN 'HIDDEN' ELSE 'VISIBLE' END as should_be,
  'Projects, User Management, User Groups, API' as items;

SELECT 
  'Menu Visibility Test' as test_type,
  'Staff Role (Level 3)' as user_role,
  'Main Menu Group (minLevel: 3)' as group_name,
  CASE WHEN 3 < 3 THEN 'HIDDEN' ELSE 'VISIBLE' END as should_be,
  'Dashboard, Units, Team Management, Announcements, Maintenance, Resident Accounts, Notifications, Parcels, Parcel Reports, Files' as items;

SELECT 
  'Menu Visibility Test' as test_type,
  'Staff Role (Level 3)' as user_role,
  'Revenue Group (minLevel: 3)' as group_name,
  CASE WHEN 3 < 3 THEN 'HIDDEN' ELSE 'VISIBLE' END as should_be,
  'Billing, Payments, Revenue, Accounts Receivable' as items;

SELECT 
  'Menu Visibility Test' as test_type,
  'Staff Role (Level 3)' as user_role,
  'Reports Group (minLevel: 3)' as group_name,
  CASE WHEN 3 < 3 THEN 'HIDDEN' ELSE 'VISIBLE' END as should_be,
  'Revenue Budget, Expense Budget, Budget Report, Revenue Reports, Financial Statements, Reports' as items;

SELECT 
  'Menu Visibility Test' as test_type,
  'Staff Role (Level 3)' as user_role,
  'Expenses Group (minLevel: 4)' as group_name,
  CASE WHEN 3 < 4 THEN 'HIDDEN' ELSE 'VISIBLE' END as should_be,
  'Expenses' as items;

SELECT 
  'Menu Visibility Test' as test_type,
  'Staff Role (Level 3)' as user_role,
  'Accounting Group (minLevel: 4)' as group_name,
  CASE WHEN 3 < 4 THEN 'HIDDEN' ELSE 'VISIBLE' END as should_be,
  'Fixed Assets, Depreciation, Chart of Accounts, Journal Vouchers, General Ledger' as items;

SELECT 
  'Menu Visibility Test' as test_type,
  'Staff Role (Level 3)' as user_role,
  'Advanced Group (minLevel: 4)' as group_name,
  CASE WHEN 3 < 4 THEN 'HIDDEN' ELSE 'VISIBLE' END as should_be,
  'Analytics, Automation, Theme Settings' as items;

-- 2. Test project access logic
SELECT 
  'Project Access Test' as test_type,
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
WHERE p.is_active = true
ORDER BY p.name;

-- 3. Summary
SELECT 
  'SUMMARY' as test_type,
  'Staff user should see:' as expected_result,
  'Main Menu (10 items), Revenue (4 items), Reports (6 items) = 20 total menu items' as menu_items,
  'Only projects where user has direct access or company access via staff role' as project_access;
