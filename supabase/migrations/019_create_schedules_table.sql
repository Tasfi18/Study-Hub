-- Migration 019: Create Schedules Table
-- For class routines, tests, assignments, vivas, and other academic schedules

-- Schedule type enum
CREATE TYPE schedule_type AS ENUM ('class_test', 'lab_test', 'routine', 'assignment', 'viva', 'presentation', 'project', 'other');

-- Schedules table
CREATE TABLE schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type schedule_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Organization
    discipline_id UUID NOT NULL REFERENCES disciplines(id) ON DELETE CASCADE,
    course_code_id UUID REFERENCES course_codes(id) ON DELETE SET NULL,
    
    -- Schedule details
    term VARCHAR(50),
    schedule_date DATE NOT NULL,
    syllabus TEXT,
    
    -- Metadata
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_schedules_discipline ON schedules(discipline_id);
CREATE INDEX idx_schedules_type ON schedules(type);
CREATE INDEX idx_schedules_date ON schedules(schedule_date);
CREATE INDEX idx_schedules_active ON schedules(is_active);

-- RLS Policies
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- Everyone can view active schedules
CREATE POLICY "Anyone can view active schedules"
    ON schedules FOR SELECT
    USING (is_active = true);
