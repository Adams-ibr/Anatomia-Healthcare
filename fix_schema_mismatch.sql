-- ============================================================================
-- FIX SCHEMA MISMATCH
-- ============================================================================
-- Your database has course_modules, but API expects course_sections
-- This renames the table and column to match what the API expects

-- Step 1: Rename course_modules table to course_sections
ALTER TABLE IF EXISTS course_modules RENAME TO course_sections;

-- Step 2: Rename module_id column in lessons table to section_id
ALTER TABLE IF EXISTS lessons RENAME COLUMN module_id TO section_id;

-- Step 3: Verify the change
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('course_sections', 'lessons')
  AND column_name IN ('id', 'course_id', 'section_id')
ORDER BY table_name, ordinal_position;
