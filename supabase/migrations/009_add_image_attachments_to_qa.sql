-- Migration 009: Add Image Attachments to Q&A
-- Allow users to attach images to questions and answers

-- Add image attachment columns to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_filename TEXT;

-- Add image attachment columns to answers table  
ALTER TABLE answers ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS image_filename TEXT;

-- Add comments for documentation
COMMENT ON COLUMN questions.image_url IS 'URL of attached image (stored in Supabase Storage)';
COMMENT ON COLUMN questions.image_filename IS 'Original filename of attached image';
COMMENT ON COLUMN answers.image_url IS 'URL of attached image (stored in Supabase Storage)';
COMMENT ON COLUMN answers.image_filename IS 'Original filename of attached image';
