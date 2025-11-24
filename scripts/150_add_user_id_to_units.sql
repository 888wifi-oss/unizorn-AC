-- scripts/150_add_user_id_to_units.sql
-- Add user_id column to units table

SELECT 
  '===== ADDING USER_ID COLUMN TO UNITS TABLE =====' as debug_info;

-- Add user_id column to units table for Supabase Auth integration
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_units_user_id ON public.units(user_id);

-- Verify column addition
SELECT 
  'Column Verification' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'units'
  AND column_name = 'user_id';

SELECT 
  '===== USER_ID COLUMN ADDED SUCCESSFULLY =====' as debug_info;

