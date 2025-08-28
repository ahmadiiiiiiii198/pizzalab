-- Create content_sections table
CREATE TABLE IF NOT EXISTS content_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key TEXT NOT NULL UNIQUE,
  section_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  content_value TEXT,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_sections_section_key ON content_sections(section_key);
CREATE INDEX IF NOT EXISTS idx_content_sections_active ON content_sections(is_active);
CREATE INDEX IF NOT EXISTS idx_content_sections_metadata ON content_sections USING GIN(metadata);

-- Enable RLS
ALTER TABLE content_sections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow public read access to active sections
CREATE POLICY "Allow public read access to active content sections" 
  ON content_sections 
  FOR SELECT 
  USING (is_active = true);

-- Allow authenticated users full access (for admin)
CREATE POLICY "Allow authenticated users full access to content sections" 
  ON content_sections 
  FOR ALL 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_content_sections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_content_sections_updated_at
  BEFORE UPDATE ON content_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_content_sections_updated_at();

-- Insert pizzeria content sections
INSERT INTO content_sections (section_key, section_name, content_type, content_value, metadata, is_active) VALUES
  (
    'hero_main_content',
    'Hero Section - Main Content',
    'json',
    '{"heading": "Pizzeria Regina 2000", "subheading": "Autentica pizza italiana nel cuore di Torino", "backgroundImage": "/hero-pizza-bg.jpg"}',
    '{"section": "hero"}',
    true
  ),
  (
    'about_main_content',
    'About Section - Main Content',
    'json',
    '{"heading": "La Nostra Storia", "content": "Dal 2000 portiamo a Torino la vera tradizione della pizza napoletana. La nostra famiglia ha tramandato di generazione in generazione i segreti di un impasto perfetto e di ingredienti selezionati. Utilizziamo solo ingredienti freschi e di prima qualità: mozzarella di bufala DOP, pomodori San Marzano, olio extravergine di oliva e farina tipo 00."}',
    '{"section": "about"}',
    true
  ),
  (
    'categories_main_content',
    'Categories Section - Main Content',
    'json',
    '{"heading": "Le Nostre Pizze", "subheading": "Scopri la nostra ampia gamma di pizze tradizionali e speciali"}',
    '{"section": "categories"}',
    true
  ),
  (
    'menu_main_content',
    'Menu Section - Main Content',
    'json',
    '{"heading": "Il Nostro Menu", "subheading": "Pizze preparate con ingredienti freschi e di qualità"}',
    '{"section": "menu"}',
    true
  )
ON CONFLICT (section_key) DO NOTHING;
