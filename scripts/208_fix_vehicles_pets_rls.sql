-- Fix RLS policies for vehicles and pets to be permissive (matching units table)
-- This is required because the app uses a mock authentication system that doesn't establish a Supabase session,
-- so auth.uid() is null. Security is handled at the application level via checkPermission().

-- Drop existing policies for vehicles
DROP POLICY IF EXISTS "Users can view vehicles for their projects" ON vehicles;
DROP POLICY IF EXISTS "Users can insert vehicles for their projects" ON vehicles;
DROP POLICY IF EXISTS "Users can update vehicles for their projects" ON vehicles;
DROP POLICY IF EXISTS "Users can delete vehicles for their projects" ON vehicles;

-- Drop existing policies for pets
DROP POLICY IF EXISTS "Users can view pets for their projects" ON pets;
DROP POLICY IF EXISTS "Users can insert pets for their projects" ON pets;
DROP POLICY IF EXISTS "Users can update pets for their projects" ON pets;
DROP POLICY IF EXISTS "Users can delete pets for their projects" ON pets;

-- Create permissive policies for vehicles
CREATE POLICY "Allow all operations on vehicles" ON vehicles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create permissive policies for pets
CREATE POLICY "Allow all operations on pets" ON pets
    FOR ALL
    USING (true)
    WITH CHECK (true);
