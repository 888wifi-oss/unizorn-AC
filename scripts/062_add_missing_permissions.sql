-- Add missing permissions for all menu items
-- เพิ่ม permissions ที่หายไปสำหรับเมนูทั้งหมด

-- Step 1: Check which menu items are missing
WITH menu_items AS (
  SELECT module_name FROM (VALUES 
    ('companies'),
    ('projects'),
    ('units'),
    ('announcements'),
    ('maintenance'),
    ('billing'),
    ('payments'),
    ('parcels'),
    ('resident_accounts'),
    ('expenses'),
    ('revenue'),
    ('vendors'),
    ('user_management'),
    ('user_groups'),
    ('reports'),
    ('dashboard'),
    ('team_management'),
    ('notifications'),
    ('parcel_reports'),
    ('files'),
    ('accounts_receivable'),
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
    ('analytics'),
    ('automation'),
    ('theme_settings'),
    ('api')
  ) AS modules(module_name)
),
current_permissions AS (
  SELECT module
  FROM get_user_aggregated_permissions(
    '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
    '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
  )
)
SELECT 
  'Missing Menu Items' as info,
  mi.module_name
FROM menu_items mi
LEFT JOIN current_permissions cp ON mi.module_name = cp.module
WHERE cp.module IS NULL
ORDER BY mi.module_name;

-- Step 2: Get the user group ID for this user
SELECT 
  'User Group Info' as info,
  ug.id as group_id,
  ug.name as group_name,
  ug.display_name
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ug.is_active = true;

-- Step 3: Add missing permissions for all menu items
-- First, let's see what we need to add
WITH menu_items AS (
  SELECT module_name FROM (VALUES 
    ('companies'),
    ('projects'),
    ('units'),
    ('announcements'),
    ('maintenance'),
    ('billing'),
    ('payments'),
    ('parcels'),
    ('resident_accounts'),
    ('expenses'),
    ('revenue'),
    ('vendors'),
    ('user_management'),
    ('user_groups'),
    ('reports'),
    ('dashboard'),
    ('team_management'),
    ('notifications'),
    ('parcel_reports'),
    ('files'),
    ('accounts_receivable'),
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
    ('analytics'),
    ('automation'),
    ('theme_settings'),
    ('api')
  ) AS modules(module_name)
),
current_permissions AS (
  SELECT module
  FROM get_user_aggregated_permissions(
    '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
    '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
  )
),
user_groups AS (
  SELECT ug.id as group_id
  FROM user_group_members ugm
  JOIN user_groups ug ON ugm.user_group_id = ug.id
  WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
    AND ugm.is_active = true
    AND ug.is_active = true
)
SELECT 
  'Permissions to Add' as info,
  mi.module_name,
  ug.group_id
FROM menu_items mi
CROSS JOIN user_groups ug
LEFT JOIN current_permissions cp ON mi.module_name = cp.module
WHERE cp.module IS NULL
ORDER BY mi.module_name;

-- Step 4: Actually add the missing permissions
-- This will add permissions for all missing menu items
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
  can_assign
)
SELECT 
  ug.id as user_group_id,
  mi.module_name as module,
  true as can_access,
  true as can_view,
  true as can_add,
  true as can_edit,
  true as can_delete,
  true as can_print,
  true as can_export,
  true as can_approve,
  true as can_assign
FROM (
  SELECT module_name FROM (VALUES 
    ('companies'),
    ('projects'),
    ('units'),
    ('announcements'),
    ('maintenance'),
    ('billing'),
    ('payments'),
    ('parcels'),
    ('resident_accounts'),
    ('expenses'),
    ('revenue'),
    ('vendors'),
    ('user_management'),
    ('user_groups'),
    ('reports'),
    ('dashboard'),
    ('team_management'),
    ('notifications'),
    ('parcel_reports'),
    ('files'),
    ('accounts_receivable'),
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
    ('analytics'),
    ('automation'),
    ('theme_settings'),
    ('api')
  ) AS modules(module_name)
) mi
CROSS JOIN (
  SELECT ug.id
  FROM user_group_members ugm
  JOIN user_groups ug ON ugm.user_group_id = ug.id
  WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
    AND ugm.is_active = true
    AND ug.is_active = true
) ug
WHERE NOT EXISTS (
  SELECT 1 FROM user_group_permissions ugp 
  WHERE ugp.user_group_id = ug.id 
    AND ugp.module = mi.module_name
);

-- Step 5: Verify the fix
SELECT 
  'After Adding Permissions' as info,
  COUNT(*) as module_count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
);
