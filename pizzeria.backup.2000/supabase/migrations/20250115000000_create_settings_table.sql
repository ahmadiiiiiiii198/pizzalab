-- Create settings table (this is the MISSING table that the entire app depends on!)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_updated_at ON settings(updated_at);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow public read access to settings
CREATE POLICY "Allow public read access to settings" 
  ON settings 
  FOR SELECT 
  USING (true);

-- Allow authenticated users to update settings
CREATE POLICY "Allow authenticated users to update settings" 
  ON settings 
  FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to insert settings
CREATE POLICY "Allow authenticated users to insert settings" 
  ON settings 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete settings
CREATE POLICY "Allow authenticated users to delete settings" 
  ON settings 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- Insert default pizzeria content and essential settings
INSERT INTO settings (key, value) VALUES
  (
    'heroContent',
    '{"heading": "Pizzeria Regina 2000", "subheading": "Autentica pizza italiana nel cuore di Torino", "backgroundImage": "/hero-pizza-bg.jpg"}'
  ),
  (
    'logoSettings',
    '{"logoUrl": "/pizzeria-regina-logo.png", "altText": "Pizzeria Regina 2000 Torino Logo"}'
  ),
  (
    'aboutSections',
    '{"section1": {"image": "/images/storia.jpg", "title": "La Nostra Storia", "description": "Dal 2000 portiamo a Torino la vera tradizione della pizza napoletana. La nostra famiglia ha tramandato di generazione in generazione i segreti di un impasto perfetto e di ingredienti selezionati."}, "section2": {"image": "/images/ingredienti.jpg", "title": "Ingredienti di Qualità", "description": "Utilizziamo solo ingredienti freschi e di prima qualità: mozzarella di bufala DOP, pomodori San Marzano, olio extravergine di oliva e farina tipo 00. Ogni pizza è un capolavoro di sapore."}}'
  ),
  (
    'restaurantSettings',
    '{"totalSeats": 50, "reservationDuration": 120, "openingTime": "11:30", "closingTime": "22:00", "languages": ["it", "en", "ar", "fa"], "defaultLanguage": "it"}'
  ),
  (
    'contactContent',
    '{"address": "C.so Giulio Cesare, 36, 10152 Torino TO", "phone": "+393479190907", "email": "anilamyzyri@gmail.com", "mapUrl": "https://maps.google.com", "hours": "Lun-Dom: 18:30 - 22:30"}'
  ),
  (
    'businessHours',
    '{"monday": {"isOpen": true, "openTime": "14:30", "closeTime": "22:30"}, "tuesday": {"isOpen": true, "openTime": "14:30", "closeTime": "22:30"}, "wednesday": {"isOpen": true, "openTime": "18:30", "closeTime": "22:30"}, "thursday": {"isOpen": true, "openTime": "18:30", "closeTime": "22:30"}, "friday": {"isOpen": true, "openTime": "18:30", "closeTime": "22:30"}, "saturday": {"isOpen": true, "openTime": "18:30", "closeTime": "22:30"}, "sunday": {"isOpen": true, "openTime": "18:30", "closeTime": "22:30"}}'
  ),
  (
    'galleryContent',
    '{"heading": "La Nostra Galleria", "subheading": "Scorci delle nostre creazioni e dell\'atmosfera della pizzeria"}'
  ),
  (
    'galleryImages',
    '[]'
  ),
  (
    'popups',
    '[]'
  ),
  (
    'reservations',
    '[]'
  ),
  (
    'weOfferContent',
    '{"heading": "Offriamo", "subheading": "Scopri le nostre autentiche specialità italiane", "offers": [{"id": 1, "title": "Pizza Metro Finchi 5 Gusti", "description": "Prova la nostra pizza metro caratteristica con fino a 5 gusti diversi in un''unica creazione straordinaria. Perfetta da condividere con famiglia e amici.", "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", "badge": "Specialità"}, {"id": 2, "title": "Usiamo la Farina 5 Stagioni Gusti, Alta Qualità", "description": "Utilizziamo farina premium 5 Stagioni, ingredienti della migliore qualità che rendono il nostro impasto per pizza leggero, digeribile e incredibilmente saporito.", "image": "https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", "badge": "Qualità"}, {"id": 3, "title": "Creiamo Tutti i Tipi di Pizza Italiana di Alta Qualità", "description": "Dalla classica Margherita alle specialità gourmet, prepariamo ogni pizza con passione, utilizzando tecniche tradizionali e i migliori ingredienti per un''autentica esperienza italiana.", "image": "https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", "badge": "Autentica"}]}'
  )
ON CONFLICT (key) DO NOTHING;
