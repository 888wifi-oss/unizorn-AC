-- Auto-create Payment Slips Storage Bucket
-- สร้าง Storage Bucket สำหรับเก็บสลิปการชำระเงิน
-- Note: This uses Supabase Storage Management API via pg_net extension

-- First, check if bucket exists
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  -- Note: Supabase Storage buckets are managed through Storage API
  -- This SQL script serves as documentation
  -- Actual bucket creation should be done via:
  -- 1. Supabase Dashboard: Storage > New Bucket
  -- 2. Or via API call from application code
  
  RAISE NOTICE '===== PAYMENT SLIPS STORAGE SETUP =====';
  RAISE NOTICE 'Please create the bucket manually in Supabase Dashboard';
  RAISE NOTICE 'Bucket name: payment-slips';
  RAISE NOTICE 'Access level: Private (recommended)';
  RAISE NOTICE 'File size limit: 5MB';
  RAISE NOTICE 'Allowed types: image/jpeg, image/png, image/jpg, application/pdf';
END $$;

-- RLS Policies for payment-slips bucket
-- These will be applied automatically when bucket is created
-- If using Supabase Dashboard, policies can be set there

-- Policy 1: Allow authenticated users to upload slips (their own transactions)
-- This should be set in Supabase Dashboard > Storage > payment-slips > Policies
-- Policy Name: "Allow authenticated users to upload"
-- Policy Definition:
--   INSERT: (bucket_id = 'payment-slips' AND auth.role() = 'authenticated')

-- Policy 2: Allow users to view their own uploaded slips
-- Policy Name: "Allow users to view own slips"
-- Policy Definition:
--   SELECT: (bucket_id = 'payment-slips' AND auth.role() = 'authenticated')

-- Policy 3: Allow admins to view all slips
-- Policy Name: "Allow admins to view all slips"
-- Policy Definition:
--   SELECT: (bucket_id = 'payment-slips' AND auth.role() IN ('super_admin', 'company_admin', 'project_admin'))

-- Policy 4: Allow admins to delete slips
-- Policy Name: "Allow admins to delete slips"
-- Policy Definition:
--   DELETE: (bucket_id = 'payment-slips' AND auth.role() IN ('super_admin', 'company_admin', 'project_admin'))

SELECT '===== SETUP INSTRUCTIONS =====' as info;
SELECT '1. Go to Supabase Dashboard > Storage' as step;
SELECT '2. Click "New Bucket"' as step;
SELECT '3. Name: payment-slips' as step;
SELECT '4. Set to Private' as step;
SELECT '5. Click "Create bucket"' as step;
SELECT '6. Go to Policies tab and add the policies listed above' as step;

