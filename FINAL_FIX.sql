-- ============================================================================
-- FINAL FIX - Rename course_modules to course_sections
-- ============================================================================
-- This fixes the schema mismatch between database and Edge Function API
-- Run this in Supabase SQL Editor

-- Step 1: Rename the table
ALTER TABLE course_modules RENAME TO course_sections;

-- Step 2: Rename the foreign key column in lessons
ALTER TABLE lessons RENAME COLUMN module_id TO section_id;

-- Step 3: Create missing tables that Edge Function expects
-- (These might already exist from your earlier attempts, IF NOT EXISTS handles that)

CREATE TABLE IF NOT EXISTS course_objectives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_objectives_course_id ON course_objectives(course_id);

CREATE TABLE IF NOT EXISTS course_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_requirements_course_id ON course_requirements(course_id);

CREATE TABLE IF NOT EXISTS course_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_faqs_course_id ON course_faqs(course_id);

CREATE TABLE IF NOT EXISTS assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  time_limit INTEGER DEFAULT 30,
  passing_score INTEGER DEFAULT 60,
  retake_limit INTEGER DEFAULT 3,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_course_id ON assessments(course_id);

CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'mc' CHECK (type IN ('mc', 'multi', 'truefalse', 'short', 'essay', 'fill')),
  question TEXT NOT NULL,
  options JSONB,
  answer TEXT,
  explanation TEXT DEFAULT '',
  position INTEGER DEFAULT 0,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON assessment_questions(assessment_id);

-- Step 4: Enable RLS on new tables
ALTER TABLE course_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

-- Step 5: Add RLS policies
DROP POLICY IF EXISTS "Allow authenticated users to manage objectives" ON course_objectives;
CREATE POLICY "Allow authenticated users to manage objectives" ON course_objectives
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage requirements" ON course_requirements;
CREATE POLICY "Allow authenticated users to manage requirements" ON course_requirements
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage FAQs" ON course_faqs;
CREATE POLICY "Allow authenticated users to manage FAQs" ON course_faqs
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage assessments" ON assessments;
CREATE POLICY "Allow authenticated users to manage assessments" ON assessments
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users to manage questions" ON assessment_questions;
CREATE POLICY "Allow authenticated users to manage questions" ON assessment_questions
  FOR ALL USING (auth.role() = 'authenticated');

-- Step 6: Verify the changes
SELECT 
  'course_sections' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'course_sections'
  AND column_name IN ('id', 'course_id', 'title')
UNION ALL
SELECT 
  'lessons' as table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'lessons'
  AND column_name IN ('id', 'section_id', 'title')
ORDER BY table_name, column_name;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Database schema fixed!';
  RAISE NOTICE '✅ course_modules renamed to course_sections';
  RAISE NOTICE '✅ module_id renamed to section_id';
  RAISE NOTICE '✅ Missing tables created (objectives, requirements, FAQs, assessments)';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT: Update frontend code to use course_sections instead of course_modules';
END $$;
