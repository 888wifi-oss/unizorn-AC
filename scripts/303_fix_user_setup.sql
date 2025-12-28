-- 1. Create/Ensure the user exists with EMAIL (required field)
INSERT INTO public.users (id, email, full_name, line_user_id)
VALUES (
  '62d40c1a-9960-47d4-8ab8-f6a92b5fa4c0',
  'resident.1001@example.com',
  'Resident Unit 1001',
  'Ufa786a1f8b9261de58b13d65c56264db'
)
ON CONFLICT (id) DO UPDATE
SET 
  line_user_id = EXCLUDED.line_user_id;

-- 2. Link Unit 1001 to this resident user
UPDATE units
SET user_id = '62d40c1a-9960-47d4-8ab8-f6a92b5fa4c0'
WHERE unit_number = '1001';

-- 3. Verify
SELECT id, email, line_user_id FROM users WHERE id = '62d40c1a-9960-47d4-8ab8-f6a92b5fa4c0';
SELECT unit_number, user_id FROM units WHERE unit_number = '1001';
