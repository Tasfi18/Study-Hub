-- Add reviews and ratings functionality
-- Allows users to rate and review materials

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, material_id) -- One review per user per material
);

-- Create indexes for performance
CREATE INDEX idx_reviews_material_id ON reviews(material_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at DESC);

-- Add RLS policies for reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Users can view all reviews
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT
    USING (true);

-- Users can create their own reviews
CREATE POLICY "Users can create own reviews" ON reviews
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON reviews
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON reviews
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create a view for materials with rating stats
CREATE OR REPLACE VIEW materials_with_ratings AS
SELECT 
    m.*,
    COALESCE(AVG(r.rating), 0)::DECIMAL(2,1) AS average_rating,
    COUNT(r.id)::INTEGER AS total_reviews,
    EXISTS (
        SELECT 1 FROM reviews r2 
        WHERE r2.material_id = m.id 
        AND r2.user_id = auth.uid()
    ) AS user_has_reviewed
FROM materials m
LEFT JOIN reviews r ON r.material_id = m.id
GROUP BY m.id;

-- Grant permissions
GRANT SELECT ON materials_with_ratings TO authenticated;
GRANT ALL ON reviews TO authenticated;

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_reviews_updated_at();
