-- Add Row Level Security policy for deleting materials
-- This ensures users can only delete their own materials (unless they're admin)

-- Drop existing policy if it exists (for idempotency)
DROP POLICY IF EXISTS "Users can delete own materials" ON materials;

-- Create policy to allow users to delete their own materials
-- Admins can delete any material
CREATE POLICY "Users can delete own materials"
ON materials FOR DELETE
TO authenticated
USING (
    auth.uid() = uploaded_by 
    OR EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Note: CASCADE DELETE for related tables (bookmarks, reviews, downloads) 
-- is already configured in previous migrations (010, 011, 001)
-- Index on uploaded_by already exists from migration 001
