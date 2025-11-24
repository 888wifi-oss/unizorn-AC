-- แก้ไขปัญหาเมนูไม่แสดงตาม User Group
-- Fix menu display based on User Group permissions

-- 1. เพิ่ม user group permissions ที่ขาดหายไปสำหรับทุก user group
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'dashboard' as module,
    true as can_access,
    true as can_view,
    false as can_add,
    false as can_edit,
    false as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'dashboard'
    AND ugp.project_id = p.id
);

-- 2. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'units' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'units'
    AND ugp.project_id = p.id
);

-- 3. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'announcements' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'announcements'
    AND ugp.project_id = p.id
);

-- 4. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'maintenance' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'maintenance'
    AND ugp.project_id = p.id
);

-- 5. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'resident_accounts' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'resident_accounts'
    AND ugp.project_id = p.id
);

-- 6. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'notifications' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'notifications'
    AND ugp.project_id = p.id
);

-- 7. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'parcels' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'parcels'
    AND ugp.project_id = p.id
);

-- 8. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'parcel_reports' as module,
    true as can_access,
    true as can_view,
    false as can_add,
    false as can_edit,
    false as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'parcel_reports'
    AND ugp.project_id = p.id
);

-- 9. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'files' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'files'
    AND ugp.project_id = p.id
);

-- 10. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'billing' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'billing'
    AND ugp.project_id = p.id
);

-- 11. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'payments' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'payments'
    AND ugp.project_id = p.id
);

-- 12. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'revenue' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'revenue'
    AND ugp.project_id = p.id
);

-- 13. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'accounts_receivable' as module,
    true as can_access,
    true as can_view,
    false as can_add,
    false as can_edit,
    false as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'accounts_receivable'
    AND ugp.project_id = p.id
);

-- 14. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'expenses' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'expenses'
    AND ugp.project_id = p.id
);

-- 15. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'chart_of_accounts' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'chart_of_accounts'
    AND ugp.project_id = p.id
);

-- 16. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'general_ledger' as module,
    true as can_access,
    true as can_view,
    false as can_add,
    false as can_edit,
    false as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'general_ledger'
    AND ugp.project_id = p.id
);

-- 17. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'journal_vouchers' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'journal_vouchers'
    AND ugp.project_id = p.id
);

-- 18. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'financial_statements' as module,
    true as can_access,
    true as can_view,
    false as can_add,
    false as can_edit,
    false as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'financial_statements'
    AND ugp.project_id = p.id
);

-- 19. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'reports' as module,
    true as can_access,
    true as can_view,
    false as can_add,
    false as can_edit,
    false as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'reports'
    AND ugp.project_id = p.id
);

-- 20. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'team_management' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'team_management'
    AND ugp.project_id = p.id
);

-- 21. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'theme_settings' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'theme_settings'
    AND ugp.project_id = p.id
);

-- 22. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'user_groups' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'user_groups'
    AND ugp.project_id = p.id
);

-- 23. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'user_management' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'user_management'
    AND ugp.project_id = p.id
);

-- 24. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'projects' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'projects'
    AND ugp.project_id = p.id
);

-- 25. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'companies' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'companies'
    AND ugp.project_id = p.id
);

-- 26. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'api' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'api'
    AND ugp.project_id = p.id
);

-- 27. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'automation' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'automation'
    AND ugp.project_id = p.id
);

-- 28. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'analytics' as module,
    true as can_access,
    true as can_view,
    false as can_add,
    false as can_edit,
    false as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'analytics'
    AND ugp.project_id = p.id
);

-- 29. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'budget_report' as module,
    true as can_access,
    true as can_view,
    false as can_add,
    false as can_edit,
    false as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'budget_report'
    AND ugp.project_id = p.id
);

-- 30. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'depreciation' as module,
    true as can_access,
    true as can_view,
    false as can_add,
    false as can_edit,
    false as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'depreciation'
    AND ugp.project_id = p.id
);

-- 31. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'expense_budget' as module,
    true as can_access,
    true as can_view,
    false as can_add,
    false as can_edit,
    false as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'expense_budget'
    AND ugp.project_id = p.id
);

-- 32. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'fixed_assets' as module,
    true as can_access,
    true as can_view,
    false as can_add,
    false as can_edit,
    false as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'fixed_assets'
    AND ugp.project_id = p.id
);

-- 33. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'revenue_budget' as module,
    true as can_access,
    true as can_view,
    false as can_add,
    false as can_edit,
    false as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'revenue_budget'
    AND ugp.project_id = p.id
);

-- 34. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'revenue_reports' as module,
    true as can_access,
    true as can_view,
    false as can_add,
    false as can_edit,
    false as can_delete,
    true as can_print,
    true as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'revenue_reports'
    AND ugp.project_id = p.id
);

-- 35. เพิ่ม user group permissions สำหรับ modules อื่นๆ
INSERT INTO user_group_permissions (user_group_id, module, can_access, can_view, can_add, can_edit, can_delete, can_print, can_export, can_approve, can_assign, project_id)
SELECT 
    ug.id as user_group_id,
    'vendors' as module,
    true as can_access,
    true as can_view,
    true as can_add,
    true as can_edit,
    true as can_delete,
    false as can_print,
    false as can_export,
    false as can_approve,
    false as can_assign,
    p.id as project_id
FROM user_groups ug
CROSS JOIN projects p
WHERE ug.is_active = true
AND p.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM user_group_permissions ugp 
    WHERE ugp.user_group_id = ug.id 
    AND ugp.module = 'vendors'
    AND ugp.project_id = p.id
);

-- 36. ตรวจสอบผลลัพธ์
SELECT 
    'After Adding All Permissions' as info,
    COUNT(*) as total_permissions,
    COUNT(DISTINCT module) as unique_modules,
    COUNT(DISTINCT user_group_id) as unique_groups,
    COUNT(DISTINCT project_id) as unique_projects
FROM user_group_permissions
WHERE can_access = true;
