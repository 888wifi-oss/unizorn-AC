-- ตรวจสอบปัญหาเมนูไม่แสดงตาม User Group
-- Debug menu not showing based on User Group

-- 1. ตรวจสอบ user group memberships
SELECT 
    'User Group Memberships Check' as info,
    u.id,
    u.email,
    u.full_name,
    ugm.user_group_id,
    ug.name as group_name,
    ug.company_id,
    c.name as company_name,
    ugm.is_active
FROM users u
JOIN user_group_members ugm ON u.id = ugm.user_id
JOIN user_groups ug ON ugm.user_group_id = ug.id
LEFT JOIN companies c ON ug.company_id = c.id
WHERE ugm.is_active = true
ORDER BY u.email, ug.name;

-- 2. ตรวจสอบ user group permissions
SELECT 
    'User Group Permissions Check' as info,
    ugp.user_group_id,
    ug.name as group_name,
    ugp.module,
    ugp.project_id,
    p.name as project_name,
    ugp.can_access,
    ugp.can_view,
    ugp.can_add,
    ugp.can_edit
FROM user_group_permissions ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugp.can_access = true
ORDER BY ug.name, ugp.module;

-- 3. ตรวจสอบ user roles
SELECT 
    'User Roles Check' as info,
    ur.user_id,
    u.email,
    u.full_name,
    r.name as role_name,
    r.level as role_level,
    ur.project_id,
    p.name as project_name,
    ur.company_id,
    c.name as company_name,
    ur.is_active
FROM user_roles ur
JOIN users u ON ur.user_id = u.id
JOIN roles r ON ur.role_id = r.id
LEFT JOIN projects p ON ur.project_id = p.id
LEFT JOIN companies c ON ur.company_id = c.id
WHERE ur.is_active = true
ORDER BY u.email, r.name;

-- 4. ตรวจสอบ projects ที่มีอยู่
SELECT 
    'Available Projects' as info,
    p.id,
    p.name,
    p.company_id,
    c.name as company_name,
    p.is_active
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.is_active = true
ORDER BY p.name;

-- 5. ตรวจสอบ companies ที่มีอยู่
SELECT 
    'Available Companies' as info,
    c.id,
    c.name,
    c.is_active
FROM companies c
WHERE c.is_active = true
ORDER BY c.name;
