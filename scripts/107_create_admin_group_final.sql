-- Create admin group with correct configuration
-- This script will create the group properly

SELECT 
  '===== CREATING ADMIN GROUP PROPERLY =====' as debug_info;

-- 1. Delete any existing admin groups
DELETE FROM user_group_permissions 
WHERE user_group_id IN (
  SELECT id FROM user_groups 
  WHERE name = 'admin_recommended' 
    OR display_name = 'แอดมิน'
);

DELETE FROM user_groups 
WHERE name = 'admin_recommended' 
  OR display_name = 'แอดมิน';

-- 2. Create the group with proper configuration
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

-- 3. Add all 36 modules at once using a simpler approach
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
  modules.module_name,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  false,
  NULL
FROM user_groups ug,
(VALUES 
  ('api'),
  ('dashboard'),
  ('units'),
  ('team_management'),
  ('announcements'),
  ('maintenance'),
  ('resident_accounts'),
  ('notifications'),
  ('parcels'),
  ('parcel_reports'),
  ('files'),
  ('billing'),
  ('payments'),
  ('revenue'),
  ('accounts_receivable'),
  ('expenses'),
  ('fixed_assets'),
  ('depreciation'),
  ('chart_of_accounts'),
  ('journal_vouchers'),
  ('general_ledger'),
  ('revenue_budget'),
  ('expense_budget'),
  ('budget_report'),
  ('revenue_reports'),
  ('financial_statements'),
  ('reports'),
  ('analytics'),
  ('automation'),
  ('theme_settings'),
  ('user_management'),
  ('revenue_journal'),
  ('expense_approval'),
  ('expense_reports'),
  ('trial_balance'),
  ('vendors')
) AS modules(module_name)
WHERE ug.name = 'admin_recommended';

-- 4. Verify the creation
SELECT 
  'Final Verification' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  r.name as base_role,
  COUNT(ugp.module) as module_count
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.name = 'admin_recommended'
GROUP BY ug.id, ug.name, ug.display_name, ug.description, r.name;

-- 5. Show the modules
SELECT 
  'Modules List' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'admin_recommended'
ORDER BY ugp.module;
