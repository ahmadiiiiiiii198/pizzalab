-- Migration: Create impasto_types table for managing dough types
-- This allows dynamic management of impasto (dough) types from the admin panel

-- Create impasto_types table
CREATE TABLE IF NOT EXISTS impasto_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_impasto_types_slug ON impasto_types(slug);
CREATE INDEX IF NOT EXISTS idx_impasto_types_active ON impasto_types(is_active);
CREATE INDEX IF NOT EXISTS idx_impasto_types_sort_order ON impasto_types(sort_order);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_impasto_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_impasto_types_updated_at
  BEFORE UPDATE ON impasto_types
  FOR EACH ROW
  EXECUTE FUNCTION update_impasto_types_updated_at();

-- Insert default impasto types (migrating from hardcoded values)
INSERT INTO impasto_types (name, slug, description, price, sort_order) VALUES
  ('Impasta Normale', 'normale', 'Impasto tradizionale con farina tipo 00', 0.00, 1),
  ('Impasta Integrata', 'integrata', 'Impasto integrale per una scelta più salutare', 0.00, 2),
  ('Impasta ai Cereali', 'cereali', 'Impasto arricchito con mix di cereali', 0.00, 3)
ON CONFLICT (slug) DO NOTHING;

-- Add table comment
COMMENT ON TABLE impasto_types IS 'Dough types for pizza customization';
COMMENT ON COLUMN impasto_types.name IS 'Display name of the dough type';
COMMENT ON COLUMN impasto_types.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN impasto_types.description IS 'Description of the dough type';
COMMENT ON COLUMN impasto_types.price IS 'Additional price for this dough type';
COMMENT ON COLUMN impasto_types.is_active IS 'Whether this dough type is available';
COMMENT ON COLUMN impasto_types.sort_order IS 'Display order in selection lists';
