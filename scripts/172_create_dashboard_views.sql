-- scripts/172_create_dashboard_views.sql
-- สร้าง Views สำหรับ Dashboard

-- =====================================================
-- Drop existing views if they exist
-- =====================================================
DROP VIEW IF EXISTS dashboard_summary CASCADE;
DROP VIEW IF EXISTS monthly_revenue_summary CASCADE;

-- =====================================================
-- Create optimized view for dashboard summary
-- =====================================================
CREATE VIEW dashboard_summary AS
SELECT 
  (SELECT COUNT(*) FROM units WHERE status != 'vacant') as total_units,
  (SELECT COUNT(DISTINCT unit_id) FROM payments WHERE EXTRACT(MONTH FROM payment_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM payment_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as paid_units_this_month,
  (SELECT COALESCE(SUM(total), 0) FROM bills WHERE status IN ('pending', 'unpaid')) as total_outstanding,
  (SELECT COUNT(DISTINCT unit_id) FROM bills WHERE status IN ('pending', 'unpaid')) as overdue_units,
  (SELECT COALESCE(SUM(amount), 0) FROM revenue_journal WHERE EXTRACT(MONTH FROM journal_date) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(YEAR FROM journal_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as total_revenue_this_month;

-- =====================================================
-- Create optimized view for monthly revenue
-- =====================================================
CREATE VIEW monthly_revenue_summary AS
SELECT 
  DATE_TRUNC('month', journal_date)::DATE as month_start,
  SUM(amount)::NUMERIC as total_revenue
FROM revenue_journal
WHERE journal_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY DATE_TRUNC('month', journal_date)
ORDER BY month_start DESC
LIMIT 6;

-- Grant permissions
GRANT SELECT ON dashboard_summary TO authenticated;
GRANT SELECT ON monthly_revenue_summary TO authenticated;

-- =====================================================
-- Summary
-- =====================================================
-- ✅ Created dashboard_summary view
-- ✅ Created monthly_revenue_summary view
-- ✅ Dashboard จะแสดงข้อมูลได้แล้ว!

