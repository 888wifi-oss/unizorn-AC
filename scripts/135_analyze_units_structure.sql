-- scripts/135_analyze_units_structure.sql
-- Analyze current units table structure and compare with ERD requirements

SELECT 
  '===== CURRENT UNITS TABLE STRUCTURE =====' as debug_info;

-- 1. Check current units table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'units'
ORDER BY ordinal_position;

-- 2. Check current units table constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.units'::regclass
ORDER BY conname;

-- 3. Check current units table indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'units'
ORDER BY indexname;

-- 4. Sample data from units table
SELECT 
  'Sample Units Data' as check_type,
  id,
  unit_number,
  floor,
  size,
  owner_name,
  owner_phone,
  owner_email,
  residents,
  status,
  created_at
FROM units
LIMIT 5;

-- 5. Check if project_id column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'units' 
        AND column_name = 'project_id'
    ) THEN 'project_id column EXISTS'
    ELSE 'project_id column MISSING'
  END as project_id_status;

-- 6. Check if building_id column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'units' 
        AND column_name = 'building_id'
    ) THEN 'building_id column EXISTS'
    ELSE 'building_id column MISSING'
  END as building_id_status;

-- 7. Check if unit_type column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'units' 
        AND column_name = 'unit_type'
    ) THEN 'unit_type column EXISTS'
    ELSE 'unit_type column MISSING'
  END as unit_type_status;

-- 8. Check if ownership_type column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'units' 
        AND column_name = 'ownership_type'
    ) THEN 'ownership_type column EXISTS'
    ELSE 'ownership_type column MISSING'
  END as ownership_type_status;

-- 9. Check if current_owner_id column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'units' 
        AND column_name = 'current_owner_id'
    ) THEN 'current_owner_id column EXISTS'
    ELSE 'current_owner_id column MISSING'
  END as current_owner_id_status;

-- 10. Check if current_tenant_id column exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'units' 
        AND column_name = 'current_tenant_id'
    ) THEN 'current_tenant_id column EXISTS'
    ELSE 'current_tenant_id column MISSING'
  END as current_tenant_id_status;
