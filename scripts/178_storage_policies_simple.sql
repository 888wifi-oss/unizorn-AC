-- Simple Storage Policies for payment-slips bucket
-- These are for reference - policies must be created in Supabase Dashboard

-- ============================================
-- POLICY 1: Allow authenticated uploads
-- ============================================
-- Policy Name: Allow authenticated uploads
-- Operation: INSERT
-- Policy Definition:
bucket_id = 'payment-slips'

-- ============================================
-- POLICY 2: Allow authenticated view
-- ============================================
-- Policy Name: Allow authenticated view
-- Operation: SELECT
-- Policy Definition:
bucket_id = 'payment-slips'

-- ============================================
-- POLICY 3: Allow admins delete
-- ============================================
-- Policy Name: Allow admins delete
-- Operation: DELETE
-- Policy Definition:
bucket_id = 'payment-slips'

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Go to Supabase Dashboard > Storage > payment-slips > Policies
-- 2. Click "New Policy"
-- 3. Select "Custom Policy"
-- 4. For each policy above:
--    - Enter the Policy Name
--    - Select the Operation (INSERT/SELECT/DELETE)
--    - In "Policy definition" field, enter: bucket_id = 'payment-slips'
--    - Click "Save Policy"
--
-- NOTE: These are simple policies that allow all authenticated users.
-- For more granular control, you can add additional conditions later.

