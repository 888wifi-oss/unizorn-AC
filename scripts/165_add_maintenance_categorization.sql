-- Add maintenance request categorization and advanced features
-- Script: 165_add_maintenance_categorization.sql
-- Description: เพิ่ม fields สำหรับการจัดหมวดหมู่, รูปภาพ, สถานะละเอียด, Timeline, และ Comments

-- 1. Add categorization fields
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS request_type TEXT CHECK (request_type IN ('ช่างส่วนกลาง', 'ซ่อมนอก')),
ADD COLUMN IF NOT EXISTS has_cost BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS technician_assigned TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS updated_by TEXT;

-- 2. Add image support
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- 3. Add detailed status
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS detailed_status TEXT CHECK (detailed_status IN ('new', 'in_progress', 'preparing_materials', 'waiting_technician', 'fixing', 'completed', 'cancelled')) DEFAULT 'new';

-- 4. Create maintenance_timeline table
CREATE TABLE IF NOT EXISTS maintenance_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  updated_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_timeline_request_id ON maintenance_timeline(maintenance_request_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_timeline_created_at ON maintenance_timeline(created_at);

-- 5. Create maintenance_comments table
CREATE TABLE IF NOT EXISTS maintenance_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  maintenance_request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  comment_by TEXT NOT NULL,
  comment_text TEXT NOT NULL,
  is_resident BOOLEAN DEFAULT false,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_comments_request_id ON maintenance_comments(maintenance_request_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_comments_created_at ON maintenance_comments(created_at);

-- 6. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_maintenance_request_type ON maintenance_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_has_cost ON maintenance_requests(has_cost);
CREATE INDEX IF NOT EXISTS idx_maintenance_detailed_status ON maintenance_requests(detailed_status);

-- 7. Function to auto-update timeline
CREATE OR REPLACE FUNCTION update_maintenance_timeline()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status OR OLD.detailed_status IS DISTINCT FROM NEW.detailed_status) THEN
    INSERT INTO maintenance_timeline (maintenance_request_id, status, updated_by, notes)
    VALUES (NEW.id, NEW.status || ' - ' || COALESCE(NEW.detailed_status, ''), COALESCE(NEW.reported_by, 'system'), NEW.notes);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for auto-update timeline
DROP TRIGGER IF EXISTS trigger_update_maintenance_timeline ON maintenance_requests;
CREATE TRIGGER trigger_update_maintenance_timeline
BEFORE UPDATE ON maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION update_maintenance_timeline();

-- 9. Function to auto-update comment updated_at
CREATE OR REPLACE FUNCTION update_maintenance_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for auto-update comment updated_at
DROP TRIGGER IF EXISTS trigger_update_maintenance_comments_updated_at ON maintenance_comments;
CREATE TRIGGER trigger_update_maintenance_comments_updated_at
BEFORE UPDATE ON maintenance_comments
FOR EACH ROW
EXECUTE FUNCTION update_maintenance_comments_updated_at();

-- Fix: Ensure project_id is properly handled for existing requests
-- Note: project_id is UUID type, so we can't compare to empty string
-- Just ensure NULL values are handled correctly

-- Show result
SELECT 'Maintenance advanced features added successfully!' as status;

