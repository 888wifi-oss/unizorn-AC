-- Test Role Level Logic
-- This script tests the role level mapping used in protected-sidebar.tsx

SELECT 
  '===== TEST ROLE LEVEL LOGIC =====' as test_info;

-- 1. Check role levels in database
SELECT 
  'Database Role Levels' as test_type,
  r.name as role_name,
  r.level as db_level,
  CASE 
    WHEN r.name = 'super_admin' THEN 6
    WHEN r.name = 'company_admin' THEN 5
    WHEN r.name = 'project_admin' THEN 4
    WHEN r.name = 'staff' THEN 3
    WHEN r.name = 'engineer' THEN 3
    WHEN r.name = 'resident' THEN 2
    ELSE 2
  END as frontend_level,
  CASE 
    WHEN r.level = CASE 
      WHEN r.name = 'super_admin' THEN 6
      WHEN r.name = 'company_admin' THEN 5
      WHEN r.name = 'project_admin' THEN 4
      WHEN r.name = 'staff' THEN 3
      WHEN r.name = 'engineer' THEN 3
      WHEN r.name = 'resident' THEN 2
      ELSE 2
    END THEN 'MATCH'
    ELSE 'MISMATCH'
  END as level_match
FROM roles r
ORDER BY r.level DESC;

-- 2. Test menu group visibility logic
SELECT 
  'Menu Group Visibility Test' as test_type,
  'Super Admin' as group_name,
  6 as min_role_level,
  CASE 
    WHEN 6 >= 6 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as super_admin_visibility,
  CASE 
    WHEN 5 >= 6 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as company_admin_visibility,
  CASE 
    WHEN 4 >= 6 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as project_admin_visibility,
  CASE 
    WHEN 3 >= 6 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as staff_visibility,
  CASE 
    WHEN 2 >= 6 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as resident_visibility;

SELECT 
  'Menu Group Visibility Test' as test_type,
  'System' as group_name,
  4 as min_role_level,
  CASE 
    WHEN 6 >= 4 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as super_admin_visibility,
  CASE 
    WHEN 5 >= 4 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as company_admin_visibility,
  CASE 
    WHEN 4 >= 4 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as project_admin_visibility,
  CASE 
    WHEN 3 >= 4 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as staff_visibility,
  CASE 
    WHEN 2 >= 4 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as resident_visibility;

SELECT 
  'Menu Group Visibility Test' as test_type,
  'Main Menu' as group_name,
  3 as min_role_level,
  CASE 
    WHEN 6 >= 3 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as super_admin_visibility,
  CASE 
    WHEN 5 >= 3 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as company_admin_visibility,
  CASE 
    WHEN 4 >= 3 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as project_admin_visibility,
  CASE 
    WHEN 3 >= 3 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as staff_visibility,
  CASE 
    WHEN 2 >= 3 THEN 'VISIBLE'
    ELSE 'HIDDEN'
  END as resident_visibility;

-- 3. Test specific user (Staff role)
SELECT 
  'User Role Test' as test_type,
  '00000000-0000-0000-0000-000000000003' as user_id,
  'staff' as user_role,
  3 as user_role_level,
  CASE 
    WHEN 3 >= 6 THEN 'YES'
    ELSE 'NO'
  END as can_see_super_admin,
  CASE 
    WHEN 3 >= 4 THEN 'YES'
    ELSE 'NO'
  END as can_see_system,
  CASE 
    WHEN 3 >= 3 THEN 'YES'
    ELSE 'NO'
  END as can_see_main_menu,
  CASE 
    WHEN 3 >= 4 THEN 'YES'
    ELSE 'NO'
  END as can_see_expenses,
  CASE 
    WHEN 3 >= 4 THEN 'YES'
    ELSE 'NO'
  END as can_see_accounting,
  CASE 
    WHEN 3 >= 4 THEN 'YES'
    ELSE 'NO'
  END as can_see_advanced;

-- 4. Expected menu groups for Staff role
SELECT 
  'Expected Menu Groups for Staff' as test_type,
  'Main Menu (minLevel: 3)' as group_name,
  'YES' as visible,
  'Dashboard, Units, Team Management, Announcements, Maintenance, Resident Accounts, Notifications, Parcels, Parcel Reports, Files' as items;

SELECT 
  'Expected Menu Groups for Staff' as test_type,
  'Revenue (minLevel: 3)' as group_name,
  'YES' as visible,
  'Billing, Payments, Revenue, Accounts Receivable' as items;

SELECT 
  'Expected Menu Groups for Staff' as test_type,
  'Reports (minLevel: 3)' as group_name,
  'YES' as visible,
  'Revenue Budget, Expense Budget, Budget Report, Revenue Reports, Financial Statements, Reports' as items;

SELECT 
  'Expected Menu Groups for Staff' as test_type,
  'Super Admin (minLevel: 6)' as group_name,
  'NO' as visible,
  'Companies' as items;

SELECT 
  'Expected Menu Groups for Staff' as test_type,
  'System (minLevel: 4)' as group_name,
  'NO' as visible,
  'Projects, User Management, User Groups, API' as items;

SELECT 
  'Expected Menu Groups for Staff' as test_type,
  'Expenses (minLevel: 4)' as group_name,
  'NO' as visible,
  'Expenses' as items;

SELECT 
  'Expected Menu Groups for Staff' as test_type,
  'Accounting (minLevel: 4)' as group_name,
  'NO' as visible,
  'Fixed Assets, Depreciation, Chart of Accounts, Journal Vouchers, General Ledger' as items;

SELECT 
  'Expected Menu Groups for Staff' as test_type,
  'Advanced (minLevel: 4)' as group_name,
  'NO' as visible,
  'Analytics, Automation, Theme Settings' as items;
