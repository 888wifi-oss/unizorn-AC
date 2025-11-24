-- Insert new permissions for payments module
INSERT INTO permissions (name, display_name, description, module, action) VALUES
('payments.view', 'View Payments', 'Can view payment records and reconciliation', 'payments', 'view'),
('payments.create', 'Create Payments', 'Can create payment records and match transactions', 'payments', 'create'),
('payments.update', 'Update Payments', 'Can update payment records and reconciliation status', 'payments', 'update'),
('payments.delete', 'Delete Payments', 'Can delete payment records and reconciliation matches', 'payments', 'delete'),
('payments.manage', 'Manage Payments', 'Can manage all payment settings', 'payments', 'manage'),
('reports.export', 'Export Reports', 'Can export system reports', 'reports', 'export')
ON CONFLICT (name) DO NOTHING;

-- Assign permissions to roles
-- Super Admin (gets all permissions automatically via logic, but good to have)
-- Company Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'company_admin'
AND p.name IN (
    'payments.view', 'payments.create', 'payments.update', 'payments.delete', 'payments.manage',
    'reports.export'
)
ON CONFLICT DO NOTHING;

-- Project Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'project_admin'
AND p.name IN (
    'payments.view', 'payments.create', 'payments.update', 'payments.delete', 'payments.manage',
    'reports.export'
)
ON CONFLICT DO NOTHING;

-- Staff (View only)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'staff'
AND p.name IN (
    'payments.view'
)
ON CONFLICT DO NOTHING;
