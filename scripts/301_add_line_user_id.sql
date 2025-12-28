-- Add line_user_id column to units table
ALTER TABLE units ADD COLUMN IF NOT EXISTS line_user_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_units_line_user_id ON units(line_user_id);

-- Comment
COMMENT ON COLUMN units.line_user_id IS 'LINE User ID for sending notifications via Messaging API';
