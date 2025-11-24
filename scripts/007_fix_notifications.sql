-- scripts/007_fix_notifications.sql

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can manage all notifications" ON public.notifications;

-- Create new policies that work with unit-based system
-- Allow all operations for now (since we're using simple auth)
CREATE POLICY "Allow all operations on notifications" ON public.notifications FOR ALL USING (true);

-- Alternative: If you want more restrictive policies, you can use these instead:
-- CREATE POLICY "Allow read access to notifications by unit" ON public.notifications 
--   FOR SELECT USING (
--     EXISTS (
--       SELECT 1 FROM public.units 
--       WHERE units.id = notifications.unit_id 
--       AND units.unit_number = current_setting('app.current_unit_number', true)
--     )
--   );

-- CREATE POLICY "Allow insert for authenticated users" ON public.notifications 
--   FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Allow update for authenticated users" ON public.notifications 
--   FOR UPDATE USING (true);

-- CREATE POLICY "Allow delete for authenticated users" ON public.notifications 
--   FOR DELETE USING (true);
