-- 1. Add column to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS line_user_id TEXT;
COMMENT ON COLUMN units.line_user_id IS 'LINE User ID for notifications';

-- 2. Migrate existing data (if any) from users table
-- (Optional: only if we want to preserve what we tried to save)
-- UPDATE units u
-- SET line_user_id = usr.line_user_id
-- FROM users usr
-- WHERE u.user_id = usr.id AND usr.line_user_id IS NOT NULL;

-- 3. Force set LINE ID for Unit 1001 (Test Unit)
UPDATE units
SET line_user_id = 'Ufa786a1f8b9261de58b13d65c56264db'
WHERE unit_number = '1001';

-- 4. Create Index for performance
CREATE INDEX IF NOT EXISTS idx_units_line_user_id ON units(line_user_id);
