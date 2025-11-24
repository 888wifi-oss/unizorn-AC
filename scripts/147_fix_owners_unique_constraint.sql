-- scripts/147_fix_owners_unique_constraint.sql
-- Fix owners table unique constraint
-- Run this script in Supabase SQL Editor

SELECT 
  '===== FIXING OWNERS UNIQUE CONSTRAINT =====' as debug_info;

-- ========================================
-- STEP 1: CHECK CURRENT CONSTRAINTS
-- ========================================
SELECT 
  'STEP 1: Checking current constraints' as step_info;

SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.owners'::regclass
ORDER BY conname;

-- ========================================
-- STEP 2: DROP EXISTING UNIQUE CONSTRAINT
-- ========================================
SELECT 
  'STEP 2: Dropping existing unique constraint' as step_info;

-- Drop the unique constraint on national_id
ALTER TABLE public.owners 
DROP CONSTRAINT IF EXISTS owners_national_id_key;

-- ========================================
-- STEP 3: CREATE INDEX INSTEAD
-- ========================================
SELECT 
  'STEP 3: Creating index instead of unique constraint' as step_info;

-- Create non-unique index for better performance
CREATE INDEX IF NOT EXISTS idx_owners_national_id ON public.owners(national_id);

-- ========================================
-- STEP 4: VERIFICATION
-- ========================================
SELECT 
  'STEP 4: Verifying changes' as step_info;

-- Check constraints
SELECT 
  'Constraints Verification' as verification_type,
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.owners'::regclass
ORDER BY conname;

-- Check indexes
SELECT 
  'Indexes Verification' as verification_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'owners'
  AND indexname = 'idx_owners_national_id';

SELECT 
  '===== OWNERS UNIQUE CONSTRAINT FIXED SUCCESSFULLY =====' as debug_info;
