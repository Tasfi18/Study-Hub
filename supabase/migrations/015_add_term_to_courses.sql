-- Migration 015: Add Year and Term fields to Course Codes
-- Uses the same format as batches table: year (1-4) and term/semester (1-2)

ALTER TABLE course_codes 
ADD COLUMN year INTEGER,
ADD COLUMN term INTEGER;

COMMENT ON COLUMN course_codes.year IS 'Academic year (1-4)';
COMMENT ON COLUMN course_codes.term IS 'Academic term/semester (1-2)';

CREATE INDEX idx_course_codes_year_term ON course_codes(year, term);
