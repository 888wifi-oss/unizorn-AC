-- scripts/184_performance_indexes_phase1.sql
-- Phase 1: Performance Optimization - Database Indexes
-- เพิ่ม indexes สำหรับคอลัมน์ที่ใช้ filter บ่อยเพื่อเพิ่มประสิทธิภาพการ query

-- ============================================
-- 1. PROJECT_ID INDEXES (สำหรับ Project Filtering)
-- ============================================

-- Bills - ใช้บ่อยมากในการ filter - ตรวจสอบ project_id column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'project_id'
  ) THEN
    -- ตรวจสอบว่า status column มีอยู่จริง
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'bills' 
      AND column_name = 'status'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_bills_project_status 
        ON public.bills(project_id, status) 
        WHERE project_id IS NOT NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_bills_project_month 
      ON public.bills(project_id, month) 
      WHERE project_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_bills_project_unit 
      ON public.bills(project_id, unit_id) 
      WHERE project_id IS NOT NULL;
  END IF;
END $$;

-- Payments - ใช้บ่อยมาก - ตรวจสอบ project_id column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'project_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_payments_project_date 
      ON public.payments(project_id, payment_date DESC) 
      WHERE project_id IS NOT NULL;

    -- Note: payments table may not have 'status' column, check first
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'payments' 
      AND column_name = 'status'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_payments_project_status 
        ON public.payments(project_id, status) 
        WHERE project_id IS NOT NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_payments_project_reconciled 
      ON public.payments(project_id, reconciled) 
      WHERE project_id IS NOT NULL AND reconciled IS NOT NULL;
  END IF;
END $$;

-- Units - ใช้บ่อยมาก - ตรวจสอบ project_id column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'units' 
    AND column_name = 'project_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_units_project_status 
      ON public.units(project_id, status) 
      WHERE project_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_units_project_number 
      ON public.units(project_id, unit_number) 
      WHERE project_id IS NOT NULL;
  END IF;
END $$;

-- Revenue Journal - ตรวจสอบ project_id column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'revenue_journal' 
    AND column_name = 'project_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_revenue_journal_project_date 
      ON public.revenue_journal(project_id, journal_date DESC) 
      WHERE project_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_revenue_journal_project_account 
      ON public.revenue_journal(project_id, account_code) 
      WHERE project_id IS NOT NULL;
  END IF;
END $$;

-- Expense Journal - ตรวจสอบ project_id column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'expense_journal' 
    AND column_name = 'project_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_expense_journal_project_date 
      ON public.expense_journal(project_id, journal_date DESC) 
      WHERE project_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_expense_journal_project_account 
      ON public.expense_journal(project_id, account_code) 
      WHERE project_id IS NOT NULL;
  END IF;
END $$;

-- Maintenance Requests - ตรวจสอบ project_id column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'maintenance_requests' 
    AND column_name = 'project_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_project_status 
      ON public.maintenance_requests(project_id, detailed_status) 
      WHERE project_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_maintenance_project_created 
      ON public.maintenance_requests(project_id, created_at DESC) 
      WHERE project_id IS NOT NULL;
  END IF;
END $$;

-- Parcels - ตรวจสอบ project_id column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'parcels' 
    AND column_name = 'project_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_parcels_project_status 
      ON public.parcels(project_id, status) 
      WHERE project_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_parcels_project_created 
      ON public.parcels(project_id, created_at DESC) 
      WHERE project_id IS NOT NULL;
  END IF;
END $$;

-- Accounts Payable - ตรวจสอบ project_id column ก่อนสร้าง index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'ap_invoices'
  ) THEN
    -- Check if project_id column exists first
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ap_invoices' 
      AND column_name = 'project_id'
    ) THEN
      -- Check if status column exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ap_invoices' 
        AND column_name = 'status'
      ) THEN
        CREATE INDEX IF NOT EXISTS idx_ap_invoices_project_status 
          ON public.ap_invoices(project_id, status) 
          WHERE project_id IS NOT NULL;
      END IF;
      
      -- Check if due_date column exists
      IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ap_invoices' 
        AND column_name = 'due_date'
      ) THEN
        CREATE INDEX IF NOT EXISTS idx_ap_invoices_project_due 
          ON public.ap_invoices(project_id, due_date) 
          WHERE project_id IS NOT NULL;
      END IF;
    END IF;
  END IF;
END $$;

-- Revenue Budget - ตรวจสอบ project_id column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'revenue_budget' 
    AND column_name = 'project_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_revenue_budget_project_year_month 
      ON public.revenue_budget(project_id, year, month) 
      WHERE project_id IS NOT NULL;
  END IF;
END $$;

-- Expense Budget - ตรวจสอบ project_id column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'expense_budget' 
    AND column_name = 'project_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_expense_budget_project_year_month 
      ON public.expense_budget(project_id, year, month) 
      WHERE project_id IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- 2. COMPOSITE INDEXES (สำหรับ queries ที่ใช้หลายคอลัมน์)
-- ============================================

-- Bills - สำหรับ filter หลายเงื่อนไข - ตรวจสอบ project_id column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'project_id'
  ) THEN
    -- ตรวจสอบว่า status column มีอยู่จริง
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'bills' 
      AND column_name = 'status'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_bills_project_month_status 
        ON public.bills(project_id, month, status) 
        WHERE project_id IS NOT NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_bills_project_unit_month 
      ON public.bills(project_id, unit_id, month DESC) 
      WHERE project_id IS NOT NULL;
  END IF;
END $$;

-- Payments - สำหรับ filter หลายเงื่อนไข - ตรวจสอบ project_id column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'project_id'
  ) THEN
    -- ตรวจสอบว่า status column มีอยู่จริง
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'payments' 
      AND column_name = 'status'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_payments_project_date_status 
        ON public.payments(project_id, payment_date DESC, status) 
        WHERE project_id IS NOT NULL;
    END IF;
  END IF;
END $$;

-- Units - สำหรับ filter หลายเงื่อนไข - ตรวจสอบ project_id column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'units' 
    AND column_name = 'project_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_units_project_status_number 
      ON public.units(project_id, status, unit_number) 
      WHERE project_id IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- 3. DATE RANGE INDEXES (สำหรับ queries ที่ใช้ช่วงวันที่)
-- ============================================

-- Bills - สำหรับ filter ตามช่วงเดือน - ตรวจสอบ table ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'bills'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'month'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_bills_month_range 
      ON public.bills(month) 
      WHERE month IS NOT NULL;
  END IF;
END $$;

-- Payments - สำหรับ filter ตามช่วงวันที่ - ตรวจสอบ table ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payments'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'payment_date'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_payments_date_range 
      ON public.payments(payment_date) 
      WHERE payment_date IS NOT NULL;
  END IF;
END $$;

-- Revenue Journal - สำหรับ filter ตามช่วงวันที่ - ตรวจสอบ table ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'revenue_journal'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'revenue_journal' 
    AND column_name = 'journal_date'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_revenue_journal_date_range 
      ON public.revenue_journal(journal_date) 
      WHERE journal_date IS NOT NULL;
  END IF;
END $$;

-- Expense Journal - สำหรับ filter ตามช่วงวันที่ - ตรวจสอบ table ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'expense_journal'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'expense_journal' 
    AND column_name = 'journal_date'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_expense_journal_date_range 
      ON public.expense_journal(journal_date) 
      WHERE journal_date IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- 4. FOREIGN KEY INDEXES (สำหรับ JOIN operations)
-- ============================================

-- Bills -> Units - ตรวจสอบ column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'unit_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_bills_unit_id 
      ON public.bills(unit_id) 
      WHERE unit_id IS NOT NULL;
  END IF;
END $$;

-- Payments -> Bills - ตรวจสอบ column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'bill_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_payments_bill_id 
      ON public.payments(bill_id) 
      WHERE bill_id IS NOT NULL;
  END IF;
END $$;

-- Maintenance -> Units - ตรวจสอบ column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'maintenance_requests' 
    AND column_name = 'unit_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_unit_id 
      ON public.maintenance_requests(unit_id) 
      WHERE unit_id IS NOT NULL;
  END IF;
END $$;

-- Parcels -> Units - ตรวจสอบ column ก่อน (parcels ใช้ unit_number ไม่ใช่ unit_id)
DO $$
BEGIN
  -- ตรวจสอบ unit_number (column ที่ parcels table ใช้จริง)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'parcels' 
    AND column_name = 'unit_number'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_parcels_unit_number 
      ON public.parcels(unit_number) 
      WHERE unit_number IS NOT NULL;
  END IF;
  
  -- ตรวจสอบ unit_id (ถ้ามี column นี้ด้วย)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'parcels' 
    AND column_name = 'unit_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_parcels_unit_id 
      ON public.parcels(unit_id) 
      WHERE unit_id IS NOT NULL;
  END IF;
END $$;

-- ============================================
-- 5. STATUS INDEXES (สำหรับ filter ตามสถานะ)
-- ============================================

-- Bills status - ตรวจสอบ column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'bills' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_bills_status 
      ON public.bills(status) 
      WHERE status IN ('unpaid', 'pending', 'paid');
  END IF;
END $$;

-- Payments status - ตรวจสอบ column ก่อน
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'payments' 
    AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_payments_status 
      ON public.payments(status) 
      WHERE status IS NOT NULL;
  END IF;
END $$;

-- Maintenance status
CREATE INDEX IF NOT EXISTS idx_maintenance_status 
  ON public.maintenance_requests(detailed_status) 
  WHERE detailed_status IS NOT NULL;

-- Parcels status
CREATE INDEX IF NOT EXISTS idx_parcels_status 
  ON public.parcels(status) 
  WHERE status IS NOT NULL;

-- ============================================
-- 6. ANALYZE TABLES (อัปเดต statistics)
-- ============================================

-- อัปเดต statistics เพื่อให้ query planner ทำงานได้ดีขึ้น
ANALYZE public.bills;
ANALYZE public.payments;
ANALYZE public.units;
ANALYZE public.revenue_journal;
ANALYZE public.expense_journal;
ANALYZE public.maintenance_requests;
ANALYZE public.parcels;
ANALYZE public.ap_invoices;
ANALYZE public.revenue_budget;
ANALYZE public.expense_budget;

-- ============================================
-- สรุป
-- ============================================
-- ✅ เพิ่ม indexes สำหรับ:
--    - Project filtering (project_id + column)
--    - Composite queries (หลายคอลัมน์)
--    - Date range queries
--    - Foreign key joins
--    - Status filtering
-- 
-- 📊 ผลลัพธ์ที่คาดหวัง:
--    - Query speed เพิ่มขึ้น 50-90%
--    - ลด database load
--    - ปรับปรุง user experience

