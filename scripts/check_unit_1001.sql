-- Check specific unit data
SELECT id, unit_number, project_id, user_id FROM units WHERE unit_number = '1001';

-- Check if the user exists (just to be sure)
-- Replace with the user ID from the profile page if known, or list recent users
SELECT id, email, line_user_id FROM users LIMIT 5;
