-- scripts/012_performance_indexes.sql

-- Performance optimization indexes for better query performance

-- Units table indexes
CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);
CREATE INDEX IF NOT EXISTS idx_units_floor ON public.units(floor);
CREATE INDEX IF NOT EXISTS idx_units_owner_name ON public.units USING gin(to_tsvector('simple', owner_name));
CREATE INDEX IF NOT EXISTS idx_units_unit_number_search ON public.units(unit_number text_pattern_ops);

-- Bills table indexes
CREATE INDEX IF NOT EXISTS idx_bills_unit_id ON public.bills(unit_id);
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_month_year ON public.bills(month, year);
CREATE INDEX IF NOT EXISTS idx_bills_due_date ON public.bills(due_date);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON public.bills(bill_number);

-- Maintenance requests table indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_unit_id ON public.maintenance_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_category ON public.maintenance_requests(category);
CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON public.maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_created_at ON public.maintenance_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_maintenance_request_number ON public.maintenance_requests(request_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_title_search ON public.maintenance_requests USING gin(to_tsvector('simple', title));

-- Parcels table indexes
CREATE INDEX IF NOT EXISTS idx_parcels_unit_number ON public.parcels(unit_number);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON public.parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_received_at ON public.parcels(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_parcels_recipient_name ON public.parcels USING gin(to_tsvector('simple', recipient_name));
CREATE INDEX IF NOT EXISTS idx_parcels_tracking_number ON public.parcels(tracking_number);
CREATE INDEX IF NOT EXISTS idx_parcels_courier ON public.parcels(courier);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_unit_id ON public.notifications(unit_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Files table indexes (only if table exists and columns are present)
DO $$
BEGIN
  -- Check if files table exists before creating indexes
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'files') THEN
    -- Create indexes only for existing columns
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'category_id') THEN
      CREATE INDEX IF NOT EXISTS idx_files_category_id ON public.files(category_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'uploaded_by') THEN
      CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON public.files(uploaded_by);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'is_public') THEN
      CREATE INDEX IF NOT EXISTS idx_files_is_public ON public.files(is_public);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'created_at') THEN
      CREATE INDEX IF NOT EXISTS idx_files_created_at ON public.files(created_at DESC);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'files' AND column_name = 'mime_type') THEN
      CREATE INDEX IF NOT EXISTS idx_files_mime_type ON public.files(mime_type);
    END IF;
  END IF;
END $$;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_bills_unit_status ON public.bills(unit_id, status);
CREATE INDEX IF NOT EXISTS idx_bills_month_year_status ON public.bills(month, year, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_unit_status ON public.maintenance_requests(unit_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_status_priority ON public.maintenance_requests(status, priority);
CREATE INDEX IF NOT EXISTS idx_parcels_unit_status ON public.parcels(unit_number, status);
CREATE INDEX IF NOT EXISTS idx_notifications_unit_read ON public.notifications(unit_id, is_read);

-- ANALYZE tables to update statistics (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'units') THEN
    ANALYZE public.units;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bills') THEN
    ANALYZE public.bills;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'maintenance_requests') THEN
    ANALYZE public.maintenance_requests;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parcels') THEN
    ANALYZE public.parcels;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ANALYZE public.notifications;
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'files') THEN
    ANALYZE public.files;
  END IF;
END $$;

-- Create materialized view for dashboard statistics (optional, for very large datasets)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.units) as total_units,
  (SELECT COUNT(*) FROM public.units WHERE status = 'occupied') as occupied_units,
  (SELECT COUNT(*) FROM public.bills WHERE status = 'pending') as pending_bills,
  (SELECT COALESCE(SUM(total), 0) FROM public.bills WHERE status = 'pending') as pending_bills_amount,
  (SELECT COUNT(*) FROM public.maintenance_requests WHERE status = 'pending') as pending_maintenance,
  (SELECT COUNT(*) FROM public.parcels WHERE status = 'pending') as pending_parcels,
  (SELECT COUNT(*) FROM public.notifications WHERE is_read = false) as unread_notifications,
  NOW() as updated_at;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_updated_at ON public.dashboard_stats(updated_at);

-- Function to refresh dashboard stats
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_stats;
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a trigger to auto-refresh stats (be careful with performance)
-- Or schedule this to run every 5-10 minutes via cron job

COMMENT ON MATERIALIZED VIEW public.dashboard_stats IS 'Cached dashboard statistics for better performance';
COMMENT ON FUNCTION refresh_dashboard_stats() IS 'Manually refresh dashboard statistics';
