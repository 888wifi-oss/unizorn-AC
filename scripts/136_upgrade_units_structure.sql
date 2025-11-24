-- scripts/136_upgrade_units_structure.sql
-- Upgrade units table structure to match ERD requirements

SELECT 
  '===== UPGRADING UNITS TABLE STRUCTURE =====' as debug_info;

-- 1. Add project_id column (if not exists)
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- 2. Add building_id column (if not exists)
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS building_id VARCHAR(50);

-- 3. Add unit_type column (if not exists)
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS unit_type VARCHAR(50) DEFAULT 'condo';

-- 4. Add ownership_type column (if not exists)
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(50) DEFAULT 'freehold';

-- 5. Add current_owner_id column (if not exists)
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS current_owner_id UUID;

-- 6. Add current_tenant_id column (if not exists)
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS current_tenant_id UUID;

-- 7. Add additional columns for better unit management
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

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_units_project_id ON public.units(project_id);
CREATE INDEX IF NOT EXISTS idx_units_building_id ON public.units(building_id);
CREATE INDEX IF NOT EXISTS idx_units_unit_type ON public.units(unit_type);
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);
CREATE INDEX IF NOT EXISTS idx_units_ownership_type ON public.units(ownership_type);
CREATE INDEX IF NOT EXISTS idx_units_current_owner_id ON public.units(current_owner_id);
CREATE INDEX IF NOT EXISTS idx_units_current_tenant_id ON public.units(current_tenant_id);

-- 9. Update existing data with default values
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

-- 10. Verify the updated structure
SELECT 
  'Updated Units Table Structure' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'units'
ORDER BY ordinal_position;

-- 11. Check constraints
SELECT 
  'Updated Constraints' as check_type,
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.units'::regclass
ORDER BY conname;

-- 12. Check indexes
SELECT 
  'Updated Indexes' as check_type,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'units'
ORDER BY indexname;
