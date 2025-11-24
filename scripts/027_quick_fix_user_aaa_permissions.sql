-- Quick Fix: Ensure User AAA has proper permissions
-- แก้ไขปัญหาเมนูไม่แสดงสำหรับ User AAA

-- Step 1: Check current user info
SELECT 
  'Current User Info' as info,
  u.email,
  u.full_name
FROM users u
WHERE u.id = '386ac5d5-d486-41ee-875f-5e543f2e6efa';

-- Step 2: Check group memberships
SELECT 
  'Group Memberships' as info,
  ug.name as group_name,
  ug.display_name,
  ugm.is_active
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa';

-- Step 3: Check existing permissions
SELECT 
  'Existing Permissions' as info,
  p.name as project_name,
  ugp.module,
  ugp.can_access,
  ugp.can_view
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
ORDER BY p.name, ugp.module;

-- Step 4: Add missing permissions for admin_all group
INSERT INTO user_group_permissions (
  user_group_id, 
  project_id, 
  module, 
  can_access, 
  can_view, 
  can_add, 
  can_edit, 
  can_delete
)
SELECT 
  ug.id,
  p.id,
  'companies',
  true, true, true, true, true
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.name = 'admin_all'
  AND p.name IN ('ABCD', 'APSH')
  AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
      AND ugp.project_id = p.id 
      AND ugp.module = 'companies'
  )

UNION ALL

SELECT 
  ug.id,
  p.id,
  'projects',
  true, true, true, true, true
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.name = 'admin_all'
  AND p.name IN ('ABCD', 'APSH')
  AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
      AND ugp.project_id = p.id 
      AND ugp.module = 'projects'
  )

UNION ALL

SELECT 
  ug.id,
  p.id,
  'units',
  true, true, true, true, true
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.name = 'admin_all'
  AND p.name IN ('ABCD', 'APSH')
  AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
      AND ugp.project_id = p.id 
      AND ugp.module = 'units'
  )

UNION ALL

SELECT 
  ug.id,
  p.id,
  'announcements',
  true, true, true, true, true
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.name = 'admin_all'
  AND p.name IN ('ABCD', 'APSH')
  AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
      AND ugp.project_id = p.id 
      AND ugp.module = 'announcements'
  )

UNION ALL

SELECT 
  ug.id,
  p.id,
  'maintenance',
  true, true, true, true, true
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.name = 'admin_all'
  AND p.name IN ('ABCD', 'APSH')
  AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
      AND ugp.project_id = p.id 
      AND ugp.module = 'maintenance'
  );

-- Step 5: Verify final permissions
SELECT 
  'Final Permissions' as info,
  p.name as project_name,
  ug.name as group_name,
  ugp.module,
  ugp.can_access,
  ugp.can_view
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
ORDER BY p.name, ug.name, ugp.module;

-- Step 6: Alternative fix - Change user role to super_admin temporarily
-- Uncomment the line below if needed:
-- UPDATE users SET role = 'super_admin' WHERE id = '386ac5d5-d486-41ee-875f-5e543f2e6efa';
