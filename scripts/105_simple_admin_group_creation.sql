-- Simple creation of admin recommended group
-- This script will create the group step by step

SELECT 
  '===== SIMPLE ADMIN GROUP CREATION =====' as debug_info;

-- 1. First, check if group already exists and delete if it does
DELETE FROM user_group_permissions 
WHERE user_group_id IN (
  SELECT id FROM user_groups 
  WHERE name = 'admin_recommended' 
    OR display_name = 'แอดมิน'
);

DELETE FROM user_groups 
WHERE name = 'admin_recommended' 
  OR display_name = 'แอดมิน';

-- 2. Create the group
INSERT INTO user_groups (
  id,
  name,
  display_name,
  description,
  role_id,
  company_id,
  is_active,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'admin_recommended',
  'แอดมิน',
  'กลุ่มผู้ดูแลระบบที่มีสิทธิ์เข้าถึงทุกโมดูลยกเว้นการจัดการระบบหลัก',
  (SELECT id FROM roles WHERE name = 'staff' LIMIT 1),
  NULL,
  true,
  NOW(),
  NOW()
);

-- 3. Get the group ID
SELECT 
  'Group Created' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  r.name as base_role
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
WHERE ug.name = 'admin_recommended';

-- 4. Add permissions one by one
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
  ug.id,
  'api',
  true, true, true, true, true, true, true, false, false, NULL::uuid::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'dashboard',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'units',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'team_management',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'announcements',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'maintenance',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'resident_accounts',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'notifications',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'parcels',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'parcel_reports',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'files',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'billing',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'payments',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'revenue',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'accounts_receivable',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'expenses',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'fixed_assets',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'depreciation',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'chart_of_accounts',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'journal_vouchers',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'general_ledger',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'revenue_budget',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'expense_budget',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'budget_report',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'revenue_reports',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'financial_statements',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'reports',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'analytics',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'automation',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'theme_settings',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'user_management',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'revenue_journal',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'expense_approval',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'expense_reports',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'trial_balance',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended'

UNION ALL

SELECT 
  ug.id,
  'vendors',
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug WHERE ug.name = 'admin_recommended';

-- 5. Verify the final result
SELECT 
  'Final Verification' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  COUNT(ugp.module) as module_count
FROM user_groups ug
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.name = 'admin_recommended'
GROUP BY ug.id, ug.name, ug.display_name;
