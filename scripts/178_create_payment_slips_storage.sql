-- Create Storage Bucket for Payment Slips
-- สร้าง Storage Bucket สำหรับเก็บสลิปการชำระเงิน

-- Note: This script should be run in Supabase SQL Editor
-- Storage buckets are managed through Supabase Storage API, not SQL

-- For now, we'll create a note about the required bucket
-- The bucket should be created manually in Supabase Dashboard:
-- 1. Go to Storage
-- 2. Create new bucket: "payment-slips"
-- 3. Set it to Public or Private based on your needs
-- 4. Add RLS policies if needed

SELECT '===== PAYMENT SLIPS STORAGE SETUP =====' as info;

-- Storage bucket name: payment-slips
-- Access level: Private (recommended) or Public
-- File size limit: 5MB (configured in application)
-- Allowed file types: image/*, application/pdf

-- RLS Policy for payment-slips bucket (if private):
-- Allow authenticated users to upload
-- Allow admins to view/delete

SELECT 'Please create the "payment-slips" bucket manually in Supabase Storage' as instruction;
SELECT 'Bucket should be configured as Private with RLS policies' as recommendation;

