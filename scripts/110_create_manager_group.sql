-- Create admin group with different name
-- This script will create the group with a completely different name

SELECT 
  '===== CREATING ADMIN GROUP WITH DIFFERENT NAME =====' as debug_info;

-- 1. Delete any existing admin groups
DELETE FROM user_group_permissions 
WHERE user_group_id IN (
  SELECT id FROM user_groups 
  WHERE name LIKE '%admin%' 
    OR display_name LIKE '%แอดมิน%'
    OR display_name LIKE '%ผู้ดูแล%'
);

DELETE FROM user_groups 
WHERE name LIKE '%admin%' 
  OR display_name LIKE '%แอดมิน%'
  OR display_name LIKE '%ผู้ดูแล%';

-- 2. Create the group with a completely different name
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
  'full_access_manager',
  'ผู้จัดการระบบ',
  'กลุ่มผู้จัดการระบบที่มีสิทธิ์เข้าถึงทุกโมดูลยกเว้นการจัดการระบบหลัก',
  (SELECT id FROM roles WHERE name = 'staff' LIMIT 1),
  NULL,
  true,
  NOW(),
  NOW()
);

-- 3. Add all 36 modules
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
  (SELECT id FROM user_groups WHERE name = 'full_access_manager'),
  module_name,
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
FROM (VALUES 
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
) AS modules(module_name);

-- 4. Verify the creation
SELECT 
  'Group Created Successfully' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  r.name as base_role,
  COUNT(ugp.module) as module_count
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.name = 'full_access_manager'
GROUP BY ug.id, ug.name, ug.display_name, ug.description, r.name;

-- 5. Show all modules
SELECT 
  'All Modules' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'full_access_manager'
ORDER BY ugp.module;

-- 6. Check if this group will appear in UI
SELECT 
  'UI Display Check' as check_type,
  ug.name,
  ug.display_name,
  ug.is_active,
  r.name as base_role,
  COUNT(ugp.module) as permission_count,
  CASE 
    WHEN ug.is_active = true AND COUNT(ugp.module) >= 30 THEN 'Should appear in UI'
    ELSE 'May not appear in UI'
  END as ui_status
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.name = 'full_access_manager'
GROUP BY ug.id, ug.name, ug.display_name, ug.is_active, r.name;

-- 7. Show all groups for comparison
SELECT 
  'All Groups Comparison' as check_type,
  ug.name,
  ug.display_name,
  ug.description,
  r.name as base_role,
  COUNT(ugp.module) as permission_count,
  ug.is_active
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.is_active = true
GROUP BY ug.id, ug.name, ug.display_name, ug.description, r.name, ug.is_active
ORDER BY ug.created_at DESC;
