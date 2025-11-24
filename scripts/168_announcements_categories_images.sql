-- ============================================
-- Announcements Enhanced Features
-- Date: 2025-01-XX
-- Description: Add categories, images, and file attachments to announcements
-- ============================================

-- Step 1: Add category column
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'ทั่วไป';

-- Step 2: Add image_url column for main announcement image
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS image_urls TEXT[];

-- Step 3: Add attachments column for file attachments
ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS attachments TEXT[];

-- Step 4: Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_announcements_category
ON announcements(category);

-- Step 5: Create index for project_id and category
CREATE INDEX IF NOT EXISTS idx_announcements_project_category
ON announcements(project_id, category)
WHERE project_id IS NOT NULL;

-- Step 6: Add comment for documentation
COMMENT ON COLUMN announcements.category IS 'หมวดหมู่ประกาศ เช่น: ข่าวประชาสัมพันธ์, การบำรุงรักษา, กิจกรรมชุมชน, ประกาศสำคัญ';
COMMENT ON COLUMN announcements.image_urls IS 'รูปภาพประกอบประกาศ (Supabase Storage URLs)';
COMMENT ON COLUMN announcements.attachments IS 'ไฟล์แนบ (Supabase Storage URLs)';

-- Step 7: Optional - Update existing announcements
-- UPDATE announcements 
-- SET category = 'ข่าวประชาสัมพันธ์'
-- WHERE category IS NULL OR category = 'ทั่วไป';

-- Step 8: Sample data for testing
-- INSERT INTO announcements (
--   title,
--   content,
--   category,
--   publish_date,
--   is_pinned,
--   image_urls
-- ) VALUES (
--   'ประกาศทดสอบ',
--   'นี่คือเนื้อหาประกาศทดสอบ',
--   'การบำรุงรักษา',
--   CURRENT_TIMESTAMP,
--   false,
--   ARRAY[]::TEXT[]
-- );

-- ============================================
-- Verification Queries
-- ============================================

-- Check if columns exist
SELECT 
  column_name, 
  data_type,
  column_default
FROM information_schema.columns 
WHERE table_name = 'announcements' 
  AND column_name IN ('category', 'image_urls', 'attachments');

-- Check indexes
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'announcements' 
  AND indexname LIKE '%announcements%';

-- ============================================
-- Complete!
-- ============================================
