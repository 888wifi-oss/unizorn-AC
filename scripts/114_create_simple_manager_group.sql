-- Create a simple group that should definitely appear in UI
-- This script uses a simpler approach to create the group

SELECT 
  '===== CREATING SIMPLE MANAGER GROUP =====' as debug_info;

-- 1. Delete any existing problematic groups
DELETE FROM user_group_permissions 
WHERE user_group_id IN (
  SELECT id FROM user_groups 
  WHERE name IN ('full_access_manager', 'system_manager')
);

DELETE FROM user_groups 
WHERE name IN ('full_access_manager', 'system_manager');

-- 2. Create a simple group with minimal configuration
INSERT INTO user_groups (
  id,
  name,
  display_name,
  description,
  role_id,
  company_id,
  is_active
)
VALUES (
  gen_random_uuid(),
  'manager_group',
  'ผู้จัดการระบบ',
  'กลุ่มผู้จัดการระบบที่มีสิทธิ์เข้าถึงทุกโมดูลยกเว้นการจัดการระบบหลัก',
  (SELECT id FROM roles WHERE name = 'staff' LIMIT 1),
  NULL,
  true
);

-- 3. Add permissions using a simple loop approach
DO $$
DECLARE
    group_id UUID;
    module_name TEXT;
    modules TEXT[] := ARRAY[
        'api', 'dashboard', 'units', 'team_management', 'announcements', 'maintenance',
        'resident_accounts', 'notifications', 'parcels', 'parcel_reports', 'files',
        'billing', 'payments', 'revenue', 'accounts_receivable', 'expenses',
        'fixed_assets', 'depreciation', 'chart_of_accounts', 'journal_vouchers',
        'general_ledger', 'revenue_budget', 'expense_budget', 'budget_report',
        'revenue_reports', 'financial_statements', 'reports', 'analytics',
        'automation', 'theme_settings', 'user_management', 'revenue_journal',
        'expense_approval', 'expense_reports', 'trial_balance', 'vendors'
    ];
BEGIN
    -- Get the group ID
    SELECT id INTO group_id FROM user_groups WHERE name = 'manager_group';
    
    -- Insert permissions for each module
    FOREACH module_name IN ARRAY modules
    LOOP
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
        ) VALUES (
            group_id,
            module_name,
            true, true, true, true, true, true, true, false, false, NULL::uuid
        );
    END LOOP;
END $$;

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
  'All Groups for UI' as check_type,
  ug.name,
  ug.display_name,
  ug.description,
  ug.is_active,
  r.name as base_role,
  COUNT(ugp.module) as module_count
FROM user_groups ug
JOIN roles r ON ug.role_id = r.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ug.name IN ('accountant', 'committee', 'auditor', 'support_staff', 'manager_group')
GROUP BY ug.id, ug.name, ug.display_name, ug.description, ug.is_active, r.name
ORDER BY ug.display_name;
