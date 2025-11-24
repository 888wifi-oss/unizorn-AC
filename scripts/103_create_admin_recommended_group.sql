-- Add new recommended group "แอดมิน" with 36 modules
-- This script will create a new recommended group with specific modules

SELECT 
  '===== CREATING RECOMMENDED GROUP "แอดมิน" =====' as debug_info;

-- 1. Create the recommended group "แอดมิน"
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
SELECT 
  gen_random_uuid() as id,
  'admin_recommended' as name,
  'แอดมิน' as display_name,
  'กลุ่มผู้ดูแลระบบที่มีสิทธิ์เข้าถึงทุกโมดูลยกเว้นการจัดการระบบหลัก' as description,
  r.id as role_id,
  NULL as company_id,
  true as is_active,
  NOW() as created_at,
  NOW() as updated_at
FROM roles r
WHERE r.name = 'staff'
LIMIT 1;

-- 2. Get the created group ID
SELECT 
  'Created Group Info' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  r.name as base_role,
  r.level as role_level
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
WHERE ug.name = 'admin_recommended'
  AND ug.display_name = 'แอดมิน'
ORDER BY ug.created_at DESC
LIMIT 1;

-- 3. Add 36 modules with full permissions (excluding the 4 specified modules)
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
  ug.id as user_group_id,
  module_list.module,
  true as can_access,
  true as can_view,
  true as can_add,
  true as can_edit,
  true as can_delete,
  true as can_print,
  true as can_export,
  false as can_approve,
  false as can_assign,
  NULL as project_id
FROM user_groups ug
CROSS JOIN (
  -- 36 modules excluding: companies, projects, users, user_groups
  SELECT 'api' as module UNION ALL
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
  SELECT 'theme_settings' UNION ALL
  SELECT 'user_management' UNION ALL
  SELECT 'revenue_journal' UNION ALL
  SELECT 'expense_approval' UNION ALL
  SELECT 'expense_reports' UNION ALL
  SELECT 'trial_balance' UNION ALL
  SELECT 'vendors'
) module_list
WHERE ug.name = 'admin_recommended'
  AND ug.display_name = 'แอดมิน';

-- 4. Verify the created group and permissions
SELECT 
  'Verification - Group Created' as check_type,
  ug.id,
  ug.name,
  ug.display_name,
  ug.description,
  r.name as base_role,
  r.level as role_level,
  ug.is_active
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
WHERE ug.name = 'admin_recommended'
  AND ug.display_name = 'แอดมิน';

-- 5. Count permissions for the new group
SELECT 
  'Verification - Permissions Count' as check_type,
  COUNT(*) as total_permissions,
  COUNT(CASE WHEN can_access = true THEN 1 END) as can_access_count,
  COUNT(CASE WHEN can_view = true THEN 1 END) as can_view_count,
  COUNT(CASE WHEN can_add = true THEN 1 END) as can_add_count,
  COUNT(CASE WHEN can_edit = true THEN 1 END) as can_edit_count,
  COUNT(CASE WHEN can_delete = true THEN 1 END) as can_delete_count,
  COUNT(CASE WHEN can_print = true THEN 1 END) as can_print_count,
  COUNT(CASE WHEN can_export = true THEN 1 END) as can_export_count
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'admin_recommended'
  AND ug.display_name = 'แอดมิน';

-- 6. List all modules in the new group
SELECT 
  'Verification - All Modules' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit,
  ugp.can_delete,
  ugp.can_print,
  ugp.can_export,
  ugp.can_approve,
  ugp.can_assign
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'admin_recommended'
  AND ug.display_name = 'แอดมิน'
ORDER BY ugp.module;

-- 7. Show excluded modules
SELECT 
  'Excluded Modules' as check_type,
  'companies' as module,
  'จัดการบริษัท' as description
UNION ALL
SELECT 'Excluded Modules', 'projects', 'จัดการโครงการ'
UNION ALL
SELECT 'Excluded Modules', 'users', 'จัดการผู้ใช้และสิทธิ์'
UNION ALL
SELECT 'Excluded Modules', 'user_groups', 'กลุ่มผู้ใช้งาน';
