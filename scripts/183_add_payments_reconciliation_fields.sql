-- scripts/183_add_payments_reconciliation_fields.sql
-- เพิ่มฟิลด์ขั้นสูงสำหรับการกระทบยอดในตาราง payments

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS reconciliation_notes TEXT,
  ADD COLUMN IF NOT EXISTS reconciliation_assignee UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reconciliation_status TEXT CHECK (reconciliation_status IN ('done', 'needs_review', 'pending')) DEFAULT 'done',
  ADD COLUMN IF NOT EXISTS reconciliation_updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payments_reconciliation_status
  ON public.payments(reconciliation_status);

