-- Migration 003: Setup Row Level Security (FIXED)
-- Simplified RLS policies that avoid infinite recursion

-- Enable RLS on tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies (FIXED - allow trigger and service role)
CREATE POLICY "Users can view their own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage profiles" ON profiles
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Allow profile creation on signup" ON profiles
    FOR INSERT WITH CHECK (true); -- Allow trigger to create profiles

-- Materials policies (simplified)
CREATE POLICY "Everyone can view approved materials" ON materials
    FOR SELECT USING (status = 'approved');

CREATE POLICY "Users can view their own materials" ON materials
    FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Authenticated users can upload materials" ON materials
    FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL AND uploaded_by = auth.uid()
    );

CREATE POLICY "Users can update their own pending materials" ON materials
    FOR UPDATE USING (
        uploaded_by = auth.uid() AND status = 'pending'
    );

-- Downloads policies  
CREATE POLICY "Users can track their own downloads" ON downloads
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own download history" ON downloads
    FOR SELECT USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);
