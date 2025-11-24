-- Create vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('car', 'motorcycle', 'other')),
    license_plate TEXT NOT NULL,
    brand TEXT,
    model TEXT,
    color TEXT,
    owner_name TEXT, -- Optional, defaults to unit owner/tenant
    sticker_number TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pets table
CREATE TABLE IF NOT EXISTS pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('dog', 'cat', 'other')),
    name TEXT NOT NULL,
    breed TEXT,
    color TEXT,
    weight DECIMAL(5, 2),
    vaccination_status BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

-- Create policies for vehicles
CREATE POLICY "Users can view vehicles for their projects" ON vehicles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM units u
            JOIN user_roles ur ON u.project_id = ur.project_id
            WHERE u.id = vehicles.unit_id
            AND ur.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert vehicles for their projects" ON vehicles
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM units u
            JOIN user_roles ur ON u.project_id = ur.project_id
            WHERE u.id = unit_id
            AND ur.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update vehicles for their projects" ON vehicles
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM units u
            JOIN user_roles ur ON u.project_id = ur.project_id
            WHERE u.id = vehicles.unit_id
            AND ur.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete vehicles for their projects" ON vehicles
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM units u
            JOIN user_roles ur ON u.project_id = ur.project_id
            WHERE u.id = vehicles.unit_id
            AND ur.user_id = auth.uid()
        )
    );

-- Create policies for pets
CREATE POLICY "Users can view pets for their projects" ON pets
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM units u
            JOIN user_roles ur ON u.project_id = ur.project_id
            WHERE u.id = pets.unit_id
            AND ur.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert pets for their projects" ON pets
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM units u
            JOIN user_roles ur ON u.project_id = ur.project_id
            WHERE u.id = unit_id
            AND ur.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update pets for their projects" ON pets
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM units u
            JOIN user_roles ur ON u.project_id = ur.project_id
            WHERE u.id = pets.unit_id
            AND ur.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete pets for their projects" ON pets
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM units u
            JOIN user_roles ur ON u.project_id = ur.project_id
            WHERE u.id = pets.unit_id
            AND ur.user_id = auth.uid()
        )
    );
