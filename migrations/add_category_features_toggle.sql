-- Migration: Add aggiunti_enabled, bevande_enabled, and impasto_enabled fields to categories table
-- This allows enabling/disabling extras, drinks, and impasto features per category

-- Add the new columns to the categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS aggiunti_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bevande_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS impasto_enabled BOOLEAN DEFAULT true;

-- Update existing categories to have these features enabled by default
UPDATE categories
SET aggiunti_enabled = true, bevande_enabled = true, impasto_enabled = true
WHERE aggiunti_enabled IS NULL OR bevande_enabled IS NULL OR impasto_enabled IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN categories.aggiunti_enabled IS 'Enable/disable extras (aggiunti) feature for this category';
COMMENT ON COLUMN categories.bevande_enabled IS 'Enable/disable drinks (bevande) feature for this category';
COMMENT ON COLUMN categories.impasto_enabled IS 'Enable/disable impasto (dough type) selection for this category';

-- Create index for performance if needed
CREATE INDEX IF NOT EXISTS idx_categories_features ON categories(aggiunti_enabled, bevande_enabled, impasto_enabled);
