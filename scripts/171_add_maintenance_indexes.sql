-- scripts/171_add_maintenance_indexes.sql
-- เพิ่ม indexes สำหรับ maintenance_requests เพื่อแก้ไข Timeout Error

-- Index สำหรับ unit_id เพื่อเพิ่มความเร็วในการ filter
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_unit_id ON public.maintenance_requests(unit_id);

-- Index สำหรับ created_at เพื่อเพิ่มความเร็วในการ sort
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_created_at ON public.maintenance_requests(created_at DESC);

-- Index สำหรับ project_id เพื่อเพิ่มความเร็วในการ filter
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_project_id ON public.maintenance_requests(project_id) WHERE project_id IS NOT NULL;

-- Composite index สำหรับ status และ created_at
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status_created ON public.maintenance_requests(status, created_at DESC);

-- Optional: Analyze the table to update statistics
ANALYZE public.maintenance_requests;

