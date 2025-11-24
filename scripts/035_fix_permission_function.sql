-- Fix: Create new function that shows ALL permissions regardless of project
-- แก้ไข: สร้างฟังก์ชันใหม่ที่แสดงสิทธิ์ทั้งหมดไม่ว่าจะผูกกับ project ไหน

-- Step 1: Create new function that aggregates ALL permissions
CREATE OR REPLACE FUNCTION get_user_aggregated_permissions_all(user_id_param UUID)
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
  GROUP BY ugp.module
  ORDER BY ugp.module;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Test the new function
SELECT 
  'All Permissions (New Function)' as info,
  module,
  can_access,
  can_view,
  can_add,
  can_edit,
  can_delete
FROM get_user_aggregated_permissions_all('386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid)
ORDER BY module;

-- Step 3: Update the original function to show ALL permissions (not filtered by project)
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
    -- REMOVED: AND ugp.project_id = project_id_param
    -- This will now show ALL permissions regardless of project
  GROUP BY ugp.module
  ORDER BY ugp.module;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Test the updated function
SELECT 
  'Updated Function Result (All Modules)' as info,
  module,
  can_access,
  can_view,
  can_add,
  can_edit,
  can_delete
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)
ORDER BY module;

-- Step 5: Count the modules
SELECT 
  'Module Count Comparison' as info,
  'Before (Project Filtered)' as type,
  15 as count
UNION ALL
SELECT 
  'Module Count Comparison' as info,
  'After (All Modules)' as type,
  COUNT(*) as count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
);
