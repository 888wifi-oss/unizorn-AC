-- แก้ไขปัญหา Role Engineering ไม่พบโครงการ
-- Fix Engineering role project access issue

-- 1. เพิ่ม project_admin role ให้ user ที่มี engineering role
INSERT INTO user_roles (user_id, role_id, project_id, company_id, is_active, created_at)
SELECT 
    u.id as user_id,
    r.id as role_id,
    p.id as project_id,
    p.company_id,
    true as is_active,
    NOW() as created_at
FROM users u
CROSS JOIN roles r
CROSS JOIN projects p
WHERE r.name = 'project_admin'
AND p.is_active = true
AND u.id IN (
    SELECT u2.id 
    FROM users u2
    JOIN user_roles ur2 ON u2.id = ur2.user_id AND ur2.is_active = true
    JOIN roles r2 ON ur2.role_id = r2.id
    WHERE r2.name = 'engineering'
)
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur3 
    WHERE ur3.user_id = u.id 
    AND ur3.role_id = r.id 
    AND ur3.project_id = p.id
    AND ur3.is_active = true
);

-- 2. เพิ่ม staff role ให้ user ที่มี engineering role
INSERT INTO user_roles (user_id, role_id, project_id, company_id, is_active, created_at)
SELECT 
    u.id as user_id,
    r.id as role_id,
    p.id as project_id,
    p.company_id,
    true as is_active,
    NOW() as created_at
FROM users u
CROSS JOIN roles r
CROSS JOIN projects p
WHERE r.name = 'staff'
AND p.is_active = true
AND u.id IN (
    SELECT u2.id 
    FROM users u2
    JOIN user_roles ur2 ON u2.id = ur2.user_id AND ur2.is_active = true
    JOIN roles r2 ON ur2.role_id = r2.id
    WHERE r2.name = 'engineering'
)
AND NOT EXISTS (
    SELECT 1 FROM user_roles ur3 
    WHERE ur3.user_id = u.id 
    AND ur3.role_id = r.id 
    AND ur3.project_id = p.id
    AND ur3.is_active = true
);

-- 3. ตรวจสอบผลลัพธ์
SELECT 
    'After Adding Roles for Engineering Users' as info,
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
WHERE r.name IN ('engineering', 'project_admin', 'staff')
ORDER BY u.email, r.name;

-- 4. ตรวจสอบ user group memberships สำหรับ engineering users
SELECT 
    'User Group Memberships for Engineering Users' as info,
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
    WHERE r2.name = 'engineering'
)
ORDER BY u.email, ug.name;
