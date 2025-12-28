-- 1. Ensure the User exists in public.users (to satisfy Foreign Key)
INSERT INTO public.users (id, email, full_name, line_user_id)
VALUES (
  'd4c838e6-c9d8-4fa2-9e21-55b90e355d85', -- Your Super Admin ID
  'superadmin@unizorn.com',
  'Super Admin',
  'Ufa786a1f8b9261de58b13d65c56264db'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Force Update Unit 1001 to link to this user AND set Owner Details
-- This ensures that when we fetch the unit, we get these names instead of "Super Admin"
UPDATE units
SET 
  user_id = 'd4c838e6-c9d8-4fa2-9e21-55b90e355d85',
  owner_name = 'ดวงใจ ใจดี (เจ้าของห้อง)',     -- TEST NAME
  owner_email = 'duangjai@example.com',      -- TEST EMAIL
  owner_phone = '089-999-8888',              -- TEST PHONE
  line_user_id = 'Ufa786a1f8b9261de58b13d65c56264db'
WHERE unit_number = '1001';

-- 3. Verify the result
SELECT unit_number, user_id, owner_name, owner_email, line_user_id 
FROM units 
WHERE unit_number = '1001';
