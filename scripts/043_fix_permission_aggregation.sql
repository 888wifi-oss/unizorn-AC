-- Fix: Improve permission aggregation to show ALL modules
-- แก้ไข: ปรับปรุงการรวม permissions ให้แสดงทุกโมดูล

-- Step 1: Create improved function that properly aggregates ALL permissions
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
  SELECT 
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
    -- Include ALL permissions regardless of project_id
    -- This will aggregate permissions from all projects and NULL project_id
  GROUP BY ugp.module
  ORDER BY ugp.module;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Test the improved function
SELECT 
  'Improved Function Result' as info,
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

-- Step 3: Count the modules
SELECT 
  'Module Count After Fix' as info,
  COUNT(*) as module_count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
);

-- Step 4: Check if we need to add missing modules manually
-- First, let's see what modules are missing
WITH all_modules AS (
  SELECT DISTINCT ugp.module
  FROM user_group_members ugm
  JOIN user_group_permissions ugp ON ugm.user_group_id = ugp.user_group_id
  WHERE ugm.user_id = '386ac5d5-d486-41ee-875f-5e543f2e6efa'
    AND ugm.is_active = true
),
function_modules AS (
  SELECT module
  FROM get_user_aggregated_permissions(
    '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
    '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
  )
)
SELECT 
  'Missing Modules' as info,
  am.module
FROM all_modules am
LEFT JOIN function_modules fm ON am.module = fm.module
WHERE fm.module IS NULL
ORDER BY am.module;

-- Step 5: Create a comprehensive function that includes ALL modules
CREATE OR REPLACE FUNCTION get_user_aggregated_permissions_comprehensive(user_id_param UUID, project_id_param UUID)
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
  WITH user_permissions AS (
    SELECT 
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
  )
  SELECT 
    up.module,
    up.can_access,
    up.can_view,
    up.can_add,
    up.can_edit,
    up.can_delete
  FROM user_permissions up
  ORDER BY up.module;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Test the comprehensive function
SELECT 
  'Comprehensive Function Result' as info,
  module,
  can_access,
  can_view,
  can_add,
  can_edit,
  can_delete
FROM get_user_aggregated_permissions_comprehensive(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)
ORDER BY module;

-- Step 7: Final count
SELECT 
  'Final Module Count' as info,
  COUNT(*) as module_count
FROM get_user_aggregated_permissions_comprehensive(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
);
