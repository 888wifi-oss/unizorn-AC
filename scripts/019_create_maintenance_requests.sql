-- Create maintenance_requests table if not exists
-- This script creates the maintenance requests table for tracking repair/maintenance tickets

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'maintenance_requests'
    ) THEN
        CREATE TABLE maintenance_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
            status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'cancelled')),
            location VARCHAR(255),
            contact_phone VARCHAR(20),
            reported_by VARCHAR(100) DEFAULT 'resident',
            assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
            completed_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add indexes for better query performance
        CREATE INDEX idx_maintenance_requests_unit_id ON maintenance_requests(unit_id);
        CREATE INDEX idx_maintenance_requests_project_id ON maintenance_requests(project_id);
        CREATE INDEX idx_maintenance_requests_status ON maintenance_requests(status);
        CREATE INDEX idx_maintenance_requests_created_at ON maintenance_requests(created_at DESC);

        -- Add updated_at trigger
        CREATE TRIGGER update_maintenance_requests_updated_at 
            BEFORE UPDATE ON maintenance_requests
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'Table maintenance_requests created successfully';
    ELSE
        RAISE NOTICE 'Table maintenance_requests already exists';
        
        -- Add project_id column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'maintenance_requests' 
            AND column_name = 'project_id'
        ) THEN
            ALTER TABLE maintenance_requests 
            ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE CASCADE;
            
            CREATE INDEX idx_maintenance_requests_project_id ON maintenance_requests(project_id);
            
            RAISE NOTICE 'Column project_id added to maintenance_requests';
        END IF;

        -- Add location column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'maintenance_requests' 
            AND column_name = 'location'
        ) THEN
            ALTER TABLE maintenance_requests ADD COLUMN location VARCHAR(255);
            RAISE NOTICE 'Column location added to maintenance_requests';
        END IF;

        -- Add contact_phone column if it doesn't exist
        IF NOT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'maintenance_requests' 
            AND column_name = 'contact_phone'
        ) THEN
            ALTER TABLE maintenance_requests ADD COLUMN contact_phone VARCHAR(20);
            RAISE NOTICE 'Column contact_phone added to maintenance_requests';
        END IF;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated access to maintenance_requests" ON maintenance_requests;

-- Create RLS policies
CREATE POLICY "Allow authenticated access to maintenance_requests"
ON maintenance_requests
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Grant permissions
GRANT ALL ON maintenance_requests TO authenticated;
GRANT ALL ON maintenance_requests TO service_role;

-- Insert some demo data if table is empty
DO $$ 
DECLARE
    demo_unit_id UUID;
    demo_project_id UUID;
BEGIN
    IF (SELECT COUNT(*) FROM maintenance_requests) = 0 THEN
        -- Get first unit for demo data
        SELECT id, project_id INTO demo_unit_id, demo_project_id 
        FROM units 
        LIMIT 1;
        
        IF demo_unit_id IS NOT NULL THEN
            INSERT INTO maintenance_requests (unit_id, project_id, title, description, priority, status, reported_by)
            VALUES 
                (demo_unit_id, demo_project_id, 'ก๊อกน้ำรั่ว', 'ก๊อกน้ำในห้องน้ำรั่ว ต้องการซ่อม', 'medium', 'new', 'resident'),
                (demo_unit_id, demo_project_id, 'เครื่องปรับอากาศเสีย', 'แอร์ไม่เย็น ต้องการตรวจเช็ค', 'high', 'in_progress', 'resident');
            
            RAISE NOTICE 'Demo maintenance requests created';
        END IF;
    END IF;
END $$;

