-- Final verification: Check if we have all menu items
-- ตรวจสอบสุดท้าย: ดูว่าเรามีเมนูครบหรือไม่

-- Step 1: Check what we have in current permissions
SELECT 
  'Current Permissions' as info,
  module
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)
ORDER BY module;

-- Step 2: Count total menu items vs permissions
SELECT 
  'Final Verification' as info,
  'Total Menu Items' as type,
  35 as count
UNION ALL
SELECT 
  'Final Verification' as info,
  'Current Permissions' as type,
  COUNT(*) as count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)
UNION ALL
SELECT 
  'Final Verification' as info,
  'Missing Items' as type,
  35 - COUNT(*) as count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
);

-- Step 3: Check if there are any duplicate modules
SELECT 
  'Duplicate Check' as info,
  module,
  COUNT(*) as count
FROM get_user_aggregated_permissions(
  '386ac5d5-d486-41ee-875f-5e543f2e6efa'::uuid,
  '95ae2a41-cc9e-45d0-8dfc-38b635c06457'::uuid
)
GROUP BY module
HAVING COUNT(*) > 1
ORDER BY module;
