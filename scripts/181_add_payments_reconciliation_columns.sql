-- scripts/181_add_payments_reconciliation_columns.sql
-- เพิ่มคอลัมน์สำหรับการกระทบยอดในตาราง payments และสร้าง index ที่เกี่ยวข้อง

DO $$
BEGIN
  -- เพิ่มคอลัมน์ reconciled (ค่าเริ่มต้น false)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'payments'
      AND column_name  = 'reconciled'
  ) THEN
    ALTER TABLE public.payments
      ADD COLUMN reconciled BOOLEAN NOT NULL DEFAULT false;
  END IF;

  -- เพิ่มคอลัมน์ reconciliation_date (อนุญาตให้เป็นค่าว่างได้)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'payments'
      AND column_name  = 'reconciliation_date'
  ) THEN
    ALTER TABLE public.payments
      ADD COLUMN reconciliation_date DATE;
  END IF;

  -- เพิ่มคอลัมน์ reconciled_by (ผู้กระทบยอด) เป็น optional
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'payments'
      AND column_name  = 'reconciled_by'
  ) THEN
    ALTER TABLE public.payments
      ADD COLUMN reconciled_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;

  -- เพิ่มคอลัมน์ reconciled_at (วันที่/เวลาที่กระทบยอด)
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'payments'
      AND column_name  = 'reconciled_at'
  ) THEN
    ALTER TABLE public.payments
      ADD COLUMN reconciled_at TIMESTAMPTZ;
  END IF;
END $$;

-- สร้าง index เพื่อเพิ่มความเร็วในการค้นหาตามสถานะการกระทบยอด
CREATE INDEX IF NOT EXISTS idx_payments_reconciled
  ON public.payments(reconciled);

CREATE INDEX IF NOT EXISTS idx_payments_reconciliation_date
  ON public.payments(reconciliation_date)
  WHERE reconciliation_date IS NOT NULL;

-- Index สำหรับวิธีชำระเงินและวันที่ (รองรับการ filter บ่อย ๆ)
CREATE INDEX IF NOT EXISTS idx_payments_payment_method
  ON public.payments(payment_method);

CREATE INDEX IF NOT EXISTS idx_payments_payment_date
  ON public.payments(payment_date DESC);

-- แสดงผลสรุปหลัง migration (สำหรับตรวจสอบ)
SELECT 
  '✅ เพิ่มคอลัมน์ reconciled / reconciliation_date / reconciled_by / reconciled_at แล้ว' AS status_message,
  COUNT(*) FILTER (WHERE reconciled IS TRUE) AS total_reconciled,
  COUNT(*) FILTER (WHERE reconciled IS FALSE) AS total_unreconciled
FROM public.payments;

