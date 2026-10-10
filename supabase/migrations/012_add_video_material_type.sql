-- Migration: Add video material type support
-- Description: Adds 'video' to the material_type enum for supporting video uploads

-- Add 'video' to the material_type enum
ALTER TYPE material_type ADD VALUE IF NOT EXISTS 'video' AFTER 'image';

-- Update any existing check constraints if needed
-- Note: PostgreSQL enums don't need constraint updates when adding values

-- Add a comment for documentation
COMMENT ON TYPE material_type IS 'Types of study materials including documents, images, and videos';
