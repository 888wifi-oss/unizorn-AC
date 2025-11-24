-- Add missing modules to User Group permissions
-- This script will add any missing modules to the User Group

SELECT 
  '===== ADDING MISSING MODULES =====' as debug_info;

-- 1. Get the User Group ID for the user
SELECT 
  'User Group Info' as check_type,
  ugm.user_group_id,
  ug.name as group_name
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true
LIMIT 1;

-- 2. Insert missing modules with default permissions
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
  ugm.user_group_id,
  mm.module,
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
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
CROSS JOIN (
  SELECT 'users' as module UNION ALL
  SELECT 'user_management' UNION ALL
  SELECT 'revenue_journal' UNION ALL
  SELECT 'expense_approval' UNION ALL
  SELECT 'expense_reports' UNION ALL
  SELECT 'trial_balance' UNION ALL
  SELECT 'vendors'
) mm
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp
    WHERE ugp.user_group_id = ugm.user_group_id
      AND ugp.module = mm.module
      AND ugp.project_id IS NULL
  );

-- 3. Verify the additions
SELECT 
  'Verification' as check_type,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit,
  ugp.can_delete,
  ugp.can_print,
  ugp.can_export,
  ugp.can_approve,
  ugp.can_assign,
  ugp.project_id
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
JOIN user_group_members ugm ON ug.id = ugm.user_group_id
WHERE ugm.user_id = '35c366c2-673e-47dd-b39e-e10d379e6266'
  AND ugm.is_active = true
  AND ug.is_active = true
  AND ugp.project_id IS NULL
ORDER BY ugp.module;
