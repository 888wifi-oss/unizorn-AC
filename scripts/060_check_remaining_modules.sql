-- Check remaining modules that are still missing
-- ตรวจสอบโมดูลที่ยังหายไป

-- Step 1: Check what modules are currently showing
SELECT 
  'Current Modules (19)' as info,
  module,
  can_access,
  can_view
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)
ORDER BY module;

-- Step 2: Check all modules that should be available (from the sidebar)
WITH expected_modules AS (
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
current_modules AS (
  SELECT module
  FROM get_user_aggregated_permissions(
    '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
    '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
  )
)
SELECT 
  'Missing Modules' as info,
  em.module_name
FROM expected_modules em
LEFT JOIN current_modules cm ON em.module_name = cm.module
WHERE cm.module IS NULL
ORDER BY em.module_name;

-- Step 3: Check if there are more permissions in the database that we haven't found
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

-- Step 4: Count total modules available
SELECT 
  'Module Count Summary' as info,
  'Current Function' as source,
  COUNT(*) as module_count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)

UNION ALL

SELECT 
  'Module Count Summary' as info,
  'Total in Database' as source,
  COUNT(DISTINCT ugp.module) as module_count
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ug.is_active = true;
