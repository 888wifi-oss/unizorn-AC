-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for audit_logs
-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid()
            AND r.level <= 20 -- Admin level or higher
        )
    );

-- System can insert logs (via server actions)
-- We'll use a function or direct insert from server actions with service role if needed,
-- but for now allow authenticated users to insert their own logs (for client-side logging if ever needed)
-- or rely on server-side insertion which bypasses RLS if using service role.
-- For safety, let's allow authenticated users to insert logs where they are the user_id.
CREATE POLICY "Users can insert their own logs" ON audit_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);


-- Add granular permissions
INSERT INTO permissions (name, display_name, description, module, action) VALUES
-- Units
('units.import', 'Import Units', 'Can import units from files', 'units', 'import'),
('units.export', 'Export Units', 'Can export units to files', 'units', 'export'),

-- Residents
('residents.import', 'Import Residents', 'Can import residents from files', 'residents', 'import'),
('residents.export', 'Export Residents', 'Can export residents to files', 'residents', 'export'),

-- Payments
('payments.approve', 'Approve Payments', 'Can approve payment reconciliation', 'payments', 'approve'),
('payments.export', 'Export Payments', 'Can export payment reports', 'payments', 'export'),

-- Maintenance
('maintenance.approve', 'Approve Maintenance', 'Can approve maintenance requests', 'maintenance', 'approve'),

-- Parcels
('parcels.import', 'Import Parcels', 'Can import parcels from files', 'parcels', 'import'),
('parcels.export', 'Export Parcels', 'Can export parcel reports', 'parcels', 'export')

ON CONFLICT (name) DO NOTHING;

-- Assign new permissions to Company Admin and Project Admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name IN ('company_admin', 'project_admin')
AND p.name IN (
    'units.import', 'units.export',
    'residents.import', 'residents.export',
    'payments.approve', 'payments.export',
    'maintenance.approve',
    'parcels.import', 'parcels.export'
)
ON CONFLICT DO NOTHING;
