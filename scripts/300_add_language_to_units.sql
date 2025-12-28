-- Add preferred_language column to units table
ALTER TABLE units 
ADD COLUMN preferred_language text DEFAULT 'th' CHECK (preferred_language IN ('th', 'en'));

-- Comment on column
COMMENT ON COLUMN units.preferred_language IS 'Preferred language for documents: th (Thai) or en (English)';
