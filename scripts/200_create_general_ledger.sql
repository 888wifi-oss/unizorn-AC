-- Create General Ledger Table
CREATE TABLE IF NOT EXISTS general_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_date DATE NOT NULL,
    account_code VARCHAR(20) NOT NULL,
    debit DECIMAL(12, 2) DEFAULT 0.00,
    credit DECIMAL(12, 2) DEFAULT 0.00,
    description TEXT,
    reference_type VARCHAR(50), -- 'bill', 'payment', 'expense', 'adjustment'
    reference_id UUID,
    project_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_gl_transaction_date ON general_ledger(transaction_date);
CREATE INDEX IF NOT EXISTS idx_gl_account_code ON general_ledger(account_code);
CREATE INDEX IF NOT EXISTS idx_gl_project_id ON general_ledger(project_id);
CREATE INDEX IF NOT EXISTS idx_gl_reference ON general_ledger(reference_id, reference_type);

-- Enable RLS
ALTER TABLE general_ledger ENABLE ROW LEVEL SECURITY;

-- Create Policy for reading (similar to other tables)
CREATE POLICY "Enable read access for authenticated users" ON general_ledger
    FOR SELECT
    TO authenticated
    USING (true); -- Refine this based on project_id if needed later

-- Create Policy for insert
CREATE POLICY "Enable insert access for authenticated users" ON general_ledger
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- MIGRATION: Backfill from Revenue Journal (Bills)
-- Revenue Journal currently stores: bill_id, account_code, amount (Credit side implied)
-- We need to create the Credit entry for Revenue
INSERT INTO general_ledger (transaction_date, account_code, credit, description, reference_type, reference_id, project_id)
SELECT 
    journal_date,
    account_code,
    amount, -- Revenue is Credit
    'Revenue from Bill #' || b.bill_number,
    'bill',
    bill_id,
    rj.project_id
FROM revenue_journal rj
LEFT JOIN bills b ON rj.bill_id = b.id
WHERE NOT EXISTS (
    SELECT 1 FROM general_ledger gl 
    WHERE gl.reference_id = rj.bill_id 
    AND gl.reference_type = 'bill' 
    AND gl.account_code = rj.account_code
);

-- MIGRATION: Backfill AR side for Bills (Debit)
-- For every bill, we need a Debit to Accounts Receivable (e.g., 1201)
-- We sum the revenue entries per bill to get the total AR debit
INSERT INTO general_ledger (transaction_date, account_code, debit, description, reference_type, reference_id, project_id)
SELECT 
    b.due_date, -- Or created_at
    '1201', -- Default AR Account Code
    b.total,
    'Accounts Receivable for Bill #' || b.bill_number,
    'bill',
    b.id,
    b.project_id
FROM bills b
WHERE b.status != 'cancelled'
AND NOT EXISTS (
    SELECT 1 FROM general_ledger gl 
    WHERE gl.reference_id = b.id 
    AND gl.reference_type = 'bill' 
    AND gl.account_code = '1201'
);

-- MIGRATION: Backfill from Expense Journal
-- Expense Journal currently stores: account_code, amount (Debit side implied)
INSERT INTO general_ledger (transaction_date, account_code, debit, description, reference_type, reference_id, project_id)
SELECT 
    journal_date,
    account_code,
    amount, -- Expense is Debit
    description,
    'expense',
    id,
    project_id
FROM expense_journal ej
WHERE NOT EXISTS (
    SELECT 1 FROM general_ledger gl 
    WHERE gl.reference_id = ej.id 
    AND gl.reference_type = 'expense' 
    AND gl.account_code = ej.account_code
);

-- MIGRATION: Backfill Credit side for Expenses (Cash/AP)
-- Assuming paid by Cash (1101) for now, or AP if we had that info. 
-- For simplicity in backfill, we'll assume Cash (1101) for direct expenses.
INSERT INTO general_ledger (transaction_date, account_code, credit, description, reference_type, reference_id, project_id)
SELECT 
    journal_date,
    '1101', -- Default Cash Account
    amount,
    'Payment for Expense: ' || description,
    'expense',
    id,
    project_id
FROM expense_journal ej
WHERE NOT EXISTS (
    SELECT 1 FROM general_ledger gl 
    WHERE gl.reference_id = ej.id 
    AND gl.reference_type = 'expense' 
    AND gl.account_code = '1101'
);

-- Create View for easier querying of balances
CREATE OR REPLACE VIEW view_account_balances AS
SELECT 
    account_code,
    SUM(debit) as total_debit,
    SUM(credit) as total_credit,
    SUM(debit - credit) as net_balance, -- Asset/Expense (Normal Debit)
    SUM(credit - debit) as net_balance_credit -- Liability/Equity/Revenue (Normal Credit)
FROM general_ledger
GROUP BY account_code;
