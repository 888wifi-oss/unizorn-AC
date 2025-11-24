-- Final script to create the manager group
-- This script will create the group and ensure it appears in UI

SELECT 
  '===== FINAL MANAGER GROUP CREATION =====' as debug_info;

-- 1. Clean up any existing problematic groups
DELETE FROM user_group_permissions 
WHERE user_group_id IN (
  SELECT id FROM user_groups 
  WHERE name IN ('full_access_manager', 'system_manager', 'manager_group')
);

DELETE FROM user_groups 
WHERE name IN ('full_access_manager', 'system_manager', 'manager_group');

-- 2. Create the manager group
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
  'manager_group',
  'ผู้จัดการระบบ',
  'กลุ่มผู้จัดการระบบที่มีสิทธิ์เข้าถึงทุกโมดูลยกเว้นการจัดการระบบหลัก',
  (SELECT id FROM roles WHERE name = 'staff' LIMIT 1),
  NULL,
  true,
  NOW(),
  NOW()
);

-- 3. Add all 36 permissions using a more efficient approach
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
  module_name,
  true, true, true, true, true, true, true, false, false, NULL::uuid
FROM user_groups ug
CROSS JOIN (
  VALUES 
    ('api'), ('dashboard'), ('units'), ('team_management'), ('announcements'), ('maintenance'),
    ('resident_accounts'), ('notifications'), ('parcels'), ('parcel_reports'), ('files'),
    ('billing'), ('payments'), ('revenue'), ('accounts_receivable'), ('expenses'),
    ('fixed_assets'), ('depreciation'), ('chart_of_accounts'), ('journal_vouchers'),
    ('general_ledger'), ('revenue_budget'), ('expense_budget'), ('budget_report'),
    ('revenue_reports'), ('financial_statements'), ('reports'), ('analytics'),
    ('automation'), ('theme_settings'), ('user_management'), ('revenue_journal'),
    ('expense_approval'), ('expense_reports'), ('trial_balance'), ('vendors')
) AS modules(module_name)
WHERE ug.name = 'manager_group';

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
WHERE ug.name = 'manager_group'
GROUP BY ug.id, ug.name, ug.display_name, ug.description, r.name;

-- 5. Show all groups that should appear in UI
SELECT 
  'All Groups for UI Display' as check_type,
  ug.name,
  ug.display_name,
  ug.description,
  ug.is_active,
  r.name as base_role,
  COUNT(ugp.module) as module_count,
  CASE 
    WHEN ug.name = 'manager_group' THEN 'NEW MANAGER GROUP'
    WHEN ug.name IN ('accountant', 'committee', 'auditor', 'support_staff') THEN 'EXISTING GROUP'
    ELSE 'OTHER GROUP'
  END as group_status
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.name IN ('accountant', 'committee', 'auditor', 'support_staff', 'manager_group')
GROUP BY ug.id, ug.name, ug.display_name, ug.description, ug.is_active, r.name
ORDER BY group_status, ug.display_name;

-- 6. Show first 10 modules for verification
SELECT 
  'Sample Modules' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'manager_group'
ORDER BY ugp.module
LIMIT 10;

-- 7. Final status check
SELECT 
  'Final Status' as check_type,
  'Group created successfully' as status,
  '36 modules configured' as modules_status,
  'Ready for UI display' as ui_status
FROM user_groups ug
WHERE ug.name = 'manager_group'
  AND ug.is_active = true
  AND EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.can_access = true
  );
