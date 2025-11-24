-- Add user_id column to units table for Supabase Auth integration
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_units_user_id ON public.units(user_id);

-- Update RLS policies to include user-based access
DROP POLICY IF EXISTS "Allow all operations on units" ON public.units;
DROP POLICY IF EXISTS "Allow all operations on bills" ON public.bills;
DROP POLICY IF EXISTS "Allow all operations on payments" ON public.payments;

-- Create more secure policies
CREATE POLICY "Users can view their own unit" ON public.units 
  FOR SELECT USING (auth.uid() = user_id OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage all units" ON public.units 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own bills" ON public.bills 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.units 
      WHERE units.id = bills.unit_id 
      AND units.user_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Service role can manage all bills" ON public.bills 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own payments" ON public.payments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.units 
      WHERE units.id = payments.unit_id 
      AND units.user_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Service role can manage all payments" ON public.payments 
  FOR ALL USING (auth.role() = 'service_role');

-- Create announcements table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create maintenance_requests table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'cancelled')),
  reported_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_announcements_publish_date ON public.announcements(publish_date);
CREATE INDEX IF NOT EXISTS idx_announcements_is_pinned ON public.announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_unit_id ON public.maintenance_requests(unit_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON public.maintenance_requests(status);

-- Enable RLS on new tables
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for announcements (public read, admin write)
CREATE POLICY "Anyone can read announcements" ON public.announcements 
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage announcements" ON public.announcements 
  FOR ALL USING (auth.role() = 'service_role');

-- Create policies for maintenance requests
CREATE POLICY "Users can view their own maintenance requests" ON public.maintenance_requests 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.units 
      WHERE units.id = maintenance_requests.unit_id 
      AND units.user_id = auth.uid()
    ) OR auth.role() = 'service_role'
  );

CREATE POLICY "Users can create maintenance requests for their unit" ON public.maintenance_requests 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.units 
      WHERE units.id = maintenance_requests.unit_id 
      AND units.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all maintenance requests" ON public.maintenance_requests 
  FOR ALL USING (auth.role() = 'service_role');
