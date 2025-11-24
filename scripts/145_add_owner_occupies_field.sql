-- scripts/145_add_owner_occupies_field.sql
-- Add owner_occupies field to owners table
-- Run this script in Supabase SQL Editor

SELECT 
  '===== ADDING OWNER_OCCUPIES FIELD =====' as debug_info;

-- ========================================
-- STEP 1: ADD owner_occupies COLUMN
-- ========================================
SELECT 
  'STEP 1: Adding owner_occupies column to owners table' as step_info;

-- Add owner_occupies column
ALTER TABLE public.owners 
ADD COLUMN IF NOT EXISTS owner_occupies BOOLEAN DEFAULT false;

-- Add comment to column
COMMENT ON COLUMN public.owners.owner_occupies IS 'Indicates if the owner occupies the unit themselves (true) or rents it out (false)';

-- ========================================
-- STEP 2: CREATE INDEX
-- ========================================
SELECT 
  'STEP 2: Creating index for owner_occupies' as step_info;

CREATE INDEX IF NOT EXISTS idx_owners_owner_occupies ON public.owners(owner_occupies);

-- ========================================
-- STEP 3: VERIFICATION
-- ========================================
SELECT 
  'STEP 3: Verifying owner_occupies column' as step_info;

-- Check column exists
SELECT 
  'Column Verification' as verification_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'owners'
  AND column_name = 'owner_occupies';

-- Check index exists
SELECT 
  'Index Verification' as verification_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'owners'
  AND indexname = 'idx_owners_owner_occupies';

SELECT 
  '===== OWNER_OCCUPIES FIELD ADDED SUCCESSFULLY =====' as debug_info;
