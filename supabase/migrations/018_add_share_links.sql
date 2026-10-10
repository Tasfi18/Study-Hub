-- Migration 018: Add Share Links
-- Generate shareable links for materials

-- Add share_token column to materials
ALTER TABLE materials ADD COLUMN IF NOT EXISTS share_token VARCHAR(32) UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_materials_share_token ON materials(share_token);

-- Function to generate share token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS VARCHAR(32) AS $$
BEGIN
    RETURN encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;
