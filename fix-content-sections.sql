-- Fix content_sections table by adding missing sort_order column
-- Run this in Supabase SQL Editor

-- Add sort_order column if it doesn't exist
ALTER TABLE content_sections 
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Update existing rows to have sequential sort_order
UPDATE content_sections 
SET sort_order = COALESCE(
  (SELECT COUNT(*) FROM content_sections c2 WHERE c2.id < content_sections.id),
  0
)
WHERE sort_order IS NULL OR sort_order = 0;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_content_sections_sort_order 
ON content_sections(sort_order);

-- Verify the fix
SELECT id, section_key, section_name, sort_order 
FROM content_sections 
ORDER BY sort_order;
