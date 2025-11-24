-- Debug: Why only 15 modules instead of 30
-- ตรวจสอบว่าทำไมแสดงแค่ 15 โมดูลแทนที่จะเป็น 30 โมดูล

-- Step 1: Check total permissions in user groups (all projects)
SELECT 
  'Total Permissions in All Groups' as info,
  ug.name as group_name,
  COUNT(ugp.module) as total_modules,
  STRING_AGG(ugp.module, ', ' ORDER BY ugp.module) as modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
GROUP BY ug.name
ORDER BY ug.name;

-- Step 2: Check permissions for specific project (95ae2a41-cc9e-45d0-8dfc-38b635c06457)
SELECT 
  'Permissions for Project APSH Only' as info,
  ug.name as group_name,
  COUNT(ugp.module) as project_modules,
  STRING_AGG(ugp.module, ', ' ORDER BY ugp.module) as modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ugp.project_id = '95ae2a41-cc9e-45d0-8dfc-38b635c06457'
GROUP BY ug.name
ORDER BY ug.name;

-- Step 3: Check permissions without project_id (NULL values)
SELECT 
  'Permissions without Project ID (NULL)' as info,
  ug.name as group_name,
  COUNT(ugp.module) as null_project_modules,
  STRING_AGG(ugp.module, ', ' ORDER BY ugp.module) as modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ugp.project_id IS NULL
GROUP BY ug.name
ORDER BY ug.name;

-- Step 4: Check permissions for other projects
SELECT 
  'Permissions for Other Projects' as info,
  ug.name as group_name,
  ugp.project_id,
  p.name as project_name,
  COUNT(ugp.module) as other_project_modules,
  STRING_AGG(ugp.module, ', ' ORDER BY ugp.module) as modules
FROM user_group_members ugm
JOIN user_groups ug ON ugm.user_group_id = ug.id
JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
LEFT JOIN projects p ON ugp.project_id = p.id
WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
  AND ugm.is_active = true
  AND ugp.project_id IS NOT NULL
  AND ugp.project_id != '95ae2a41-cc9e-45d0-8dfc-38b635c06457'
GROUP BY ug.name, ugp.project_id, p.name
ORDER BY ug.name, p.name;

-- Step 5: Test the current function
SELECT 
  'Current Function Result (15 modules)' as info,
  module,
  can_access,
  can_view
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)
ORDER BY module;

-- Step 6: Create a new function that shows ALL permissions (not filtered by project)
CREATE OR REPLACE FUNCTION get_user_all_permissions(user_id_param UUID)
RETURNS TABLE (
  module VARCHAR(50),
  can_access BOOLEAN,
  can_view BOOLEAN,
  can_add BOOLEAN,
  can_edit BOOLEAN,
  can_delete BOOLEAN,
  project_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    ugp.module,
    BOOL_OR(ugp.can_access) as can_access,
    BOOL_OR(ugp.can_view) as can_view,
    BOOL_OR(ugp.can_add) as can_add,
    BOOL_OR(ugp.can_edit) as can_edit,
    BOOL_OR(ugp.can_delete) as can_delete,
    ugp.project_id
  FROM user_group_members ugm
  JOIN user_group_permissions ugp ON ugm.user_group_id = ugp.user_group_id
  WHERE ugm.user_id = user_id_param
    AND ugm.is_active = true
  GROUP BY ugp.module, ugp.project_id
  ORDER BY ugp.module, ugp.project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Test the new function
SELECT 
  'All Permissions (Not Filtered by Project)' as info,
  module,
  can_access,
  can_view,
  project_id
FROM get_user_all_permissions('386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid)
ORDER BY module, project_id;
