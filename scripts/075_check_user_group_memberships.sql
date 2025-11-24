-- Check user group memberships for specific user and project
-- ตรวจสอบ group memberships สำหรับ user และ project เฉพาะ

-- Step 1: Check user info
SELECT 
  'User Info' as info,
  u.id as user_id,
  u.email,
  u.full_name,
  u.is_active
FROM users u
WHERE u.id = '8a01bd3a-377c-4091-84bb-2342ba2ab393';

-- Step 2: Check project info
SELECT 
  'Project Info' as info,
  p.id as project_id,
  p.name as project_name,
  p.company_id,
  c.name as company_name,
  p.is_active
FROM projects p
JOIN companies c ON p.company_id = c.id
WHERE p.id = '4555643e-3298-4f4b-9d11-6c51680bc307';

-- Step 3: Check user group memberships
SELECT 
  'User Group Memberships' as info,
  ugm.id as membership_id,
  ugm.user_group_id,
  ugm.user_id,
  ugm.is_active,
  ug.name as group_name,
  ug.display_name as group_display_name,
  ug.company_id as group_company_id
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
WHERE ugm.user_id = '8a01bd3a-377c-4091-84bb-2342ba2ab393'
  AND ugm.is_active = true
ORDER BY ug.name;

-- Step 4: Check user group permissions for this project
SELECT 
  'User Group Permissions for Project' as info,
  ugp.id as permission_id,
  ugp.user_group_id,
  ugp.module,
  ugp.project_id,
  ugp.can_access,
  ug.name as group_name,
  p.name as project_name
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugm.user_id = '8a01bd3a-377c-4091-84bb-2342ba2ab393'
  AND ugm.is_active = true
  AND (ugp.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307' OR ugp.project_id IS NULL)
ORDER BY ug.name, ugp.module;

-- Step 5: Check if user has any roles in this project
SELECT 
  'User Roles in Project' as info,
  ur.id as role_id,
  r.name as role_name,
  r.level as role_level,
  ur.project_id,
  ur.company_id,
  ur.is_active
FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
WHERE ur.user_id = '8a01bd3a-377c-4091-84bb-2342ba2ab393'
  AND ur.is_active = true
  AND (ur.project_id = '4555643e-3298-4f4b-9d11-6c51680bc307' OR ur.project_id IS NULL)
ORDER BY r.level;
