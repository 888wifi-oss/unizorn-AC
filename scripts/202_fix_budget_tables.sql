-- Fix Budget Tables for Multi-Project Support

-- 1. Fix REVENUE_BUDGET
CREATE TABLE IF NOT EXISTS revenue_budget (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code TEXT NOT NULL, -- References chart_of_accounts(account_code)
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    budget_amount NUMERIC(12,2) NOT NULL CHECK (budget_amount >= 0),
    notes TEXT,
    project_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add project_id if missing
ALTER TABLE revenue_budget ADD COLUMN IF NOT EXISTS project_id UUID;

-- Update Unique Constraint to include project_id
-- First drop the old constraint if it exists (might be named differently, so we try standard names or just drop by columns if possible, but SQL requires name)
-- We'll try to drop the constraint by name if we can guess it, or just add a new unique index which acts as constraint
DO $$
BEGIN
    -- Try to drop old constraint if it exists (assuming default name or known name)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'revenue_budget_account_code_year_month_key') THEN
        ALTER TABLE revenue_budget DROP CONSTRAINT revenue_budget_account_code_year_month_key;
    END IF;
    
    -- Also check for unique index
    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'revenue_budget_account_code_year_month_key' AND n.nspname = 'public') THEN
        DROP INDEX revenue_budget_account_code_year_month_key;
    END IF;
END $$;

-- Create new unique index including project_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_revenue_budget_unique_project 
ON revenue_budget (account_code, year, month, project_id);

-- RLS for revenue_budget
ALTER TABLE revenue_budget ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON revenue_budget;
CREATE POLICY "Enable all access for authenticated users" ON revenue_budget FOR ALL TO authenticated USING (true);


-- 2. Fix EXPENSE_BUDGET
CREATE TABLE IF NOT EXISTS expense_budget (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_code TEXT NOT NULL, -- References chart_of_accounts(account_code)
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    budget_amount NUMERIC(12,2) NOT NULL CHECK (budget_amount >= 0),
    notes TEXT,
    project_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add project_id if missing
ALTER TABLE expense_budget ADD COLUMN IF NOT EXISTS project_id UUID;

-- Update Unique Constraint
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'expense_budget_account_code_year_month_key') THEN
        ALTER TABLE expense_budget DROP CONSTRAINT expense_budget_account_code_year_month_key;
    END IF;

    IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'expense_budget_account_code_year_month_key' AND n.nspname = 'public') THEN
        DROP INDEX expense_budget_account_code_year_month_key;
    END IF;
END $$;

-- Create new unique index including project_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_expense_budget_unique_project 
ON expense_budget (account_code, year, month, project_id);

-- RLS for expense_budget
ALTER TABLE expense_budget ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON expense_budget;
CREATE POLICY "Enable all access for authenticated users" ON expense_budget FOR ALL TO authenticated USING (true);

-- 3. Ensure Foreign Keys (Optional but good)
-- We won't enforce strict FK to chart_of_accounts to avoid issues if codes change, but usually good practice.
-- Skipping strict FK for now to avoid migration friction.

-- 4. Grant permissions (just in case)
GRANT ALL ON revenue_budget TO authenticated;
GRANT ALL ON expense_budget TO authenticated;
GRANT ALL ON expense_journal TO authenticated;

-- 5. Ensure expense_journal has vendor column (just in case)
ALTER TABLE expense_journal ADD COLUMN IF NOT EXISTS vendor TEXT;
