-- =====================================================
-- Performance Optimization - Indexes & Views
-- =====================================================
-- Created: 2025-01-28
-- Purpose: Add indexes and views to improve query performance
-- Target: Dashboard load time ≤ 2.5 seconds
-- =====================================================

-- Step 1: Add indexes for revenue_journal (Dashboard main query)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_revenue_journal_date 
  ON revenue_journal(journal_date);

CREATE INDEX IF NOT EXISTS idx_revenue_journal_unit 
  ON revenue_journal(unit_id);

CREATE INDEX IF NOT EXISTS idx_revenue_journal_bill 
  ON revenue_journal(bill_id);

-- Step 2: Add indexes for bills (Dashboard queries)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_bills_month 
  ON bills(month);

CREATE INDEX IF NOT EXISTS idx_bills_status 
  ON bills(status);

CREATE INDEX IF NOT EXISTS idx_bills_month_status 
  ON bills(month, status);

CREATE INDEX IF NOT EXISTS idx_bills_unit_id 
  ON bills(unit_id);

CREATE INDEX IF NOT EXISTS idx_bills_due_date 
  ON bills(due_date);

-- Step 3: Add indexes for units (Dashboard queries)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_units_project_id 
  ON units(project_id) WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_units_unit_number 
  ON units(unit_number);

CREATE INDEX IF NOT EXISTS idx_units_status 
  ON units(status);

-- Step 4: Add indexes for maintenance_requests (Commonly used)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_created_at 
  ON maintenance_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status 
  ON maintenance_requests(status);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_project_id 
  ON maintenance_requests(project_id);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_scheduled_at 
  ON maintenance_requests(scheduled_at);

-- Step 5: Add indexes for parcels
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_parcels_unit_number 
  ON parcels(unit_number);

CREATE INDEX IF NOT EXISTS idx_parcels_status 
  ON parcels(status);

CREATE INDEX IF NOT EXISTS idx_parcels_created_at 
  ON parcels(created_at DESC);

-- Step 6: Add indexes for payments
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_payments_bill_id 
  ON payments(bill_id);

CREATE INDEX IF NOT EXISTS idx_payments_payment_date 
  ON payments(payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_payments_project_id 
  ON payments(project_id);

-- Step 7: Create optimized view for dashboard data
-- =====================================================
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT 
  (SELECT COUNT(*) FROM units WHERE status != 'vacant') as total_units,
  (SELECT COUNT(DISTINCT unit_id) FROM payments WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as paid_units_this_month,
  (SELECT COALESCE(SUM(total), 0) FROM bills WHERE status IN ('pending', 'unpaid')) as total_outstanding,
  (SELECT COUNT(DISTINCT unit_id) FROM bills WHERE status IN ('pending', 'unpaid')) as overdue_units,
  (SELECT COALESCE(SUM(amount), 0) FROM revenue_journal WHERE EXTRACT(MONTH FROM journal_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM journal_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as total_revenue_this_month;

-- Step 8: Create optimized view for monthly revenue (faster than RPC)
-- =====================================================
CREATE OR REPLACE VIEW monthly_revenue_summary AS
SELECT 
  DATE_TRUNC('month', journal_date) as month_start,
  SUM(amount) as total_revenue,
  COUNT(*) as transaction_count
FROM revenue_journal
WHERE journal_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', journal_date)
ORDER BY month_start DESC;

-- Step 9: Create materialized view for frequently accessed data
-- =====================================================
-- Note: Materialized views need to be refreshed periodically
-- Run: REFRESH MATERIALIZED VIEW CONCURRENTLY units_status_summary;
CREATE MATERIALIZED VIEW IF NOT EXISTS units_status_summary AS
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'occupied') as occupied,
  COUNT(*) FILTER (WHERE status = 'vacant') as vacant,
  COUNT(*) FILTER (WHERE status = 'maintenance') as maintenance,
  COUNT(DISTINCT project_id) as total_projects
FROM units;

-- Create index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_units_status_summary_unique 
  ON units_status_summary(total);

-- Step 10: Optimize the get_monthly_revenue_6_months RPC function
-- =====================================================
CREATE OR REPLACE FUNCTION get_monthly_revenue_6_months()
RETURNS TABLE (
  month_start DATE,
  total_revenue NUMERIC
) 
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE_TRUNC('month', rj.journal_date)::DATE as month_start,
    COALESCE(SUM(rj.amount), 0)::NUMERIC as total_revenue
  FROM revenue_journal rj
  WHERE rj.journal_date >= CURRENT_DATE - INTERVAL '6 months'
  GROUP BY DATE_TRUNC('month', rj.journal_date)
  ORDER BY month_start DESC
  LIMIT 6;
END;
$$;

-- Grant permissions
GRANT SELECT ON dashboard_summary TO authenticated;
GRANT SELECT ON monthly_revenue_summary TO authenticated;
GRANT SELECT ON units_status_summary TO authenticated;

-- =====================================================
-- Summary
-- =====================================================
-- ✅ Added 20+ indexes for faster queries
-- ✅ Created 3 views for dashboard data
-- ✅ Optimized RPC function
-- ✅ Expected improvement: 50-70% faster queries

