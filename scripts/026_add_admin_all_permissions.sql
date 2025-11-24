-- Add permissions for admin_all group in ABCD project
-- เพิ่ม permissions สำหรับกลุ่ม admin_all ในโครงการ ABCD

-- Get the admin_all group ID
WITH admin_all_group AS (
  SELECT id FROM user_groups WHERE name = 'admin_all'
),
abcd_project AS (
  SELECT '4555643e-3298-4f4b-9d11-6c51680bc307'::uuid as id
)

-- Insert permissions for all modules
INSERT INTO user_group_permissions (
  user_group_id, 
  project_id, 
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
  ag.id,
  ap.id,
  module_name,
  true, -- can_access
  true, -- can_view
  true, -- can_add
  true, -- can_edit
  true, -- can_delete
  true, -- can_print
  true, -- can_export
  true, -- can_approve
  true  -- can_assign
FROM admin_all_group ag
CROSS JOIN abcd_project ap
CROSS JOIN (VALUES 
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
  ('reports')
) AS modules(module_name)
WHERE NOT EXISTS (
  SELECT 1 FROM user_group_permissions ugp 
  WHERE ugp.user_group_id = ag.id 
    AND ugp.project_id = ap.id 
    AND ugp.module = modules.module_name
);

-- Also add permissions for APSH project
WITH admin_all_group AS (
  SELECT id FROM user_groups WHERE name = 'admin_all'
),
apsh_project AS (
  SELECT '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid as id
)

INSERT INTO user_group_permissions (
  user_group_id, 
  project_id, 
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
  ag.id,
  ap.id,
  module_name,
  true, -- can_access
  true, -- can_view
  true, -- can_add
  true, -- can_edit
  true, -- can_delete
  true, -- can_print
  true, -- can_export
  true, -- can_approve
  true  -- can_assign
FROM admin_all_group ag
CROSS JOIN apsh_project ap
CROSS JOIN (VALUES 
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
  ('reports')
) AS modules(module_name)
WHERE NOT EXISTS (
  SELECT 1 FROM user_group_permissions ugp 
  WHERE ugp.user_group_id = ag.id 
    AND ugp.project_id = ap.id 
    AND ugp.module = modules.module_name
);

-- Verify the results
SELECT 
  u.email,
  u.full_name,
  ug.name as group_name,
  ugp.project_id,
  p.name as project_name,
  ugp.module,
  ugp.can_access,
  ugp.can_view
FROM user_group_members ugm
JOIN users u ON ugm.user_id = u.id  
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE u.id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
ORDER BY ug.name, p.name, ugp.module;
