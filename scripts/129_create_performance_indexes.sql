-- Performance Optimization: Database Indexes
-- This script will create indexes to improve query performance
-- Note: Run each CREATE INDEX statement separately in Supabase SQL Editor

-- 1. Units table indexes
CREATE INDEX IF NOT EXISTS idx_units_unit_number ON units(unit_number);
CREATE INDEX IF NOT EXISTS idx_units_owner_name ON units(owner_name);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_units_project_id ON units(project_id);

-- 2. Bills table indexes
CREATE INDEX IF NOT EXISTS idx_bills_unit_id ON bills(unit_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_month_year ON bills(month, year);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON bills(created_at);

-- 3. User groups and permissions indexes
CREATE INDEX IF NOT EXISTS idx_user_group_members_user_id ON user_group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_members_group_id ON user_group_members(user_group_id);
CREATE INDEX IF NOT EXISTS idx_user_group_permissions_group_id ON user_group_permissions(user_group_id);
CREATE INDEX IF NOT EXISTS idx_user_group_permissions_module ON user_group_permissions(module);
CREATE INDEX IF NOT EXISTS idx_user_group_permissions_project_id ON user_group_permissions(project_id);

-- 4. Maintenance requests indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_unit_id ON maintenance_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_at ON maintenance_requests(created_at);

-- 5. Parcels indexes
CREATE INDEX IF NOT EXISTS idx_parcels_unit_number ON parcels(unit_number);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_recipient_name ON parcels(recipient_name);
CREATE INDEX IF NOT EXISTS idx_parcels_tracking_number ON parcels(tracking_number);

-- 6. Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- 7. User roles indexes
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_project_id ON user_roles(project_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON user_roles(company_id);

-- 8. Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_company_id ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_is_active ON projects(is_active);

-- 9. File management indexes
CREATE INDEX IF NOT EXISTS idx_files_category_id ON files(category_id);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);

-- 10. Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bills_unit_status ON bills(unit_id, status);
CREATE INDEX IF NOT EXISTS idx_units_project_status ON units(project_id, status);
CREATE INDEX IF NOT EXISTS idx_user_groups_company_active ON user_groups(company_id, is_active);

-- 12. Show created indexes
SELECT 
  'Created Indexes' as check_type,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
