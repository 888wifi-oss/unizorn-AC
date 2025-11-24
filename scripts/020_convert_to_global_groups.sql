-- Migration: Convert Project-Scoped Groups to Global Groups
-- เปลี่ยนจาก Project-Scoped Groups เป็น Global Groups

-- Step 1: Backup existing data
CREATE TABLE user_group_members_backup AS 
SELECT * FROM user_group_members;

CREATE TABLE user_group_permissions_backup AS 
SELECT * FROM user_group_permissions;

-- Step 2: Create new structure
-- เพิ่ม project_id ใน user_group_permissions
ALTER TABLE user_group_permissions 
ADD COLUMN project_id UUID REFERENCES projects(id);

-- Step 3: Drop old unique constraint first
ALTER TABLE user_group_permissions 
DROP CONSTRAINT IF EXISTS user_group_permissions_user_group_id_module_key;

-- Step 4: Migrate data
-- Copy permissions for each project
INSERT INTO user_group_permissions (
  user_group_id, 
  project_id, 
  module, 
  can_access, 
  can_view, 
  can_add, 
  can_edit, 
  can_delete, 
  created_at
)
SELECT 
  ugp.user_group_id,
  ug.project_id,
  ugp.module,
  ugp.can_access,
  ugp.can_view,
  ugp.can_add,
  ugp.can_edit,
  ugp.can_delete,
  ugp.created_at
FROM user_group_permissions_backup ugp
JOIN user_groups ug ON ugp.user_group_id = ug.id
WHERE ug.project_id IS NOT NULL;

-- Step 5: Remove old columns
ALTER TABLE user_groups DROP COLUMN project_id;
ALTER TABLE user_group_members DROP COLUMN project_id;

-- Step 6: Update unique constraints

ALTER TABLE user_group_permissions 
ADD CONSTRAINT user_group_permissions_unique 
UNIQUE (user_group_id, project_id, module);

-- Step 6: Update RLS policies
DROP POLICY IF EXISTS "Users can view user group permissions" ON user_group_permissions;
DROP POLICY IF EXISTS "Users can manage user group permissions" ON user_group_permissions;

CREATE POLICY "Users can view user group permissions" ON user_group_permissions
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_group_members ugm
    JOIN user_groups ug ON ugm.user_group_id = ug.id
    WHERE ugm.user_id = auth.uid()
    AND ugm.user_group_id = user_group_permissions.user_group_id
  )
  OR EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('super_admin', 'company_admin')
  )
);

CREATE POLICY "Users can manage user group permissions" ON user_group_permissions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = auth.uid()
    AND u.role IN ('super_admin', 'company_admin')
  )
);

-- Step 7: Create indexes for performance
CREATE INDEX idx_user_group_permissions_project_id ON user_group_permissions(project_id);
CREATE INDEX idx_user_group_permissions_user_group_project ON user_group_permissions(user_group_id, project_id);

-- Step 8: Update function to handle new structure
CREATE OR REPLACE FUNCTION get_user_aggregated_permissions(user_id_param UUID, project_id_param UUID)
RETURNS TABLE (
  module VARCHAR(50),
  can_access BOOLEAN,
  can_view BOOLEAN,
  can_add BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    ugp.module,
    BOOL_OR(ugp.can_access) as can_access,
    BOOL_OR(ugp.can_view) as can_view,
    BOOL_OR(ugp.can_add) as can_add,
    BOOL_OR(ugp.can_edit) as can_edit,
    BOOL_OR(ugp.can_delete) as can_delete
  FROM user_group_members ugm
  JOIN user_group_permissions ugp ON ugm.user_group_id = ugp.user_group_id
  WHERE ugm.user_id = user_id_param
    AND ugm.is_active = true
    AND ugp.project_id = project_id_param
  GROUP BY ugp.module;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Test the migration
-- ตรวจสอบว่าข้อมูลถูกต้อง
SELECT 
  'Migration Test' as test_type,
  COUNT(*) as total_permissions,
  COUNT(DISTINCT user_group_id) as unique_groups,
  COUNT(DISTINCT project_id) as unique_projects
FROM user_group_permissions;

-- Step 10: Cleanup (optional - รันหลังจากทดสอบแล้ว)
-- DROP TABLE user_group_members_backup;
-- DROP TABLE user_group_permissions_backup;

COMMENT ON TABLE user_group_permissions IS 'Global user group permissions with project-specific overrides';
COMMENT ON COLUMN user_group_permissions.project_id IS 'Project-specific permissions. NULL means global permissions for all projects.';
