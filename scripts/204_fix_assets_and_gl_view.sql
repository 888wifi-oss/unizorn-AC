-- Fix Fixed Assets and General Ledger View

-- 1. Ensure FIXED_ASSETS table exists
CREATE TABLE IF NOT EXISTS fixed_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_name TEXT NOT NULL,
    asset_code TEXT,
    description TEXT,
    purchase_date DATE NOT NULL,
    purchase_cost NUMERIC(12, 2) NOT NULL,
    lifespan_years INTEGER NOT NULL,
    salvage_value NUMERIC(12, 2) DEFAULT 0,
    status TEXT DEFAULT 'in_use', -- in_use, sold, written_off
    location TEXT,
    asset_account_code TEXT,
    depreciation_account_code TEXT,
    expense_account_code TEXT,
    project_id UUID,
    last_depreciation_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure project_id column exists (if table already existed)
ALTER TABLE fixed_assets ADD COLUMN IF NOT EXISTS project_id UUID;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_fixed_assets_project_id ON fixed_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_code ON fixed_assets(asset_code);

-- Enable RLS and allow Public access (for Mock Auth)
ALTER TABLE fixed_assets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for public" ON fixed_assets;
CREATE POLICY "Enable all access for public" ON fixed_assets FOR ALL TO public USING (true);


-- 2. Fix GENERAL_LEDGER_VIEW
-- Recreate the view to ensure project_id is included
DROP VIEW IF EXISTS general_ledger_view;

CREATE OR REPLACE VIEW general_ledger_view AS
SELECT 
    gl.id,
    gl.transaction_date as journal_date,
    gl.account_code,
    coa.account_name,
    coa.account_type,
    gl.debit,
    gl.credit,
    gl.description,
    gl.reference_type,
    gl.reference_id,
    gl.project_id,
    gl.created_at,
    gl.created_by
FROM general_ledger gl
LEFT JOIN chart_of_accounts coa ON gl.account_code = coa.account_code;

-- Grant access to the view
GRANT SELECT ON general_ledger_view TO public;
GRANT SELECT ON general_ledger_view TO authenticated;
