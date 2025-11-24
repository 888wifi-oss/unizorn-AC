-- scripts/146_fix_legacy_columns.sql
-- Fix legacy columns in units table
-- Run this script in Supabase SQL Editor

SELECT 
  '===== FIXING LEGACY COLUMNS IN UNITS TABLE =====' as debug_info;

-- ========================================
-- STEP 1: CHECK CURRENT COLUMNS
-- ========================================
SELECT 
  'STEP 1: Checking current columns in units table' as step_info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'units'
ORDER BY ordinal_position;

-- ========================================
-- STEP 2: ALTER COLUMNS TO NULLABLE
-- ========================================
SELECT 
  'STEP 2: Altering legacy columns to nullable' as step_info;

-- Make owner_name nullable
ALTER TABLE public.units 
ALTER COLUMN owner_name DROP NOT NULL;

-- Make owner_phone nullable
ALTER TABLE public.units 
ALTER COLUMN owner_phone DROP NOT NULL;

-- Make owner_email nullable
ALTER TABLE public.units 
ALTER COLUMN owner_email DROP NOT NULL;

-- Make residents nullable
ALTER TABLE public.units 
ALTER COLUMN residents DROP NOT NULL;

-- ========================================
-- STEP 3: UPDATE EXISTING DATA
-- ========================================
SELECT 
  'STEP 3: Updating existing data with default values' as step_info;

-- Set NULL values to empty string for legacy columns
UPDATE public.units 
SET 
  owner_name = '',
  owner_phone = '',
  owner_email = '',
  residents = 1
WHERE owner_name IS NULL;

-- ========================================
-- STEP 4: VERIFICATION
-- ========================================
SELECT 
  'STEP 4: Verifying column changes' as step_info;

-- Check nullable columns
SELECT 
  'Nullable Columns Verification' as verification_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'units'
  AND column_name IN ('owner_name', 'owner_phone', 'owner_email', 'residents')
ORDER BY column_name;

SELECT 
  '===== LEGACY COLUMNS FIXED SUCCESSFULLY =====' as debug_info;
