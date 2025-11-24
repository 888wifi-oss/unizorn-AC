-- Add project_id to all tables for multi-project support
-- This allows data to be scoped to specific projects
-- Note: Uses DO blocks to handle non-existent tables gracefully

-- Helper function to add project_id column
CREATE OR REPLACE FUNCTION add_project_id_column(p_table_name TEXT) 
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE tables.table_name = p_table_name) THEN
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id)', p_table_name);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_project_id ON %I(project_id)', p_table_name, p_table_name);
    EXECUTE format('COMMENT ON COLUMN %I.project_id IS ''Project scope for this record''', p_table_name);
    RAISE NOTICE 'Added project_id to % table', p_table_name;
  ELSE
    RAISE NOTICE 'Table % does not exist - skipping', p_table_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
SELECT add_project_id_column('units');

-- Add display_unit_number column to units table for showing original number
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'units') THEN
    ALTER TABLE units ADD COLUMN IF NOT EXISTS display_unit_number TEXT;
    COMMENT ON COLUMN units.display_unit_number IS 'Original unit number for display (without project prefix)';
    RAISE NOTICE 'Added display_unit_number to units table';
  END IF;
END $$;
SELECT add_project_id_column('announcements');
SELECT add_project_id_column('maintenance_tickets');
SELECT add_project_id_column('billing');
SELECT add_project_id_column('payments');
SELECT add_project_id_column('resident_accounts');
SELECT add_project_id_column('documents');
SELECT add_project_id_column('parcels');
SELECT add_project_id_column('notifications');
SELECT add_project_id_column('income_expenses');
SELECT add_project_id_column('common_fees');
SELECT add_project_id_column('funds');
SELECT add_project_id_column('budgets');
SELECT add_project_id_column('contracts');
SELECT add_project_id_column('parking');
SELECT add_project_id_column('facilities');
SELECT add_project_id_column('visitors');

-- Drop helper function
DROP FUNCTION IF EXISTS add_project_id_column(TEXT);

-- Summary
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.columns
  WHERE column_name = 'project_id'
  AND table_schema = 'public';
  
  RAISE NOTICE '====================================';
  RAISE NOTICE 'Project ID Migration Complete';
  RAISE NOTICE 'Total tables with project_id: %', table_count;
  RAISE NOTICE '====================================';
END $$;
