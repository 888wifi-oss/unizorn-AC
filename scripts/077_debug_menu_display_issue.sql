-- ตรวจสอบปัญหาเมนูไม่แสดงแม้มี permissions 30 modules
-- Check menu display issue despite having 30 modules permissions

-- 1. ตรวจสอบ user ที่มีปัญหา
SELECT 
    'Problem Users' as info,
    u.id,
    u.email,
    u.full_name,
    ur.role_id,
    r.name as role_name,
    r.level as role_level,
    ur.project_id,
    ur.company_id,
    ur.is_active
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id AND ur.is_active = true
LEFT JOIN roles r ON ur.role_id = r.id
WHERE r.name IN ('staff', 'engineering', 'project_admin')
ORDER BY r.name, u.email;

-- 2. ตรวจสอบ user group memberships สำหรับ user ที่มีปัญหา
SELECT 
    'User Group Memberships for Problem Users' as info,
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
WHERE u.id IN (
    SELECT u2.id 
    FROM users u2
    JOIN user_roles ur2 ON u2.id = ur2.user_id AND ur2.is_active = true
    JOIN roles r2 ON ur2.role_id = r2.id
    WHERE r2.name IN ('staff', 'engineering', 'project_admin')
)
ORDER BY u.email, ug.name;

-- 3. ตรวจสอบ user group permissions สำหรับ user ที่มีปัญหา
SELECT 
    'User Group Permissions for Problem Users' as info,
    u.id,
    u.email,
    u.full_name,
    ugp.user_group_id,
    ug.name as group_name,
    ugp.module,
    ugp.project_id,
    p.name as project_name,
    ugp.can_access,
    ugp.can_view,
    ugp.can_add,
    ugp.can_edit
FROM users u
JOIN user_group_members ugm ON u.id = ugm.user_id
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE u.id IN (
    SELECT u2.id 
    FROM users u2
    JOIN user_roles ur2 ON u2.id = ur2.user_id AND ur2.is_active = true
    JOIN roles r2 ON ur2.role_id = r2.id
    WHERE r2.name IN ('staff', 'engineering', 'project_admin')
)
AND ugp.can_access = true
ORDER BY u.email, ug.name, ugp.module;

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
