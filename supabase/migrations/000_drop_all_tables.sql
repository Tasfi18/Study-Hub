-- Migration 000: Drop All Tables
-- WARNING: This will DELETE ALL DATA and tables
-- Use this to start fresh with a clean database

-- Disable RLS before dropping tables
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS downloads DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- Drop all policies first
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Everyone can view approved materials" ON materials;
DROP POLICY IF EXISTS "Users can view their own materials" ON materials;
DROP POLICY IF EXISTS "Teachers and admins can view all materials" ON materials;
DROP POLICY IF EXISTS "Authenticated users can upload materials" ON materials;
DROP POLICY IF EXISTS "Users can update their own pending materials" ON materials;
DROP POLICY IF EXISTS "Teachers and admins can approve materials" ON materials;
DROP POLICY IF EXISTS "Users can track their own downloads" ON downloads;
DROP POLICY IF EXISTS "Users can view their own download history" ON downloads;
DROP POLICY IF EXISTS "Admins can view all downloads" ON downloads;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Drop all triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_disciplines_updated_at ON disciplines;
DROP TRIGGER IF EXISTS update_batches_updated_at ON batches;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_materials_updated_at ON materials;

-- Drop all functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS increment_download_count(UUID);
DROP FUNCTION IF EXISTS create_notification(UUID, notification_type, VARCHAR(200), TEXT, JSONB);

-- Drop all tables (in reverse dependency order)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS downloads CASCADE;
DROP TABLE IF EXISTS materials CASCADE;
DROP TABLE IF EXISTS course_codes CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS disciplines CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS material_status CASCADE;
DROP TYPE IF EXISTS material_type CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;

-- Optional: Drop extensions (uncomment if you want to remove them completely)
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "pgcrypto";

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database reset complete! All tables, functions, and types have been dropped.';
    RAISE NOTICE 'You can now run the migration files in order to recreate the schema.';
END $$;