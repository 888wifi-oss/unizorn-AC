-- Check which 1 module is still missing
-- ตรวจสอบว่าโมดูลไหนที่ยังหายไป 1 โมดูล

-- Step 1: Find the missing module
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
  'Missing Module' as info,
  mi.module_name
FROM menu_items mi
LEFT JOIN current_permissions cp ON mi.module_name = cp.module
WHERE cp.module IS NULL
ORDER BY mi.module_name;

-- Step 2: Check all current permissions
SELECT 
  'Current Permissions' as info,
  module
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)
ORDER BY module;

-- Step 3: Count total menu items vs permissions
SELECT 
  'Final Count Check' as info,
  'Total Menu Items' as type,
  36 as count
UNION ALL
SELECT 
  'Final Count Check' as info,
  'Current Permissions' as type,
  COUNT(*) as count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)
UNION ALL
SELECT 
  'Final Count Check' as info,
  'Missing Items' as type,
  36 - COUNT(*) as count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
);
