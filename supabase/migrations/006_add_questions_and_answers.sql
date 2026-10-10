-- Migration 006: Add Questions and Answers Tables
-- Q&A functionality for students to ask questions and get answers

-- Questions table
CREATE TABLE questions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    discipline_id UUID REFERENCES disciplines(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    course_code_id UUID REFERENCES course_codes(id) ON DELETE SET NULL,
    asked_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    is_solved BOOLEAN DEFAULT false,
    view_count INTEGER DEFAULT 0,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Answers table
CREATE TABLE answers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    answered_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_accepted BOOLEAN DEFAULT false,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_questions_discipline ON questions(discipline_id);
CREATE INDEX idx_questions_asked_by ON questions(asked_by);
CREATE INDEX idx_questions_created_at ON questions(created_at DESC);
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_answered_by ON answers(answered_by);

-- RLS Policies
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- Questions policies
CREATE POLICY "Anyone can view questions" ON questions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert questions" ON questions FOR INSERT WITH CHECK (auth.uid() = asked_by);
CREATE POLICY "Users can update their own questions" ON questions FOR UPDATE USING (auth.uid() = asked_by);
CREATE POLICY "Users can delete their own questions" ON questions FOR DELETE USING (auth.uid() = asked_by);

-- Answers policies  
CREATE POLICY "Anyone can view answers" ON answers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert answers" ON answers FOR INSERT WITH CHECK (auth.uid() = answered_by);
CREATE POLICY "Users can update their own answers" ON answers FOR UPDATE USING (auth.uid() = answered_by);
CREATE POLICY "Question author can accept answers" ON answers FOR UPDATE USING (
    EXISTS (SELECT 1 FROM questions WHERE id = question_id AND asked_by = auth.uid())
);
CREATE POLICY "Users can delete their own answers" ON answers FOR DELETE USING (auth.uid() = answered_by);

-- Update triggers
CREATE TRIGGER update_questions_updated_at 
    BEFORE UPDATE ON questions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_answers_updated_at 
    BEFORE UPDATE ON answers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to increment question view count
CREATE OR REPLACE FUNCTION increment_question_views(question_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE questions 
    SET view_count = view_count + 1 
    WHERE id = question_id;
END;
$$ LANGUAGE plpgsql;
