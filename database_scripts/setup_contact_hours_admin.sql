-- ============================================================================
-- PIZZALAB - Contact and Hours Admin Setup Script
-- ============================================================================
-- This script ensures proper setup of contact information and business hours
-- for the new ContactHoursManager admin component

-- Check current contact content
SELECT 
  'Current Contact Content' as info,
  key,
  value
FROM settings 
WHERE key = 'contactContent';

-- Check current business hours
SELECT 
  'Current Business Hours' as info,
  key,
  value
FROM settings 
WHERE key = 'businessHours';

-- Update or insert contact content with PIZZALAB information
INSERT INTO settings (key, value, created_at, updated_at) VALUES (
  'contactContent',
  '{
    "address": "Via Innovation, 1, 10100 Torino TO",
    "phone": "+393479190907",
    "email": "info@pizzalab.it",
    "mapUrl": "https://maps.google.com",
    "hours": "Lunedì: 18:30 - 22:30\nMartedì: 18:30 - 22:30\nMercoledì: 18:30 - 22:30\nGiovedì: 18:30 - 22:30\nVenerdì: 18:30 - 22:30\nSabato: 18:30 - 22:30\nDomenica: 18:30 - 22:30",
    "backgroundImage": ""
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Update or insert business hours with consistent PIZZALAB schedule
INSERT INTO settings (key, value, created_at, updated_at) VALUES (
  'businessHours',
  '{
    "monday": {
      "isOpen": true,
      "openTime": "18:30",
      "closeTime": "22:30"
    },
    "tuesday": {
      "isOpen": true,
      "openTime": "18:30",
      "closeTime": "22:30"
    },
    "wednesday": {
      "isOpen": true,
      "openTime": "18:30",
      "closeTime": "22:30"
    },
    "thursday": {
      "isOpen": true,
      "openTime": "18:30",
      "closeTime": "22:30"
    },
    "friday": {
      "isOpen": true,
      "openTime": "18:30",
      "closeTime": "22:30"
    },
    "saturday": {
      "isOpen": true,
      "openTime": "18:30",
      "closeTime": "22:30"
    },
    "sunday": {
      "isOpen": true,
      "openTime": "18:30",
      "closeTime": "22:30"
    }
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Verify the updates
SELECT 
  'Updated Contact Content' as info,
  key,
  value->>'address' as address,
  value->>'phone' as phone,
  value->>'email' as email,
  value->>'hours' as hours
FROM settings 
WHERE key = 'contactContent';

SELECT 
  'Updated Business Hours' as info,
  key,
  value->'monday'->>'openTime' as monday_open,
  value->'monday'->>'closeTime' as monday_close,
  value->'friday'->>'openTime' as friday_open,
  value->'friday'->>'closeTime' as friday_close
FROM settings 
WHERE key = 'businessHours';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if both settings exist and are properly formatted
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM settings WHERE key = 'contactContent') 
    THEN '✅ Contact Content exists'
    ELSE '❌ Contact Content missing'
  END as contact_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM settings WHERE key = 'businessHours') 
    THEN '✅ Business Hours exists'
    ELSE '❌ Business Hours missing'
  END as hours_status;

-- Show formatted hours for verification
SELECT 
  'Formatted Hours Display' as info,
  CONCAT(
    'Lunedì: ', value->'monday'->>'openTime', ' - ', value->'monday'->>'closeTime', E'\n',
    'Martedì: ', value->'tuesday'->>'openTime', ' - ', value->'tuesday'->>'closeTime', E'\n',
    'Mercoledì: ', value->'wednesday'->>'openTime', ' - ', value->'wednesday'->>'closeTime', E'\n',
    'Giovedì: ', value->'thursday'->>'openTime', ' - ', value->'thursday'->>'closeTime', E'\n',
    'Venerdì: ', value->'friday'->>'openTime', ' - ', value->'friday'->>'closeTime', E'\n',
    'Sabato: ', value->'saturday'->>'openTime', ' - ', value->'saturday'->>'closeTime', E'\n',
    'Domenica: ', value->'sunday'->>'openTime', ' - ', value->'sunday'->>'closeTime'
  ) as formatted_hours
FROM settings 
WHERE key = 'businessHours';

-- ============================================================================
-- NOTES
-- ============================================================================

-- This script:
-- 1. Sets up proper contact information for PIZZALAB
-- 2. Configures consistent business hours (18:30 - 22:30 daily)
-- 3. Ensures both contactContent and businessHours are synchronized
-- 4. Provides verification queries to confirm setup

-- The ContactHoursManager admin component will now be able to:
-- - Load existing contact information and hours
-- - Edit both contact details and business hours
-- - Automatically sync formatted hours between both settings
-- - Update footer and contact section displays in real-time

-- After running this script, administrators can use the new
-- "Contatti e Orari" section in the admin panel to manage
-- all contact information and opening hours.
