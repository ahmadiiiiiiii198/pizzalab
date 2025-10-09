
-- Create base_del_pizze_types table
CREATE TABLE IF NOT EXISTS base_del_pizze_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dolci_types table  
CREATE TABLE IF NOT EXISTS dolci_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE base_del_pizze_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE dolci_types ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Allow public read" ON base_del_pizze_types;
CREATE POLICY "Allow public read" ON base_del_pizze_types FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public read" ON dolci_types;
CREATE POLICY "Allow public read" ON dolci_types FOR SELECT TO public USING (true);

-- Authenticated full access
DROP POLICY IF EXISTS "Allow authenticated all" ON base_del_pizze_types;
CREATE POLICY "Allow authenticated all" ON base_del_pizze_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated all" ON dolci_types;
CREATE POLICY "Allow authenticated all" ON dolci_types FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default data
INSERT INTO base_del_pizze_types (name, description, price, sort_order) VALUES
  ('Classica', 'Base pizza classica', 0.00, 1),
  ('Integrale', 'Base integrale', 1.00, 2),
  ('Senza Glutine', 'Base senza glutine', 2.50, 3)
ON CONFLICT DO NOTHING;

INSERT INTO dolci_types (name, description, price, sort_order) VALUES
  ('Tiramisù', 'Tiramisù classico', 5.00, 1),
  ('Panna Cotta', 'Panna cotta', 4.50, 2),
  ('Gelato', 'Gelato artigianale', 4.00, 3)
ON CONFLICT DO NOTHING;
