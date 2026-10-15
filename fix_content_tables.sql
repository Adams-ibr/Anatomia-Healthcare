-- ============================================================================
-- FIX CONTENT CREATION: ADD MISSING TABLES
-- ============================================================================
-- This script creates all tables required for course content management
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- COURSE SECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_sections_course_id ON course_sections(course_id);
CREATE INDEX IF NOT EXISTS idx_course_sections_position ON course_sections(position);

-- Enable RLS
ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view published course sections" ON course_sections;
CREATE POLICY "Public can view published course sections" ON course_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_sections.course_id 
      AND courses.is_published = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users can manage course sections" ON course_sections;
CREATE POLICY "Authenticated users can manage course sections" ON course_sections
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- LESSONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'video' CHECK (type IN ('video', 'text', 'quiz', 'assignment', 'resource')),
  duration INTEGER DEFAULT 0,
  content TEXT,
  video_url TEXT,
  resource_url TEXT,
  position INTEGER DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_section_id ON lessons(section_id);
CREATE INDEX IF NOT EXISTS idx_lessons_position ON lessons(position);

-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view published lessons" ON lessons;
CREATE POLICY "Public can view published lessons" ON lessons
  FOR SELECT USING (
    is_preview = true OR EXISTS (
      SELECT 1 FROM course_sections cs
      JOIN courses c ON c.id = cs.course_id
      WHERE cs.id = lessons.section_id 
      AND c.is_published = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users can manage lessons" ON lessons;
CREATE POLICY "Authenticated users can manage lessons" ON lessons
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- COURSE OBJECTIVES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_objectives (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_objectives_course_id ON course_objectives(course_id);
CREATE INDEX IF NOT EXISTS idx_course_objectives_position ON course_objectives(position);

-- Enable RLS
ALTER TABLE course_objectives ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view course objectives" ON course_objectives;
CREATE POLICY "Public can view course objectives" ON course_objectives
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_objectives.course_id 
      AND courses.is_published = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users can manage objectives" ON course_objectives;
CREATE POLICY "Authenticated users can manage objectives" ON course_objectives
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- COURSE REQUIREMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_requirements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_requirements_course_id ON course_requirements(course_id);
CREATE INDEX IF NOT EXISTS idx_course_requirements_position ON course_requirements(position);

-- Enable RLS
ALTER TABLE course_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view course requirements" ON course_requirements;
CREATE POLICY "Public can view course requirements" ON course_requirements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_requirements.course_id 
      AND courses.is_published = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users can manage requirements" ON course_requirements;
CREATE POLICY "Authenticated users can manage requirements" ON course_requirements
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- COURSE FAQS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_faqs_course_id ON course_faqs(course_id);

-- Enable RLS
ALTER TABLE course_faqs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view course FAQs" ON course_faqs;
CREATE POLICY "Public can view course FAQs" ON course_faqs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = course_faqs.course_id 
      AND courses.is_published = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users can manage FAQs" ON course_faqs;
CREATE POLICY "Authenticated users can manage FAQs" ON course_faqs
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- ASSESSMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit INTEGER DEFAULT 30,
  passing_score INTEGER DEFAULT 60,
  retake_limit INTEGER DEFAULT 3,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessments_course_id ON assessments(course_id);

-- Enable RLS
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view published assessments" ON assessments;
CREATE POLICY "Public can view published assessments" ON assessments
  FOR SELECT USING (
    is_published = true AND EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = assessments.course_id 
      AND courses.is_published = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users can manage assessments" ON assessments;
CREATE POLICY "Authenticated users can manage assessments" ON assessments
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- ASSESSMENT QUESTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS assessment_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'mc' CHECK (type IN ('mc', 'tf', 'essay', 'short_answer', 'fill_blank')),
  question TEXT NOT NULL,
  options JSONB,
  answer TEXT,
  explanation TEXT,
  position INTEGER DEFAULT 0,
  points INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_position ON assessment_questions(position);

-- Enable RLS
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view published assessment questions" ON assessment_questions;
CREATE POLICY "Public can view published assessment questions" ON assessment_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessments a
      JOIN courses c ON c.id = a.course_id
      WHERE a.id = assessment_questions.assessment_id 
      AND a.is_published = true
      AND c.is_published = true
    )
  );

DROP POLICY IF EXISTS "Authenticated users can manage questions" ON assessment_questions;
CREATE POLICY "Authenticated users can manage questions" ON assessment_questions
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- TRIGGERS: Update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
DROP TRIGGER IF EXISTS update_course_sections_updated_at ON course_sections;
CREATE TRIGGER update_course_sections_updated_at
  BEFORE UPDATE ON course_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_lessons_updated_at ON lessons;
CREATE TRIGGER update_lessons_updated_at
  BEFORE UPDATE ON lessons
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
CREATE TRIGGER update_assessments_updated_at
  BEFORE UPDATE ON assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '✓ course_sections table created';
  RAISE NOTICE '✓ lessons table created';
  RAISE NOTICE '✓ course_objectives table created';
  RAISE NOTICE '✓ course_requirements table created';
  RAISE NOTICE '✓ course_faqs table created';
  RAISE NOTICE '✓ assessments table created';
  RAISE NOTICE '✓ assessment_questions table created';
  RAISE NOTICE '';
  RAISE NOTICE 'Content creation tables are now ready!';
  RAISE NOTICE 'You can now create and edit courses with full content.';
END $$;
