-- Link current logged-in user (Super Admin) to Unit 1001
-- So that Profile page shows the Unit's data
UPDATE units
SET 
  user_id = 'd4c838e6-c9d8-4fa2-9e21-55b90e355d85', -- Your Super Admin ID
  owner_phone = '081-234-5678' -- Mock phone to verify it shows up
WHERE unit_number = '1001';

-- Update Line User ID to yours as well (if not already set)
UPDATE units
SET line_user_id = 'Ufa786a1f8b9261de58b13d65c56264db'
WHERE unit_number = '1001';
