-- scripts/141_complete_migration_execution.sql
-- Complete Migration Execution Script
-- Run this script in Supabase SQL Editor to complete the migration

SELECT 
  '===== STARTING COMPLETE MIGRATION EXECUTION =====' as debug_info;

-- ========================================
-- STEP 1: ANALYZE CURRENT STRUCTURE
-- ========================================
SELECT 
  'STEP 1: Analyzing current units table structure' as step_info;

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
-- STEP 2: UPGRADE UNITS TABLE
-- ========================================
SELECT 
  'STEP 2: Upgrading units table structure' as step_info;

-- Add project_id column
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- Add building_id column
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS building_id VARCHAR(50);

-- Add unit_type column
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS unit_type VARCHAR(50) DEFAULT 'condo';

-- Add ownership_type column
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(50) DEFAULT 'freehold';

-- Add current_owner_id column
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS current_owner_id UUID;

-- Add current_tenant_id column
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS current_tenant_id UUID;

-- Add additional columns
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS number_of_bedrooms INTEGER DEFAULT 1;

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS number_of_bathrooms INTEGER DEFAULT 1;

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS furnishing_status VARCHAR(50) DEFAULT 'unfurnished';

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS view_type VARCHAR(50);

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS parking_space_count INTEGER DEFAULT 0;

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS parking_space_number VARCHAR(20);

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS default_rental_price NUMERIC DEFAULT 0;

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS sale_price NUMERIC DEFAULT 0;

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS unit_layout_image_url TEXT;

-- ========================================
-- STEP 3: CREATE NEW TABLES
-- ========================================
SELECT 
  'STEP 3: Creating new tables' as step_info;

-- Create OWNERS table
CREATE TABLE IF NOT EXISTS public.owners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  national_id VARCHAR(20) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  is_primary BOOLEAN DEFAULT true,
  ownership_percentage DECIMAL(5,2) DEFAULT 100.00,
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create TENANTS table
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.owners(id) ON DELETE SET NULL,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  national_id VARCHAR(20),
  gender VARCHAR(10),
  date_of_birth DATE,
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  move_in_date DATE,
  move_out_date DATE,
  rental_contract_no VARCHAR(100),
  rental_price NUMERIC DEFAULT 0,
  deposit_amount NUMERIC DEFAULT 0,
  payment_method VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create TENANCY_HISTORY table
CREATE TABLE IF NOT EXISTS public.tenancy_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  rental_contract_no VARCHAR(100),
  rental_start_date DATE NOT NULL,
  rental_end_date DATE,
  rental_price NUMERIC DEFAULT 0,
  deposit_amount NUMERIC DEFAULT 0,
  move_in_date DATE,
  move_out_date DATE,
  status VARCHAR(50) DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create RENTAL_PAYMENTS table
CREATE TABLE IF NOT EXISTS public.rental_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  month VARCHAR(10) NOT NULL,
  year INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_date DATE,
  payment_method VARCHAR(50),
  reference_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- STEP 4: CREATE INDEXES
-- ========================================
SELECT 
  'STEP 4: Creating indexes for better performance' as step_info;

-- Units indexes
CREATE INDEX IF NOT EXISTS idx_units_project_id ON public.units(project_id);
CREATE INDEX IF NOT EXISTS idx_units_building_id ON public.units(building_id);
CREATE INDEX IF NOT EXISTS idx_units_unit_type ON public.units(unit_type);
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);
CREATE INDEX IF NOT EXISTS idx_units_ownership_type ON public.units(ownership_type);
CREATE INDEX IF NOT EXISTS idx_units_current_owner_id ON public.units(current_owner_id);
CREATE INDEX IF NOT EXISTS idx_units_current_tenant_id ON public.units(current_tenant_id);

-- Owners indexes
CREATE INDEX IF NOT EXISTS idx_owners_unit_id ON public.owners(unit_id);
CREATE INDEX IF NOT EXISTS idx_owners_national_id ON public.owners(national_id);
CREATE INDEX IF NOT EXISTS idx_owners_email ON public.owners(email);
CREATE INDEX IF NOT EXISTS idx_owners_phone ON public.owners(phone);

-- Tenants indexes
CREATE INDEX IF NOT EXISTS idx_tenants_unit_id ON public.tenants(unit_id);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_company_id ON public.tenants(company_id);
CREATE INDEX IF NOT EXISTS idx_tenants_national_id ON public.tenants(national_id);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON public.tenants(email);
CREATE INDEX IF NOT EXISTS idx_tenants_phone ON public.tenants(phone);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

-- Tenancy history indexes
CREATE INDEX IF NOT EXISTS idx_tenancy_history_unit_id ON public.tenancy_history(unit_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_history_tenant_id ON public.tenancy_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_history_status ON public.tenancy_history(status);

-- Rental payments indexes
CREATE INDEX IF NOT EXISTS idx_rental_payments_tenant_id ON public.rental_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_payments_unit_id ON public.rental_payments(unit_id);
CREATE INDEX IF NOT EXISTS idx_rental_payments_month_year ON public.rental_payments(month, year);
CREATE INDEX IF NOT EXISTS idx_rental_payments_status ON public.rental_payments(status);

-- ========================================
-- STEP 5: ADD FOREIGN KEY CONSTRAINTS
-- ========================================
SELECT 
  'STEP 5: Adding foreign key constraints' as step_info;

-- Add foreign key constraints to units table
ALTER TABLE public.units 
ADD CONSTRAINT fk_units_current_owner 
FOREIGN KEY (current_owner_id) REFERENCES public.owners(id) ON DELETE SET NULL;

ALTER TABLE public.units 
ADD CONSTRAINT fk_units_current_tenant 
FOREIGN KEY (current_tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;

-- ========================================
-- STEP 6: UPDATE EXISTING DATA
-- ========================================
SELECT 
  'STEP 6: Updating existing data with default values' as step_info;

-- Update existing units with default values
UPDATE public.units 
SET 
  project_id = (SELECT id FROM public.projects LIMIT 1),
  unit_type = 'condo',
  ownership_type = 'freehold',
  number_of_bedrooms = 1,
  number_of_bathrooms = 1,
  furnishing_status = 'unfurnished',
  parking_space_count = 0,
  default_rental_price = 0,
  sale_price = 0
WHERE project_id IS NULL;

-- ========================================
-- STEP 7: MIGRATE EXISTING DATA
-- ========================================
SELECT 
  'STEP 7: Migrating existing data' as step_info;

-- Create owners from existing unit data
INSERT INTO public.owners (
  unit_id,
  name,
  email,
  phone,
  is_primary,
  ownership_percentage,
  start_date,
  notes
)
SELECT 
  u.id as unit_id,
  u.owner_name as name,
  u.owner_email as email,
  u.owner_phone as phone,
  true as is_primary,
  100.00 as ownership_percentage,
  u.created_at::date as start_date,
  'Migrated from existing unit data' as notes
FROM public.units u
WHERE u.owner_name IS NOT NULL
  AND u.owner_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM public.owners o 
    WHERE o.unit_id = u.id
  );

-- Update units table with current_owner_id
UPDATE public.units 
SET current_owner_id = o.id
FROM public.owners o
WHERE units.id = o.unit_id
  AND units.current_owner_id IS NULL;

-- ========================================
-- STEP 8: ENABLE ROW LEVEL SECURITY
-- ========================================
SELECT 
  'STEP 8: Enabling Row Level Security' as step_info;

-- Enable RLS
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenancy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_payments ENABLE ROW LEVEL SECURITY;

-- ========================================
-- STEP 9: CREATE RLS POLICIES
-- ========================================
SELECT 
  'STEP 9: Creating RLS policies' as step_info;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view owners of their units" ON public.owners;
DROP POLICY IF EXISTS "Service role can manage all owners" ON public.owners;
DROP POLICY IF EXISTS "Users can view tenants of their units" ON public.tenants;
DROP POLICY IF EXISTS "Service role can manage all tenants" ON public.tenants;
DROP POLICY IF EXISTS "Users can view tenancy history of their units" ON public.tenancy_history;
DROP POLICY IF EXISTS "Service role can manage all tenancy history" ON public.tenancy_history;
DROP POLICY IF EXISTS "Users can view rental payments of their units" ON public.rental_payments;
DROP POLICY IF EXISTS "Service role can manage all rental payments" ON public.rental_payments;

-- Create new policies
-- Owners policies
CREATE POLICY "Users can view owners of their units" ON public.owners 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.units 
      WHERE units.id = owners.unit_id 
      AND units.project_id IN (
        SELECT project_id FROM public.user_projects 
        WHERE user_id = auth.uid()
      )
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Service role can manage all owners" ON public.owners 
  FOR ALL USING (auth.role() = 'service_role');

-- Tenants policies
CREATE POLICY "Users can view tenants of their units" ON public.tenants 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.units 
      WHERE units.id = tenants.unit_id 
      AND units.project_id IN (
        SELECT project_id FROM public.user_projects 
        WHERE user_id = auth.uid()
      )
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Service role can manage all tenants" ON public.tenants 
  FOR ALL USING (auth.role() = 'service_role');

-- Tenancy history policies
CREATE POLICY "Users can view tenancy history of their units" ON public.tenancy_history 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.units 
      WHERE units.id = tenancy_history.unit_id 
      AND units.project_id IN (
        SELECT project_id FROM public.user_projects 
        WHERE user_id = auth.uid()
      )
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Service role can manage all tenancy history" ON public.tenancy_history 
  FOR ALL USING (auth.role() = 'service_role');

-- Rental payments policies
CREATE POLICY "Users can view rental payments of their units" ON public.rental_payments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.units 
      WHERE units.id = rental_payments.unit_id 
      AND units.project_id IN (
        SELECT project_id FROM public.user_projects 
        WHERE user_id = auth.uid()
      )
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Service role can manage all rental payments" ON public.rental_payments 
  FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- STEP 10: VERIFICATION
-- ========================================
SELECT 
  'STEP 10: Verifying migration results' as step_info;

-- Verify units table structure
SELECT 
  'Units Table Structure After Migration' as verification_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'units'
ORDER BY ordinal_position;

-- Verify new tables
SELECT 
  'New Tables Created' as verification_type,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('owners', 'tenants', 'tenancy_history', 'rental_payments')
ORDER BY table_name;

-- Verify data migration
SELECT 
  'Data Migration Verification' as verification_type,
  COUNT(*) as total_units,
  COUNT(current_owner_id) as units_with_owners,
  COUNT(current_tenant_id) as units_with_tenants
FROM public.units;

-- Check owners data
SELECT 
  'Owners Data Verification' as verification_type,
  COUNT(*) as total_owners,
  COUNT(CASE WHEN is_primary = true THEN 1 END) as primary_owners,
  COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as owners_with_email,
  COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as owners_with_phone
FROM public.owners;

-- Check constraints
SELECT 
  'Constraints Verification' as verification_type,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid IN (
  'public.units'::regclass,
  'public.owners'::regclass,
  'public.tenants'::regclass,
  'public.tenancy_history'::regclass,
  'public.rental_payments'::regclass
)
ORDER BY conname;

-- Check indexes
SELECT 
  'Indexes Verification' as verification_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('units', 'owners', 'tenants', 'tenancy_history', 'rental_payments')
ORDER BY tablename, indexname;

SELECT 
  '===== MIGRATION COMPLETED SUCCESSFULLY =====' as debug_info;
