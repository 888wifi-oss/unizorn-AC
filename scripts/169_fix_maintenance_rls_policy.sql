-- Fix RLS Policy for maintenance_requests to allow Portal users to create requests
-- This fixes the issue where residents can't create maintenance requests from the Portal

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own maintenance requests" ON public.maintenance_requests;
DROP POLICY IF EXISTS "Users can create maintenance requests for their unit" ON public.maintenance_requests;

-- Create new policies that allow all users to insert (Portal doesn't use auth.uid())
CREATE POLICY "Allow all authenticated users to view maintenance requests" ON public.maintenance_requests 
  FOR SELECT USING (true);

CREATE POLICY "Allow all authenticated users to create maintenance requests" ON public.maintenance_requests 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage all maintenance requests" ON public.maintenance_requests 
  FOR ALL USING (auth.role() = 'service_role');

-- Optional: Allow anonymous access for Portal (if not using auth)
-- Uncomment if Portal users can't create requests even after the above policies
CREATE POLICY "Allow anonymous users to create maintenance requests" ON public.maintenance_requests 
  FOR INSERT WITH CHECK (true);

