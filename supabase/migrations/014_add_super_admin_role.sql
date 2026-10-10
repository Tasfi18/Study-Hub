-- Migration 014: Add Super Admin Role
-- Simple approach: Just add enum, then update profiles manually

-- Add super_admin to the user_role enum
DO $$ 
BEGIN
    -- Add the enum value if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'super_admin') THEN
        ALTER TYPE user_role ADD VALUE 'super_admin';
    END IF;
END $$;

-- Create a super admin user (run this manually after migration)
-- UPDATE profiles SET role = 'super_admin' WHERE email = 'your-admin@ku.ac.bd';
