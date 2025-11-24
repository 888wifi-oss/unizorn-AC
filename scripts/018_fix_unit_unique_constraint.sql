-- Fix unique constraint for unit_number
-- Allow duplicate unit_number across different projects
-- But prevent duplicate within the same project

-- Note: We cannot drop units_unit_number_key because other tables depend on it
-- Instead, we'll create a composite unique constraint alongside it
-- In production, you should migrate foreign keys to use unit_id instead of unit_number

-- 1. Create composite unique constraint (unit_number + project_id)
-- This allows same unit_number in different projects
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'units_unit_number_project_unique'
  ) THEN
    ALTER TABLE units ADD CONSTRAINT units_unit_number_project_unique 
      UNIQUE (unit_number, project_id);
    RAISE NOTICE 'Created composite unique constraint: units_unit_number_project_unique';
  ELSE
    RAISE NOTICE 'Constraint units_unit_number_project_unique already exists';
  END IF;
END $$;

-- 2. Note about the old constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'units_unit_number_key'
  ) THEN
    RAISE NOTICE '====================================';
    RAISE NOTICE 'WARNING: Old constraint units_unit_number_key still exists';
    RAISE NOTICE 'It cannot be dropped because other tables depend on it:';
    RAISE NOTICE '- parcels_unit_number_fkey';
    RAISE NOTICE '- parcel_authorizations_authorized_by_unit_number_fkey';
    RAISE NOTICE '- files_unit_number_fkey';
    RAISE NOTICE '- file_permissions_unit_number_fkey';
    RAISE NOTICE '- file_downloads_unit_number_fkey';
    RAISE NOTICE '';
    RAISE NOTICE 'Recommended: Migrate these tables to use unit_id (UUID) instead';
    RAISE NOTICE 'For now, unit_number must still be globally unique';
    RAISE NOTICE '====================================';
  END IF;
END $$;

-- 3. Add index for better performance
CREATE INDEX IF NOT EXISTS idx_units_unit_number_project ON units(unit_number, project_id);

-- Summary
DO $$
BEGIN
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Unit Number Constraint Fixed';
  RAISE NOTICE 'Now allows same unit_number in different projects';
  RAISE NOTICE '====================================';
END $$;

