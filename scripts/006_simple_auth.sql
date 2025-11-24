-- scripts/006_simple_auth.sql

-- Add password column back to units table for simple authentication
ALTER TABLE public.units
ADD COLUMN password TEXT;

-- Add simple authentication functions
-- This will allow residents to login with unit_number + password
-- without requiring Supabase Auth

-- Update RLS policies to allow password-based authentication
DROP POLICY IF EXISTS "Allow read access to own unit" ON public.units;
DROP POLICY IF EXISTS "Allow update access to own unit" ON public.units;
DROP POLICY IF EXISTS "Allow insert access to own unit" ON public.units;
DROP POLICY IF EXISTS "Allow delete access to own unit" ON public.units;

-- Allow all operations on units (since we're using simple auth)
CREATE POLICY "Allow all operations on units" ON public.units FOR ALL USING (true);
