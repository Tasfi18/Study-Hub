-- Migration 016: Add View History
-- Track materials viewed by users for "Recently Viewed" feature

-- View history table
CREATE TABLE IF NOT EXISTS view_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, material_id) -- One entry per user per material, will update timestamp
);

-- Index for fast queries
CREATE INDEX idx_view_history_user_id ON view_history(user_id);
CREATE INDEX idx_view_history_viewed_at ON view_history(viewed_at DESC);

-- RLS Policies
ALTER TABLE view_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own history" ON view_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own history" ON view_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own history" ON view_history
    FOR UPDATE USING (auth.uid() = user_id);

-- Function to upsert view history (update timestamp if exists, insert if not)
CREATE OR REPLACE FUNCTION upsert_view_history(p_user_id UUID, p_material_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO view_history (user_id, material_id, viewed_at)
    VALUES (p_user_id, p_material_id, NOW())
    ON CONFLICT (user_id, material_id) 
    DO UPDATE SET viewed_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT ALL ON view_history TO authenticated;
