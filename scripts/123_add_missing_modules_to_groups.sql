-- Add missing modules to user group permissions
-- This script will add the new modules to all existing user groups

SELECT 
  '===== ADDING MISSING MODULES TO USER GROUPS =====' as debug_info;

-- 1. Check current modules in user groups
SELECT 
  'Current Modules Count' as check_type,
  ug.name as group_name,
  ug.display_name,
  COUNT(ugp.module) as module_count
FROM user_groups ug
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
GROUP BY ug.id, ug.name, ug.display_name
ORDER BY ug.display_name;

-- 2. Define missing modules that need to be added
WITH missing_modules AS (
  SELECT 'vendors' as module UNION ALL
  SELECT 'accounts_payable' UNION ALL
  SELECT 'expense_approval' UNION ALL
  SELECT 'expense_reports' UNION ALL
  SELECT 'revenue_journal' UNION ALL
  SELECT 'trial_balance' UNION ALL
  SELECT 'user_management'
),
-- 3. Get all existing user groups
all_groups AS (
  SELECT ug.id, ug.name, ug.display_name
  FROM user_groups ug
  WHERE ug.is_active = true
),
-- 4. Find modules that are missing from each group
missing_permissions AS (
  SELECT 
    ag.id as user_group_id,
    ag.name as group_name,
    ag.display_name,
    mm.module
  FROM all_groups ag
  CROSS JOIN missing_modules mm
  WHERE NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ag.id 
    AND ugp.module = mm.module
  )
)
-- 5. Insert missing permissions for each group
INSERT INTO user_group_permissions (
  user_group_id,
  module,
  can_access,
  can_view,
  can_add,
  can_edit,
  can_delete,
  can_print,
  can_export,
  can_approve,
  can_assign,
  project_id
)
SELECT 
  mp.user_group_id,
  mp.module,
  CASE 
    WHEN mp.group_name = 'manager_group' THEN true
    WHEN mp.group_name = 'accountant' AND mp.module IN ('vendors', 'accounts_payable', 'expense_approval', 'expense_reports', 'revenue_journal', 'trial_balance') THEN true
    WHEN mp.group_name = 'committee' AND mp.module IN ('expense_reports', 'trial_balance') THEN true
    WHEN mp.group_name = 'auditor' AND mp.module IN ('trial_balance') THEN true
    WHEN mp.group_name = 'support_staff' AND mp.module IN ('vendors') THEN true
    ELSE false
  END as can_access,
  CASE 
    WHEN mp.group_name = 'manager_group' THEN true
    WHEN mp.group_name = 'accountant' AND mp.module IN ('vendors', 'accounts_payable', 'expense_approval', 'expense_reports', 'revenue_journal', 'trial_balance') THEN true
    WHEN mp.group_name = 'committee' AND mp.module IN ('expense_reports', 'trial_balance') THEN true
    WHEN mp.group_name = 'auditor' AND mp.module IN ('trial_balance') THEN true
    WHEN mp.group_name = 'support_staff' AND mp.module IN ('vendors') THEN true
    ELSE false
  END as can_view,
  CASE 
    WHEN mp.group_name = 'manager_group' THEN true
    WHEN mp.group_name = 'accountant' AND mp.module IN ('vendors', 'accounts_payable', 'expense_approval', 'revenue_journal') THEN true
    ELSE false
  END as can_add,
  CASE 
    WHEN mp.group_name = 'manager_group' THEN true
    WHEN mp.group_name = 'accountant' AND mp.module IN ('vendors', 'accounts_payable', 'expense_approval', 'revenue_journal') THEN true
    ELSE false
  END as can_edit,
  CASE 
    WHEN mp.group_name = 'manager_group' THEN true
    WHEN mp.group_name = 'accountant' AND mp.module IN ('vendors', 'accounts_payable') THEN true
    ELSE false
  END as can_delete,
  CASE 
    WHEN mp.group_name = 'manager_group' THEN true
    WHEN mp.group_name = 'accountant' AND mp.module IN ('expense_reports', 'trial_balance') THEN true
    WHEN mp.group_name = 'committee' AND mp.module IN ('expense_reports', 'trial_balance') THEN true
    WHEN mp.group_name = 'auditor' AND mp.module IN ('trial_balance') THEN true
    ELSE false
  END as can_print,
  CASE 
    WHEN mp.group_name = 'manager_group' THEN true
    WHEN mp.group_name = 'accountant' AND mp.module IN ('expense_reports', 'trial_balance') THEN true
    WHEN mp.group_name = 'committee' AND mp.module IN ('expense_reports', 'trial_balance') THEN true
    WHEN mp.group_name = 'auditor' AND mp.module IN ('trial_balance') THEN true
    ELSE false
  END as can_export,
  CASE 
    WHEN mp.group_name = 'manager_group' THEN true
    WHEN mp.group_name = 'accountant' AND mp.module = 'expense_approval' THEN true
    ELSE false
  END as can_approve,
  false as can_assign,
  NULL::uuid as project_id
FROM missing_permissions mp;

-- 6. Verify the additions
SELECT 
  'After Adding Missing Modules' as check_type,
  ug.name as group_name,
  ug.display_name,
  COUNT(ugp.module) as total_modules,
  COUNT(CASE WHEN ugp.module IN ('vendors', 'accounts_payable', 'expense_approval', 'expense_reports', 'revenue_journal', 'trial_balance', 'user_management') THEN 1 END) as new_modules_count
FROM user_groups ug
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.is_active = true
GROUP BY ug.id, ug.name, ug.display_name
ORDER BY ug.display_name;

-- 7. Show specific new modules for each group
SELECT 
  'New Modules Added' as check_type,
  ug.name as group_name,
  ug.display_name,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit,
  ugp.can_delete,
  ugp.can_print,
  ugp.can_export,
  ugp.can_approve
FROM user_groups ug
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.is_active = true
  AND ugp.module IN ('vendors', 'accounts_payable', 'expense_approval', 'expense_reports', 'revenue_journal', 'trial_balance', 'user_management')
ORDER BY ug.display_name, ugp.module;
