-- Migration: Create aggiunti_types table for managing pizza extras/toppings
-- This allows dynamic management of aggiunti (extras) from the admin panel

-- Create aggiunti_types table
CREATE TABLE IF NOT EXISTS aggiunti_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general', -- For grouping extras (cheese, meat, vegetables, etc.)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_aggiunti_types_slug ON aggiunti_types(slug);
CREATE INDEX IF NOT EXISTS idx_aggiunti_types_active ON aggiunti_types(is_active);
CREATE INDEX IF NOT EXISTS idx_aggiunti_types_sort_order ON aggiunti_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_aggiunti_types_category ON aggiunti_types(category);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_aggiunti_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_aggiunti_types_updated_at
  BEFORE UPDATE ON aggiunti_types
  FOR EACH ROW
  EXECUTE FUNCTION update_aggiunti_types_updated_at();

-- Insert default aggiunti types (migrating from hardcoded values)
INSERT INTO aggiunti_types (name, slug, description, price, category, sort_order) VALUES
  ('Stracchino', 'stracchino', 'Formaggio cremoso e delicato', 2.00, 'formaggi', 1),
  ('Cipolle', 'cipolle', 'Cipolle fresche', 1.00, 'verdure', 2),
  ('Spianata calabra piccante', 'spianata-calabra', 'Salume piccante calabrese', 2.00, 'salumi', 3),
  ('Patatine fritte', 'patatine-fritte', 'Patatine fritte croccanti', 2.00, 'contorni', 4),
  ('Parmigiano grattugiato', 'parmigiano', 'Parmigiano Reggiano DOP grattugiato', 1.50, 'formaggi', 5),
  ('Fontina', 'fontina', 'Formaggio fontina della Valle d''Aosta', 2.00, 'formaggi', 6),
  ('Pepperoni', 'pepperoni', 'Peperoni dolci', 1.00, 'verdure', 7),
  ('Zucchine', 'zucchine', 'Zucchine fresche grigliate', 1.00, 'verdure', 8),
  ('Olive', 'olive', 'Olive miste', 1.50, 'verdure', 9),
  ('Pomodorini', 'pomodorini', 'Pomodorini ciliegino freschi', 1.50, 'verdure', 10),
  ('Rucola', 'rucola', 'Rucola fresca', 1.00, 'verdure', 11),
  ('Prosciutto cotto', 'prosciutto-cotto', 'Prosciutto cotto di alta qualità', 2.50, 'salumi', 12),
  ('Prosciutto crudo', 'prosciutto-crudo', 'Prosciutto crudo di Parma', 3.00, 'salumi', 13),
  ('Salame', 'salame', 'Salame nostrano', 2.00, 'salumi', 14),
  ('Bresaola', 'bresaola', 'Bresaola della Valtellina', 3.50, 'salumi', 15),
  ('Gorgonzola', 'gorgonzola', 'Gorgonzola DOP cremoso', 2.50, 'formaggi', 16),
  ('Mozzarella di bufala', 'mozzarella-bufala', 'Mozzarella di bufala campana DOP', 3.00, 'formaggi', 17),
  ('Ricotta', 'ricotta', 'Ricotta fresca', 1.50, 'formaggi', 18),
  ('Funghi porcini', 'funghi-porcini', 'Funghi porcini freschi', 3.00, 'verdure', 19),
  ('Funghi champignon', 'funghi-champignon', 'Funghi champignon freschi', 1.50, 'verdure', 20),
  ('Melanzane', 'melanzane', 'Melanzane grigliate', 1.50, 'verdure', 21),
  ('Carciofi', 'carciofi', 'Carciofi sott''olio', 2.00, 'verdure', 22),
  ('Olive Taggiasche', 'olive-taggiasche', 'Olive Taggiasche liguri', 2.00, 'verdure', 23),
  ('Tonno', 'tonno', 'Tonno sott''olio di qualità', 1.50, 'pesce', 24)
ON CONFLICT (slug) DO NOTHING;

-- Add table comment
COMMENT ON TABLE aggiunti_types IS 'Pizza extras and toppings for customization';
COMMENT ON COLUMN aggiunti_types.name IS 'Display name of the extra/topping';
COMMENT ON COLUMN aggiunti_types.slug IS 'URL-friendly identifier';
COMMENT ON COLUMN aggiunti_types.description IS 'Description of the extra/topping';
COMMENT ON COLUMN aggiunti_types.price IS 'Additional price for this extra/topping';
COMMENT ON COLUMN aggiunti_types.is_active IS 'Whether this extra/topping is available';
COMMENT ON COLUMN aggiunti_types.category IS 'Category grouping (formaggi, salumi, verdure, etc.)';
COMMENT ON COLUMN aggiunti_types.sort_order IS 'Display order in selection lists';
