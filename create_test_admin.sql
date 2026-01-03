-- Create a test admin user
-- Email: admin@test.com
-- Password: Admin123!

-- First, create the auth user
-- Note: In Supabase, we need to use the auth.users table
-- But we can't directly insert into auth.users via SQL for security reasons
-- Instead, we'll update an existing user to be admin

-- Let's make final.working.test.jan01@example.com an admin
UPDATE profiles 
SET is_admin = true 
WHERE email = 'final.working.test.jan01@example.com';

-- Verify the update
SELECT id, email, full_name, is_admin 
FROM profiles 
WHERE email = 'final.working.test.jan01@example.com';
