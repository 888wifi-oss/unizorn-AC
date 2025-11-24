-- scripts/012_performance_indexes_safe.sql
-- Safe version: Only creates indexes for existing tables and columns

-- ===========================
-- 1. UNITS TABLE INDEXES
-- ===========================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'units') THEN
    CREATE INDEX IF NOT EXISTS idx_units_status ON public.units(status);
    CREATE INDEX IF NOT EXISTS idx_units_floor ON public.units(floor);
    CREATE INDEX IF NOT EXISTS idx_units_owner_name ON public.units USING gin(to_tsvector('simple', owner_name));
    CREATE INDEX IF NOT EXISTS idx_units_unit_number_search ON public.units(unit_number text_pattern_ops);
    RAISE NOTICE 'Units table indexes created';
  ELSE
    RAISE NOTICE 'Units table not found, skipping indexes';
  END IF;
END $$;

-- ===========================
-- 2. BILLS TABLE INDEXES
-- ===========================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bills') THEN
    CREATE INDEX IF NOT EXISTS idx_bills_unit_id ON public.bills(unit_id);
    CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);
    CREATE INDEX IF NOT EXISTS idx_bills_month_year ON public.bills(month, year);
    CREATE INDEX IF NOT EXISTS idx_bills_due_date ON public.bills(due_date);
    CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON public.bills(bill_number);
    CREATE INDEX IF NOT EXISTS idx_bills_unit_status ON public.bills(unit_id, status);
    CREATE INDEX IF NOT EXISTS idx_bills_month_year_status ON public.bills(month, year, status);
    RAISE NOTICE 'Bills table indexes created';
  ELSE
    RAISE NOTICE 'Bills table not found, skipping indexes';
  END IF;
END $$;

-- ===========================
-- 3. MAINTENANCE REQUESTS TABLE INDEXES
-- ===========================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'maintenance_requests') THEN
    CREATE INDEX IF NOT EXISTS idx_maintenance_unit_id ON public.maintenance_requests(unit_id);
    CREATE INDEX IF NOT EXISTS idx_maintenance_status ON public.maintenance_requests(status);
    CREATE INDEX IF NOT EXISTS idx_maintenance_created_at ON public.maintenance_requests(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_maintenance_unit_status ON public.maintenance_requests(unit_id, status);
    
    -- Only create these indexes if columns exist
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_requests' AND column_name = 'category') THEN
      CREATE INDEX IF NOT EXISTS idx_maintenance_category ON public.maintenance_requests(category);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_requests' AND column_name = 'priority') THEN
      CREATE INDEX IF NOT EXISTS idx_maintenance_priority ON public.maintenance_requests(priority);
      CREATE INDEX IF NOT EXISTS idx_maintenance_status_priority ON public.maintenance_requests(status, priority);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_requests' AND column_name = 'request_number') THEN
      CREATE INDEX IF NOT EXISTS idx_maintenance_request_number ON public.maintenance_requests(request_number);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'maintenance_requests' AND column_name = 'title') THEN
      CREATE INDEX IF NOT EXISTS idx_maintenance_title_search ON public.maintenance_requests USING gin(to_tsvector('simple', title));
    END IF;
    
    RAISE NOTICE 'Maintenance requests table indexes created';
  ELSE
    RAISE NOTICE 'Maintenance requests table not found, skipping indexes';
  END IF;
END $$;

-- ===========================
-- 4. PARCELS TABLE INDEXES
-- ===========================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parcels') THEN
    CREATE INDEX IF NOT EXISTS idx_parcels_status ON public.parcels(status);
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parcels' AND column_name = 'unit_number') THEN
      CREATE INDEX IF NOT EXISTS idx_parcels_unit_number ON public.parcels(unit_number);
      CREATE INDEX IF NOT EXISTS idx_parcels_unit_status ON public.parcels(unit_number, status);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parcels' AND column_name = 'received_at') THEN
      CREATE INDEX IF NOT EXISTS idx_parcels_received_at ON public.parcels(received_at DESC);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parcels' AND column_name = 'recipient_name') THEN
      CREATE INDEX IF NOT EXISTS idx_parcels_recipient_name ON public.parcels USING gin(to_tsvector('simple', recipient_name));
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parcels' AND column_name = 'tracking_number') THEN
      CREATE INDEX IF NOT EXISTS idx_parcels_tracking_number ON public.parcels(tracking_number);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'parcels' AND column_name = 'courier') THEN
      CREATE INDEX IF NOT EXISTS idx_parcels_courier ON public.parcels(courier);
    END IF;
    
    RAISE NOTICE 'Parcels table indexes created';
  ELSE
    RAISE NOTICE 'Parcels table not found, skipping indexes';
  END IF;
END $$;

-- ===========================
-- 5. NOTIFICATIONS TABLE INDEXES
-- ===========================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'unit_id') THEN
      CREATE INDEX IF NOT EXISTS idx_notifications_unit_id ON public.notifications(unit_id);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'is_read') THEN
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
      
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'unit_id') THEN
        CREATE INDEX IF NOT EXISTS idx_notifications_unit_read ON public.notifications(unit_id, is_read);
      END IF;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications' AND column_name = 'type') THEN
      CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
    END IF;
    
    RAISE NOTICE 'Notifications table indexes created';
  ELSE
    RAISE NOTICE 'Notifications table not found, skipping indexes';
  END IF;
END $$;

-- ===========================
-- 6. FILES TABLE INDEXES (Optional)
-- ===========================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'files') THEN
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
    
    RAISE NOTICE 'Files table indexes created';
  ELSE
    RAISE NOTICE 'Files table not found, skipping indexes';
  END IF;
END $$;

-- ===========================
-- 7. ANALYZE TABLES
-- ===========================
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'units') THEN
    ANALYZE public.units;
    RAISE NOTICE 'Analyzed units table';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bills') THEN
    ANALYZE public.bills;
    RAISE NOTICE 'Analyzed bills table';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'maintenance_requests') THEN
    ANALYZE public.maintenance_requests;
    RAISE NOTICE 'Analyzed maintenance_requests table';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parcels') THEN
    ANALYZE public.parcels;
    RAISE NOTICE 'Analyzed parcels table';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ANALYZE public.notifications;
    RAISE NOTICE 'Analyzed notifications table';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'files') THEN
    ANALYZE public.files;
    RAISE NOTICE 'Analyzed files table';
  END IF;
END $$;

-- ===========================
-- 8. MATERIALIZED VIEW (Optional)
-- ===========================
DO $$
BEGIN
  -- Only create materialized view if all required tables exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'units')
     AND EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bills') THEN
    
    -- Drop existing view if it exists
    DROP MATERIALIZED VIEW IF EXISTS public.dashboard_stats;
    
    -- Create materialized view
    CREATE MATERIALIZED VIEW public.dashboard_stats AS
    SELECT
      (SELECT COUNT(*) FROM public.units) as total_units,
      (SELECT COUNT(*) FROM public.units WHERE status = 'occupied') as occupied_units,
      (SELECT COUNT(*) FROM public.bills WHERE status = 'pending') as pending_bills,
      (SELECT COALESCE(SUM(total), 0) FROM public.bills WHERE status = 'pending') as pending_bills_amount,
      (SELECT CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'maintenance_requests')
                   THEN (SELECT COUNT(*) FROM public.maintenance_requests WHERE status = 'pending')
                   ELSE 0
              END) as pending_maintenance,
      (SELECT CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parcels')
                   THEN (SELECT COUNT(*) FROM public.parcels WHERE status = 'pending')
                   ELSE 0
              END) as pending_parcels,
      (SELECT CASE WHEN EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications')
                   THEN (SELECT COUNT(*) FROM public.notifications WHERE is_read = false)
                   ELSE 0
              END) as unread_notifications,
      NOW() as updated_at;
    
    -- Create unique index
    CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_stats_updated_at ON public.dashboard_stats(updated_at);
    
    RAISE NOTICE 'Dashboard stats materialized view created';
  ELSE
    RAISE NOTICE 'Required tables not found, skipping materialized view creation';
  END IF;
END $$;

-- ===========================
-- 9. REFRESH FUNCTION
-- ===========================
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT FROM pg_matviews WHERE schemaname = 'public' AND matviewname = 'dashboard_stats') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.dashboard_stats;
    RAISE NOTICE 'Dashboard stats refreshed';
  ELSE
    RAISE NOTICE 'Dashboard stats materialized view does not exist';
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION refresh_dashboard_stats() IS 'Manually refresh dashboard statistics materialized view';

-- ===========================
-- COMPLETION MESSAGE
-- ===========================
DO $$
BEGIN
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Performance indexes installation completed!';
  RAISE NOTICE '=================================';
  RAISE NOTICE 'Run SELECT refresh_dashboard_stats(); to refresh stats';
END $$;
