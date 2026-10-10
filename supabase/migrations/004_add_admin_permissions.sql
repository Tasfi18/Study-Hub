-- Migration 004: Add Admin Permissions (SIMPLIFIED)
-- Separate admin policies to avoid circular references

-- Admin material approval policy (using service role or direct email check)
CREATE POLICY "Teachers and admins can view all materials" ON materials
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        auth.jwt() ->> 'email' IN (
            'admin@ku.ac.bd', 
            'teacher@ku.ac.bd'
        )
    );

CREATE POLICY "Teachers and admins can approve materials" ON materials
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        auth.jwt() ->> 'email' IN (
            'admin@ku.ac.bd', 
            'teacher@ku.ac.bd'
        )
    );

-- Admin can view all profiles 
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        auth.jwt() ->> 'email' = 'admin@ku.ac.bd'
    );

-- Admin can view all downloads
CREATE POLICY "Admins can view all downloads" ON downloads
    FOR SELECT USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        auth.jwt() ->> 'email' = 'admin@ku.ac.bd'
    );
