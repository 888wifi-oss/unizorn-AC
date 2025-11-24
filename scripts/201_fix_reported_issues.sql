-- Fix reported issues: Missing tables and columns
-- Updated to handle existing tables missing columns

-- 1. Create VENDORS table (Missing)
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    tax_id TEXT,
    notes TEXT,
    project_id UUID, -- For multi-project support
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure project_id exists if table already existed
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS project_id UUID;

-- Add indexes for vendors
CREATE INDEX IF NOT EXISTS idx_vendors_project_id ON vendors(project_id);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);

-- Enable RLS for vendors
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts if re-running
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON vendors;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON vendors;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON vendors;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON vendors;

CREATE POLICY "Enable read access for authenticated users" ON vendors
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for authenticated users" ON vendors
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON vendors
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON vendors
    FOR DELETE TO authenticated USING (true);

-- 2. Ensure EXPENSE_JOURNAL exists (Might be missing)
CREATE TABLE IF NOT EXISTS expense_journal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journal_date DATE NOT NULL,
    account_code TEXT NOT NULL, -- References chart_of_accounts(account_code) but loose coupling for now
    vendor TEXT,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
    reference_number TEXT,
    project_id UUID,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist
ALTER TABLE expense_journal ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE expense_journal ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'; -- pending, approved, rejected
ALTER TABLE expense_journal ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE expense_journal ADD COLUMN IF NOT EXISTS approver TEXT;
ALTER TABLE expense_journal ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add indexes for expense_journal
CREATE INDEX IF NOT EXISTS idx_expense_journal_date ON expense_journal(journal_date);
CREATE INDEX IF NOT EXISTS idx_expense_journal_project_id ON expense_journal(project_id);
CREATE INDEX IF NOT EXISTS idx_expense_journal_status ON expense_journal(status);

-- Enable RLS for expense_journal
ALTER TABLE expense_journal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON expense_journal;
DROP POLICY IF EXISTS "Enable write access for authenticated users" ON expense_journal;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON expense_journal;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON expense_journal;

CREATE POLICY "Enable read access for authenticated users" ON expense_journal
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable write access for authenticated users" ON expense_journal
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON expense_journal
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON expense_journal
    FOR DELETE TO authenticated USING (true);

-- 3. Ensure PARCELS table exists (Used in Analytics)
CREATE TABLE IF NOT EXISTS parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_number TEXT NOT NULL, -- Can link to units(unit_number) or store directly
    recipient_name TEXT,
    courier_company TEXT,
    tracking_number TEXT,
    status TEXT DEFAULT 'pending', -- pending, picked_up
    received_at TIMESTAMPTZ DEFAULT NOW(),
    picked_up_at TIMESTAMPTZ,
    picked_up_by TEXT,
    image_url TEXT,
    project_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE parcels ADD COLUMN IF NOT EXISTS project_id UUID;

CREATE INDEX IF NOT EXISTS idx_parcels_project_id ON parcels(project_id);
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON parcels;
CREATE POLICY "Enable all access for authenticated users" ON parcels FOR ALL TO authenticated USING (true);

-- 4. Ensure NOTIFICATIONS table exists (Used in Analytics)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, warning, error, success
    recipient_id UUID, -- User ID
    is_read BOOLEAN DEFAULT false,
    project_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS recipient_id UUID;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for authenticated users" ON notifications;
CREATE POLICY "Enable all access for authenticated users" ON notifications FOR ALL TO authenticated USING (true);

-- 5. Fix Expense Approval Query Dependency
-- Ensure chart_of_accounts relationship is possible
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'expense_journal_account_code_fkey'
    ) THEN
        ALTER TABLE expense_journal 
        ADD CONSTRAINT expense_journal_account_code_fkey 
        FOREIGN KEY (account_code) 
        REFERENCES chart_of_accounts(account_code);
    END IF;
END $$;
