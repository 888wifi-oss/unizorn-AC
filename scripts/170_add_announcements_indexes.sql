-- scripts/170_add_announcements_indexes.sql
-- เพิ่ม indexes สำหรับ announcements เพื่อเพิ่มประสิทธิภาพการค้นหา

-- Index สำหรับ project_id เพื่อเพิ่มความเร็วในการ filter
CREATE INDEX IF NOT EXISTS idx_announcements_project_id ON public.announcements(project_id) WHERE project_id IS NOT NULL;

-- Index สำหรับ publish_date เพื่อเพิ่มความเร็วในการ sort
CREATE INDEX IF NOT EXISTS idx_announcements_publish_date ON public.announcements(publish_date DESC);

-- Composite index สำหรับ project_id + publish_date เพื่อ query ที่ซับซ้อนขึ้น
CREATE INDEX IF NOT EXISTS idx_announcements_project_publish ON public.announcements(project_id, publish_date DESC);

-- Index สำหรับ is_pinned เพื่อ prioritize pinned announcements
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON public.announcements(is_pinned DESC) WHERE is_pinned = true;

-- Optional: Analyze the table to update statistics
ANALYZE public.announcements;

