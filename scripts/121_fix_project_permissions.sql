-- Fix permissions for the specific project
-- This script will add project-specific permissions for manager_group

SELECT 
  '===== FIXING PROJECT PERMISSIONS =====' as debug_info;

-- 1. Check current permissions
SELECT 
  'Current Permissions' as check_type,
  COUNT(*) as total_permissions,
  COUNT(CASE WHEN project_id IS NULL THEN 1 END) as global_permissions,
  COUNT(CASE WHEN project_id IS NOT NULL THEN 1 END) as project_permissions
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'manager_group';

-- 2. Add project-specific permissions for the manager_group
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
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'dashboard',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'units',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'team_management',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'announcements',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'maintenance',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'resident_accounts',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'notifications',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'parcels',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'parcel_reports',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'files',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'billing',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'payments',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'revenue',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'accounts_receivable',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'expenses',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'fixed_assets',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'depreciation',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'chart_of_accounts',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'journal_vouchers',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'general_ledger',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'revenue_budget',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'expense_budget',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'budget_report',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'revenue_reports',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'financial_statements',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'reports',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'analytics',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'automation',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'theme_settings',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'user_management',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'revenue_journal',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'expense_approval',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'expense_reports',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'trial_balance',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group'

UNION ALL

SELECT 
  ug.id,
  'vendors',
  true, true, true, true, true, true, true, false, false, '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid
FROM user_groups ug WHERE ug.name = 'manager_group';

-- 3. Verify the permissions were added
SELECT 
  'After Adding Permissions' as check_type,
  COUNT(*) as total_permissions,
  COUNT(CASE WHEN project_id IS NULL THEN 1 END) as global_permissions,
  COUNT(CASE WHEN project_id IS NOT NULL THEN 1 END) as project_permissions,
  COUNT(CASE WHEN project_id = '4555643e-3298-4f4b-9d11-6c51680bc307' THEN 1 END) as specific_project_permissions
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'manager_group';

-- 4. Show sample project-specific permissions
SELECT 
  'Sample Project Permissions' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.project_id
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.name = 'manager_group'
  AND ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307'
ORDER BY ugp.module
LIMIT 10;
