-- Update categories table to support dynamic feature toggles
-- This script adds columns for new feature types automatically

-- First, ensure feature_types table has sort_order column
ALTER TABLE feature_types ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing feature types with sort order if they don't have one
UPDATE feature_types SET sort_order =
  CASE
    WHEN slug = 'impasto' THEN 1
    WHEN slug = 'aggiunti' THEN 2
    WHEN slug = 'bevande' THEN 3
    ELSE (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM feature_types ft WHERE ft.id != feature_types.id)
  END
WHERE sort_order IS NULL OR sort_order = 0;

-- First, let's check what feature types exist and add their columns
DO $$
DECLARE
    feature_record RECORD;
    column_name TEXT;
    sql_statement TEXT;
BEGIN
    -- Loop through all active feature types
    FOR feature_record IN 
        SELECT slug, name FROM feature_types WHERE is_active = true
    LOOP
        column_name := feature_record.slug || '_enabled';
        
        -- Check if column already exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'categories' 
            AND column_name = column_name
        ) THEN
            -- Add the column
            sql_statement := 'ALTER TABLE categories ADD COLUMN ' || column_name || ' BOOLEAN DEFAULT true';
            EXECUTE sql_statement;
            
            RAISE NOTICE 'Added column: %', column_name;
        ELSE
            RAISE NOTICE 'Column already exists: %', column_name;
        END IF;
    END LOOP;
END $$;

-- Create a function to automatically add feature toggle columns when new features are created
CREATE OR REPLACE FUNCTION add_feature_toggle_column()
RETURNS TRIGGER AS $$
DECLARE
    column_name TEXT;
    sql_statement TEXT;
BEGIN
    -- Only process if this is a new active feature type
    IF NEW.is_active = true THEN
        column_name := NEW.slug || '_enabled';
        
        -- Check if column already exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'categories' 
            AND column_name = column_name
        ) THEN
            -- Add the column
            sql_statement := 'ALTER TABLE categories ADD COLUMN ' || column_name || ' BOOLEAN DEFAULT true';
            EXECUTE sql_statement;
            
            RAISE NOTICE 'Auto-added feature toggle column: %', column_name;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically add columns when new feature types are created
DROP TRIGGER IF EXISTS trigger_add_feature_toggle_column ON feature_types;
CREATE TRIGGER trigger_add_feature_toggle_column
    AFTER INSERT OR UPDATE ON feature_types
    FOR EACH ROW
    EXECUTE FUNCTION add_feature_toggle_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Update existing categories to have all feature toggles enabled by default
DO $$
DECLARE
    feature_record RECORD;
    category_record RECORD;
    column_name TEXT;
    sql_statement TEXT;
BEGIN
    -- For each feature type
    FOR feature_record IN 
        SELECT slug FROM feature_types WHERE is_active = true
    LOOP
        column_name := feature_record.slug || '_enabled';
        
        -- Update all existing categories to have this feature enabled by default
        sql_statement := 'UPDATE categories SET ' || column_name || ' = true WHERE ' || column_name || ' IS NULL';
        EXECUTE sql_statement;
        
        RAISE NOTICE 'Updated existing categories for feature: %', column_name;
    END LOOP;
END $$;

-- Create a function to get all feature toggle columns for a category
CREATE OR REPLACE FUNCTION get_category_feature_toggles(category_id UUID)
RETURNS TABLE(feature_slug TEXT, feature_name TEXT, is_enabled BOOLEAN) AS $$
DECLARE
    feature_record RECORD;
    column_name TEXT;
    is_enabled_val BOOLEAN;
BEGIN
    FOR feature_record IN 
        SELECT slug, name FROM feature_types WHERE is_active = true ORDER BY created_at
    LOOP
        column_name := feature_record.slug || '_enabled';
        
        -- Get the value for this category
        EXECUTE format('SELECT %I FROM categories WHERE id = $1', column_name) 
        INTO is_enabled_val USING category_id;
        
        feature_slug := feature_record.slug;
        feature_name := feature_record.name;
        is_enabled := COALESCE(is_enabled_val, true);
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_category_feature_toggles(UUID) TO authenticated;

-- Create a view that shows categories with all their feature toggles
CREATE OR REPLACE VIEW categories_with_features AS
SELECT 
    c.*,
    COALESCE(c.impasto_enabled, true) as impasto_enabled,
    COALESCE(c.aggiunti_enabled, true) as aggiunti_enabled,
    COALESCE(c.bevande_enabled, true) as bevande_enabled
FROM categories c;

-- Grant access to the view
GRANT SELECT ON categories_with_features TO authenticated;

-- Create an index on feature toggle columns for better performance
DO $$
DECLARE
    feature_record RECORD;
    column_name TEXT;
    index_name TEXT;
BEGIN
    FOR feature_record IN 
        SELECT slug FROM feature_types WHERE is_active = true
    LOOP
        column_name := feature_record.slug || '_enabled';
        index_name := 'idx_categories_' || feature_record.slug || '_enabled';
        
        -- Create index if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_indexes 
            WHERE tablename = 'categories' 
            AND indexname = index_name
        ) THEN
            EXECUTE format('CREATE INDEX %I ON categories(%I)', index_name, column_name);
            RAISE NOTICE 'Created index: %', index_name;
        END IF;
    END LOOP;
END $$;
