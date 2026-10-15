-- ============================================================================
-- DIAGNOSTIC QUERIES - Run these in Supabase SQL Editor
-- ============================================================================
-- Copy this entire file and run it in: 
-- https://supabase.com/dashboard/project/evfdnyxrkrkcigkkrhyr/sql

-- ============================================================================
-- STEP 1: Check which tables exist
-- ============================================================================
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('course_sections', 'lessons', 'course_objectives', 'course_requirements', 'course_faqs', 'assessments', 'assessment_questions')
    THEN '✓ REQUIRED FOR CONTENT'
    ELSE 'exists'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- ============================================================================
-- STEP 2: Check courses table structure (ID type is critical!)
-- ============================================================================
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 3: Check if course_sections exists and its structure
-- ============================================================================
SELECT 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE table_name = 'course_sections';

-- If empty result, table doesn't exist!

-- ============================================================================
-- STEP 4: Check foreign key constraints
-- ============================================================================
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('course_sections', 'lessons', 'course_objectives', 'course_requirements', 'course_faqs', 'assessments', 'assessment_questions');

-- ============================================================================
-- RESULTS INTERPRETATION:
-- ============================================================================
-- 
-- STEP 1: If you DON'T see these tables, they need to be created:
--   - course_sections
--   - lessons  
--   - course_objectives
--   - course_requirements
--   - course_faqs
--   - assessments
--   - assessment_questions
--
-- STEP 2: The 'id' column MUST be 'uuid' type, not 'character varying' or 'text'
--   If it shows 'character varying', that's the problem!
--
-- STEP 3: If result is empty, course_sections table doesn't exist
--
-- STEP 4: Should show foreign keys like:
--   course_sections_course_id_fkey → courses(id)
--   lessons_section_id_fkey → course_sections(id)
--   etc.
--
-- ============================================================================
