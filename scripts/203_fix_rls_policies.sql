-- Fix RLS Policies to allow Public/Anon access (Required for Mock Auth usage)

-- 1. REVENUE_BUDGET
ALTER TABLE revenue_budget ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON revenue_budget;
DROP POLICY IF EXISTS "Enable all access for public" ON revenue_budget;
CREATE POLICY "Enable all access for public" ON revenue_budget FOR ALL TO public USING (true);

-- 2. EXPENSE_BUDGET
ALTER TABLE expense_budget ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON expense_budget;
DROP POLICY IF EXISTS "Enable all access for public" ON expense_budget;
CREATE POLICY "Enable all access for public" ON expense_budget FOR ALL TO public USING (true);

-- 3. EXPENSE_JOURNAL
ALTER TABLE expense_journal ENABLE ROW LEVEL SECURITY;
-- Drop old specific policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON expense_journal;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON expense_journal;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON expense_journal;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON expense_journal;
DROP POLICY IF EXISTS "Enable all access for public" ON expense_journal;
-- Create new catch-all policy
CREATE POLICY "Enable all access for public" ON expense_journal FOR ALL TO public USING (true);

-- 4. VENDORS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON vendors;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON vendors;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON vendors;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON vendors;
DROP POLICY IF EXISTS "Enable all access for public" ON vendors;
CREATE POLICY "Enable all access for public" ON vendors FOR ALL TO public USING (true);

-- 5. PARCELS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON parcels;
DROP POLICY IF EXISTS "Enable all access for public" ON parcels;
CREATE POLICY "Enable all access for public" ON parcels FOR ALL TO public USING (true);

-- 6. NOTIFICATIONS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON notifications;
DROP POLICY IF EXISTS "Enable all access for public" ON notifications;
CREATE POLICY "Enable all access for public" ON notifications FOR ALL TO public USING (true);

-- 7. GENERAL_LEDGER
CREATE TABLE IF NOT EXISTS general_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL,
    account_code VARCHAR(20) NOT NULL,
    debit DECIMAL(12, 2) DEFAULT 0.00,
    credit DECIMAL(12, 2) DEFAULT 0.00,
    description TEXT,
    reference_type VARCHAR(50),
    reference_id UUID,
    project_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

ALTER TABLE general_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON general_ledger;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON general_ledger;
DROP POLICY IF EXISTS "Enable all access for public" ON general_ledger;
CREATE POLICY "Enable all access for public" ON general_ledger FOR ALL TO public USING (true);

-- 8. BILLS & PAYMENTS (Just in case)
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for public" ON bills;
CREATE POLICY "Enable all access for public" ON bills FOR ALL TO public USING (true);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for public" ON payments;
CREATE POLICY "Enable all access for public" ON payments FOR ALL TO public USING (true);
