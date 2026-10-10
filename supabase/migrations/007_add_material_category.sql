-- Migration 007: Add Category Field to Materials
-- Add category enum and column to materials table

-- Create category enum type (skip if exists)
DO $$ BEGIN
    CREATE TYPE material_category AS ENUM (
        'previous_question',
        'ct_question', 
        'final_question',
        'assignment',
        'lecture_note',
        'lab_manual',
        'syllabus',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add category column to materials table (skip if exists)
DO $$ BEGIN
    ALTER TABLE materials 
    ADD COLUMN category material_category;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Add index for better filtering performance (skip if exists)
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
