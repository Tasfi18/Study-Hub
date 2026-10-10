-- Migration: Add 'image' to material_type enum
-- This allows uploading image files as materials

-- Add 'image' value to the material_type enum
ALTER TYPE material_type ADD VALUE 'image';

-- Update the comment for better documentation
COMMENT ON TYPE material_type IS 'Types of materials that can be uploaded: pdf, slide, note, assignment, image, other';
