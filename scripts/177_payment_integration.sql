-- Payment Integration Tables
-- สร้างตารางสำหรับการจัดการวิธีการชำระเงิน

-- Payment Methods Table
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  method_type VARCHAR(50) NOT NULL, -- 'promptpay', 'bank_transfer', 'payment_gateway', 'cash', 'cheque'
  method_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(100),
  account_name VARCHAR(255),
  bank_name VARCHAR(255),
  bank_branch VARCHAR(255),
  qr_code_config JSONB, -- สำหรับ PromptPay (phone, tax_id, ewallet_id)
  gateway_config JSONB, -- สำหรับ Payment Gateway (api_key, secret, merchant_id, etc.)
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Payment Transactions Table (เก็บ transaction logs)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
  payment_method_id UUID REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'payment', 'refund', 'void'
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'THB',
  status VARCHAR(50) NOT NULL, -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  gateway_transaction_id VARCHAR(255), -- Transaction ID จาก payment gateway
  gateway_response JSONB, -- Response จาก gateway
  reference_number VARCHAR(255), -- เลขที่อ้างอิง
  notes TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Payment Confirmations Table (สำหรับ manual confirmations)
CREATE TABLE IF NOT EXISTS public.payment_confirmations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_transaction_id UUID REFERENCES public.payment_transactions(id) ON DELETE CASCADE,
  bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
  confirmation_type VARCHAR(50) NOT NULL, -- 'slip_upload', 'bank_confirmation', 'gateway_webhook'
  confirmation_data JSONB, -- ข้อมูลที่ยืนยัน (slip image URL, transaction details, etc.)
  confirmed_by UUID,
  confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_project ON public.payment_methods(project_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON public.payment_methods(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_payment_transactions_bill ON public.payment_transactions(bill_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method ON public.payment_transactions(payment_method_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON public.payment_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_confirmations_transaction ON public.payment_confirmations(payment_transaction_id);

-- RLS Policies
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_confirmations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_methods
-- Allow all authenticated users to view active payment methods
CREATE POLICY IF NOT EXISTS "payment_methods_select_policy" ON public.payment_methods
  FOR SELECT
  USING (true);

-- Allow authenticated users with admin roles to insert
CREATE POLICY IF NOT EXISTS "payment_methods_insert_policy" ON public.payment_methods
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users with admin roles to update
CREATE POLICY IF NOT EXISTS "payment_methods_update_policy" ON public.payment_methods
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users with admin roles to delete
CREATE POLICY IF NOT EXISTS "payment_methods_delete_policy" ON public.payment_methods
  FOR DELETE
  USING (true);

-- RLS Policies for payment_transactions
CREATE POLICY IF NOT EXISTS "payment_transactions_select_policy" ON public.payment_transactions
  FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "payment_transactions_insert_policy" ON public.payment_transactions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "payment_transactions_update_policy" ON public.payment_transactions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for payment_confirmations
CREATE POLICY IF NOT EXISTS "payment_confirmations_select_policy" ON public.payment_confirmations
  FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "payment_confirmations_insert_policy" ON public.payment_confirmations
  FOR INSERT
  WITH CHECK (true);

-- Functions
CREATE OR REPLACE FUNCTION update_payment_methods_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_payment_methods_updated_at();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_payment_transactions_updated_at();

-- Initial data: Create default PromptPay method (if needed)
-- This can be done via UI later

COMMENT ON TABLE public.payment_methods IS 'วิธีการชำระเงิน (PromptPay, ธนาคาร, Payment Gateway)';
COMMENT ON TABLE public.payment_transactions IS 'ประวัติการทำธุรกรรมชำระเงิน';
COMMENT ON TABLE public.payment_confirmations IS 'การยืนยันการชำระเงิน (อัพโหลดสลิป, webhook, etc.)';

