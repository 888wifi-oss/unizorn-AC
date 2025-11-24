-- Check which menu items are missing and why
-- ตรวจสอบว่าเมนูไหนที่หายไปและทำไม

-- Step 1: Get all menu items from the sidebar (from the code)
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
  mi.module_name,
  CASE 
    WHEN cp.module IS NULL THEN 'MISSING'
    ELSE 'EXISTS'
  END as status
FROM menu_items mi
LEFT JOIN current_permissions cp ON mi.module_name = cp.module
ORDER BY mi.module_name;

-- Step 2: Check what permissions exist in the database for this user
SELECT 
  'All Permissions in Database' as info,
  ug.name as group_name,
  ugp.module,
  ugp.project_id,
  p.name as project_name,
  ugp.can_access,
  ugp.can_view
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ug.is_active = true
ORDER BY ug.name, ugp.module, p.name;

-- Step 3: Check if there are permissions for missing modules
WITH missing_modules AS (
  SELECT 'dashboard' as module_name
  UNION ALL SELECT 'team_management'
  UNION ALL SELECT 'notifications'
  UNION ALL SELECT 'parcel_reports'
  UNION ALL SELECT 'files'
  UNION ALL SELECT 'accounts_receivable'
  UNION ALL SELECT 'fixed_assets'
  UNION ALL SELECT 'depreciation'
  UNION ALL SELECT 'revenue_budget'
  UNION ALL SELECT 'expense_budget'
  UNION ALL SELECT 'budget_report'
  UNION ALL SELECT 'revenue_reports'
  UNION ALL SELECT 'analytics'
  UNION ALL SELECT 'automation'
  UNION ALL SELECT 'theme_settings'
  UNION ALL SELECT 'api'
)
SELECT 
  'Missing Module Permissions Check' as info,
  mm.module_name,
  CASE 
    WHEN ugp.module IS NOT NULL THEN 'HAS PERMISSIONS'
    ELSE 'NO PERMISSIONS'
  END as permission_status
FROM missing_modules mm
LEFT JOIN user_group_members ugm ON ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
LEFT JOIN user_groups ug ON ugm.user_group_id = ug.id
LEFT JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id AND ugp.module = mm.module_name
WHERE ugm.is_active = true
  AND ug.is_active = true
ORDER BY mm.module_name;

-- Step 4: Count total menu items vs permissions
SELECT 
  'Menu Items vs Permissions Count' as info,
  'Total Menu Items' as type,
  36 as count
UNION ALL
SELECT 
  'Menu Items vs Permissions Count' as info,
  'Current Permissions' as type,
  COUNT(*) as count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)
UNION ALL
SELECT 
  'Menu Items vs Permissions Count' as info,
  'Missing Items' as type,
  36 - COUNT(*) as count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
);
