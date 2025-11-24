-- scripts/137_create_owner_tenant_tables.sql
-- Create OWNER and TENANT tables according to ERD

SELECT 
  '===== CREATING OWNER AND TENANT TABLES =====' as debug_info;

-- 1. Create OWNER table
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

-- 2. Create TENANT table
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

-- 3. Create TENANCY_HISTORY table
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

-- 4. Create RENTAL_PAYMENT table
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

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_owners_unit_id ON public.owners(unit_id);
CREATE INDEX IF NOT EXISTS idx_owners_national_id ON public.owners(national_id);
CREATE INDEX IF NOT EXISTS idx_owners_email ON public.owners(email);
CREATE INDEX IF NOT EXISTS idx_owners_phone ON public.owners(phone);

CREATE INDEX IF NOT EXISTS idx_tenants_unit_id ON public.tenants(unit_id);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_id ON public.tenants(owner_id);
CREATE INDEX IF NOT EXISTS idx_tenants_company_id ON public.tenants(company_id);
CREATE INDEX IF NOT EXISTS idx_tenants_national_id ON public.tenants(national_id);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON public.tenants(email);
CREATE INDEX IF NOT EXISTS idx_tenants_phone ON public.tenants(phone);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);

CREATE INDEX IF NOT EXISTS idx_tenancy_history_unit_id ON public.tenancy_history(unit_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_history_tenant_id ON public.tenancy_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenancy_history_status ON public.tenancy_history(status);

CREATE INDEX IF NOT EXISTS idx_rental_payments_tenant_id ON public.rental_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rental_payments_unit_id ON public.rental_payments(unit_id);
CREATE INDEX IF NOT EXISTS idx_rental_payments_month_year ON public.rental_payments(month, year);
CREATE INDEX IF NOT EXISTS idx_rental_payments_status ON public.rental_payments(status);

-- 6. Add foreign key constraints to units table
ALTER TABLE public.units 
ADD CONSTRAINT fk_units_current_owner 
FOREIGN KEY (current_owner_id) REFERENCES public.owners(id) ON DELETE SET NULL;

ALTER TABLE public.units 
ADD CONSTRAINT fk_units_current_tenant 
FOREIGN KEY (current_tenant_id) REFERENCES public.tenants(id) ON DELETE SET NULL;

-- 7. Enable Row Level Security
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenancy_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_payments ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
-- Owners policies
CREATE POLICY "Users can view owners of their units" ON public.owners 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.units 
      WHERE units.id = owners.unit_id 
      AND units.user_id = auth.uid()
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
      AND units.user_id = auth.uid()
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
      AND units.user_id = auth.uid()
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
      AND units.user_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Service role can manage all rental payments" ON public.rental_payments 
  FOR ALL USING (auth.role() = 'service_role');

-- 9. Verify table creation
SELECT 
  'Table Creation Verification' as check_type,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('owners', 'tenants', 'tenancy_history', 'rental_payments')
ORDER BY table_name;
