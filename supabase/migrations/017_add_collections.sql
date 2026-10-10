-- Migration 017: Add Material Collections
-- Allow users to create custom collections/playlists of materials

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection items table (materials in collections)
CREATE TABLE IF NOT EXISTS collection_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES materials(id) ON DELETE CASCADE NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collection_id, material_id) -- Prevent duplicate materials in same collection
);

-- Indexes
CREATE INDEX idx_collections_user_id ON collections(user_id);
CREATE INDEX idx_collections_created_at ON collections(created_at DESC);
CREATE INDEX idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX idx_collection_items_material_id ON collection_items(material_id);

-- RLS Policies
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- Collections policies
CREATE POLICY "Users can view own collections" ON collections
    FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own collections" ON collections
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own collections" ON collections
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own collections" ON collections
    FOR DELETE USING (auth.uid() = user_id);

-- Collection items policies
CREATE POLICY "Users can view items in accessible collections" ON collection_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE id = collection_id 
            AND (user_id = auth.uid() OR is_public = true)
        )
    );

CREATE POLICY "Users can add items to own collections" ON collection_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE id = collection_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can remove items from own collections" ON collection_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM collections 
            WHERE id = collection_id 
            AND user_id = auth.uid()
        )
    );

-- Update trigger for collections
CREATE TRIGGER update_collections_updated_at
    BEFORE UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON collections TO authenticated;
GRANT ALL ON collection_items TO authenticated;
