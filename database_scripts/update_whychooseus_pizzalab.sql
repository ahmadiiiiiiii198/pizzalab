-- ============================================================================
-- PIZZALAB - Why Choose Us Section Database Update Script
-- ============================================================================
-- This script updates the WhyChooseUs section content in the database
-- with PIZZALAB-specific content matching the design requirements

-- Update or insert the WhyChooseUs content
INSERT INTO settings (key, value, created_at, updated_at) VALUES (
  'whyChooseUsContent',
  '{
    "title": "Perché scegliere PIZZALAB?",
    "subtitle": "Autentico sapore turco e pizza italiana dal 2020",
    "centralImage": "/placeholder-pizza-lab.jpg",
    "backgroundImage": "",
    "features": [
      {
        "id": "1",
        "icon": "🏆",
        "title": "Qualità garantita",
        "description": "Ingredienti freschi e di prima qualità"
      },
      {
        "id": "2", 
        "icon": "🍕",
        "title": "Impasto fatto in casa",
        "description": "Preparato quotidianamente con ricette tradizionali"
      },
      {
        "id": "3",
        "icon": "⚡",
        "title": "Consegna in 30 minuti",
        "description": "Servizio rapido e puntuale"
      },
      {
        "id": "4",
        "icon": "😊", 
        "title": "Clienti sempre felici",
        "description": "Soddisfazione garantita al 100%"
      },
      {
        "id": "5",
        "icon": "🔥",
        "title": "Cottura in forno elettrico", 
        "description": "Tecnologia moderna per risultati perfetti"
      },
      {
        "id": "6",
        "icon": "🌟",
        "title": "Lievitazione da 48 a 72 ore",
        "description": "Processo di maturazione per massima digeribilità"
      }
    ]
  }',
  NOW(),
  NOW()
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Verify the update
SELECT 
  key,
  value->>'title' as title,
  value->>'subtitle' as subtitle,
  jsonb_array_length(value->'features') as feature_count,
  updated_at
FROM settings 
WHERE key = 'whyChooseUsContent';

-- Display the features for verification
SELECT 
  key,
  jsonb_array_elements(value->'features')->>'title' as feature_title,
  jsonb_array_elements(value->'features')->>'icon' as feature_icon
FROM settings 
WHERE key = 'whyChooseUsContent';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if the settings table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'settings'
) as settings_table_exists;

-- Check current WhyChooseUs content
SELECT 
  key,
  value,
  created_at,
  updated_at
FROM settings 
WHERE key = 'whyChooseUsContent';

-- ============================================================================
-- ROLLBACK SCRIPT (if needed)
-- ============================================================================

-- To rollback to previous content, uncomment and run:
/*
DELETE FROM settings WHERE key = 'whyChooseUsContent';
*/

-- ============================================================================
-- NOTES
-- ============================================================================

-- This script:
-- 1. Updates the WhyChooseUs section with PIZZALAB-specific content
-- 2. Uses the exact features and text from the design requirements
-- 3. Maintains the database structure compatibility
-- 4. Includes verification queries to confirm the update
-- 5. Provides rollback option if needed

-- The content includes:
-- - PIZZALAB branding in title
-- - 6 features with appropriate icons and descriptions
-- - Subtitle mentioning Turkish and Italian flavors since 2020
-- - Placeholder image path for central image

-- After running this script, the WhyChooseUs section will display
-- the new PIZZALAB content with the updated design layout.
