-- Add password field to users table
-- Note: This is a simple implementation for testing only
-- In production, use proper password hashing (bcrypt, argon2, etc.)

-- Add password column
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Set default passwords for existing users (for testing only)
-- Password format: "password" (same for all users for easy testing)
UPDATE users SET password = 'password' WHERE password IS NULL;

-- Update demo users with specific passwords
UPDATE users SET password = 'admin123' WHERE email = 'superadmin@unizorn.com';
UPDATE users SET password = 'company123' WHERE email = 'company@example.com';
UPDATE users SET password = 'project123' WHERE email = 'project@example.com';
UPDATE users SET password = 'staff123' WHERE email = 'staff@example.com';

-- Add comment
COMMENT ON COLUMN users.password IS 'User password (plain text for testing - should be hashed in production)';

-- Note: In production, you should:
-- 1. Hash passwords using bcrypt or argon2
-- 2. Never store plain text passwords
-- 3. Implement password reset flow
-- 4. Add password complexity requirements
-- 5. Implement rate limiting for login attempts

