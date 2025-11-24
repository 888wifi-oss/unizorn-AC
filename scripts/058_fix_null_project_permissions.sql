-- FIX: Include NULL project_id permissions
-- แก้ไข: รวม permissions ที่มี project_id = NULL ด้วย

-- Step 1: Create new function that includes ALL permissions (including NULL project_id)
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
  JOIN user_groups ug ON ugm.user_group_id = ug.id
  JOIN user_group_permissions ugp ON ug.id = ugp.user_group_id
  WHERE ugm.user_id = user_id_param
    AND ugm.is_active = true
    AND ug.is_active = true
    -- Include ALL permissions regardless of project_id (including NULL)
  GROUP BY ugp.module
  ORDER BY ugp.module;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Test the fixed function
SELECT 
  'FIXED Function Result' as info,
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
  'FIXED Module Count' as info,
  COUNT(*) as module_count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
);

-- Step 4: Verify the fix - check if NULL project permissions are included
SELECT 
  'VERIFICATION - NULL Project Permissions Included' as info,
  module,
  can_access,
  can_view
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)
WHERE module IN ('billing', 'chart_of_accounts', 'expenses', 'financial_statements', 'general_ledger', 'journal_vouchers', 'payments', 'reports', 'revenue')
ORDER BY module;

-- Step 5: Final verification - compare before and after
SELECT 
  'BEFORE vs AFTER Comparison' as info,
  'Before Fix' as status,
  19 as module_count
UNION ALL
SELECT 
  'BEFORE vs AFTER Comparison' as info,
  'After Fix' as status,
  COUNT(*) as module_count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
);
