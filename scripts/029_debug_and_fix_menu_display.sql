-- Debug and Fix: User AAA Menu Display Issue
-- แก้ไขปัญหาเมนูไม่แสดงสำหรับ User AAA

-- Step 1: Check if user exists and get details
SELECT 
  'User Details' as info,
  u.id,
  u.email,
  u.full_name,
  u.created_at
FROM users u
WHERE u.id = '386ac5d5-d486-41ee-875f-5e543f2e6efa';

-- Step 2: Check all group memberships
SELECT 
  'All Group Memberships' as info,
  ug.id as group_id,
  ug.name as group_name,
  ug.display_name,
  ugm.is_active,
  ugm.created_at
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
ORDER BY ug.name;

-- Step 3: Check all permissions for this user
SELECT 
  'All User Permissions' as info,
  p.name as project_name,
  ug.name as group_name,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit,
  ugp.can_delete
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
ORDER BY p.name, ug.name, ugp.module;

-- Step 4: Check if admin_all group exists
SELECT 
  'Admin All Group' as info,
  id,
  name,
  display_name,
  is_active
FROM user_groups 
WHERE name = 'admin_all';

-- Step 5: Check if projects exist
SELECT 
  'Projects' as info,
  id,
  name,
  is_active
FROM projects 
WHERE name IN ('ABCD', 'APSH')
ORDER BY name;

-- Step 6: Force add all permissions for admin_all group
-- Delete existing permissions first
DELETE FROM user_group_permissions 
WHERE user_group_id IN (
  SELECT id FROM user_groups WHERE name = 'admin_all'
);

-- Add comprehensive permissions
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
  ug.id,
  p.id,
  module_name,
  true, true, true, true, true, true, true, true, true
FROM user_groups ug
CROSS JOIN projects p
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
WHERE ug.name = 'admin_all'
  AND p.name IN ('ABCD', 'APSH');

-- Step 7: Verify permissions were added
SELECT 
  'Verification - Permissions Added' as info,
  p.name as project_name,
  ug.name as group_name,
  COUNT(ugp.module) as module_count,
  STRING_AGG(ugp.module, ', ' ORDER BY ugp.module) as modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
GROUP BY p.name, ug.name
ORDER BY p.name, ug.name;

-- Step 8: Test the function directly
SELECT 
  'Function Test - ABCD Project' as info,
  module,
  can_access,
  can_view
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  (SELECT id FROM projects WHERE name = 'ABCD')::uuid
)
ORDER BY module;

-- Step 9: Test the function with APSH project
SELECT 
  'Function Test - APSH Project' as info,
  module,
  can_access,
  can_view
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  (SELECT id FROM projects WHERE name = 'APSH')::uuid
)
ORDER BY module;
