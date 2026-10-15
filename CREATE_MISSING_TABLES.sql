-- ============================================================================
-- CREATE ONLY MISSING TABLES
-- ============================================================================
-- This creates tables that don't exist without breaking existing ones

-- First, create the enums if they don't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('student', 'instructor', 'admin', 'support');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.course_status AS ENUM ('published', 'draft', 'pending', 'approved', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.course_level AS ENUM ('Beginner', 'Intermediate', 'Advanced');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.lesson_type AS ENUM ('video', 'article', 'pdf', 'audio', 'quiz', 'assignment', 'exam', 'project');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.enrollment_status AS ENUM ('active', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- CREATE PROFILES TABLE (THE CRITICAL ONE!)
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role public.app_role not null default 'student',
  avatar text,
  title text,
  bio text,
  skills text[] default '{}',
  headline text,
  website text,
  student_count integer not null default 0,
  course_count integer not null default 0,
  rating numeric(2,1) not null default 0,
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  password_hash text not null default '',
  email_confirmed boolean not null default false,
  email_confirmation_token text,
  email_confirmation_token_expires timestamptz,
  password_reset_token text,
  password_reset_token_expires timestamptz
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles (email);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON profiles;
CREATE POLICY "Profiles viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (id = auth.uid());

-- ============================================================================
-- CREATE CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  color text default '#1B4E9B',
  "order" integer not null default 0,
  course_count integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS categories_slug_idx ON categories (slug);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories viewable by everyone" ON categories;
CREATE POLICY "Categories viewable by everyone" 
  ON categories FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;
CREATE POLICY "Authenticated users can manage categories" 
  ON categories FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'instructor'))
  );

-- ============================================================================
-- CREATE USER_SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  token_hash text not null unique,
  user_agent text,
  ip_address text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days'),
  last_accessed timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS user_sessions_user_idx ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS user_sessions_token_idx ON user_sessions (token_hash);
CREATE INDEX IF NOT EXISTS user_sessions_expires_idx ON user_sessions (expires_at);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sessions" ON user_sessions;
CREATE POLICY "Users can view own sessions" 
  ON user_sessions FOR SELECT 
  USING (user_id = auth.uid());

-- ============================================================================
-- FIX EXISTING COURSES TABLE (add missing columns if needed)
-- ============================================================================
DO $$ 
BEGIN
  -- Add instructor_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'instructor_id'
  ) THEN
    ALTER TABLE courses ADD COLUMN instructor_id uuid REFERENCES profiles(id);
  END IF;

  -- Add status if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'status'
  ) THEN
    ALTER TABLE courses ADD COLUMN status public.course_status DEFAULT 'draft';
  END IF;
END $$;

-- ============================================================================
-- CREATE COURSE_SECTIONS TABLE (if course_modules doesn't exist)
-- ============================================================================
DO $$
BEGIN
  -- If course_modules exists, rename it to course_sections
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_modules') THEN
    ALTER TABLE course_modules RENAME TO course_sections;
    RAISE NOTICE '✅ Renamed course_modules to course_sections';
  END IF;
EXCEPTION
  WHEN duplicate_table THEN
    RAISE NOTICE 'ℹ️  course_sections already exists';
END $$;

CREATE TABLE IF NOT EXISTS course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- Add position column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_sections' AND column_name = 'position'
  ) THEN
    ALTER TABLE course_sections ADD COLUMN position INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS course_sections_course_idx ON course_sections (course_id);

ALTER TABLE course_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage sections" ON course_sections;
CREATE POLICY "Authenticated users can manage sections" 
  ON course_sections FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

-- ============================================================================
-- FIX LESSONS TABLE (rename module_id to section_id if needed)
-- ============================================================================
DO $$
BEGIN
  -- If lessons has module_id, rename it to section_id
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lessons' AND column_name = 'module_id'
  ) THEN
    ALTER TABLE lessons RENAME COLUMN module_id TO section_id;
    RAISE NOTICE '✅ Renamed module_id to section_id in lessons';
  END IF;
EXCEPTION
  WHEN undefined_column THEN
    RAISE NOTICE 'ℹ️  section_id already exists';
END $$;

-- Ensure lessons table exists
CREATE TABLE IF NOT EXISTS lessons (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references course_sections(id) on delete cascade,
  title text not null,
  type text not null default 'video',
  duration integer not null default 0,
  content text not null default '',
  video_url text,
  resource_url text,
  position integer not null default 0,
  is_free boolean not null default false,
  created_at timestamptz not null default now()
);

-- Add position column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'lessons' AND column_name = 'position'
  ) THEN
    ALTER TABLE lessons ADD COLUMN position INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS lessons_section_idx ON lessons (section_id);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage lessons" ON lessons;
CREATE POLICY "Authenticated users can manage lessons" 
  ON lessons FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

-- ============================================================================
-- CREATE OTHER MISSING TABLES
-- ============================================================================

-- Course Objectives
CREATE TABLE IF NOT EXISTS course_objectives (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  text text not null,
  position integer default 0
);

-- Add position column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_objectives' AND column_name = 'position'
  ) THEN
    ALTER TABLE course_objectives ADD COLUMN position INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS course_objectives_course_idx ON course_objectives (course_id);

ALTER TABLE course_objectives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage objectives" ON course_objectives;
CREATE POLICY "Authenticated users can manage objectives" 
  ON course_objectives FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

-- Course Requirements
CREATE TABLE IF NOT EXISTS course_requirements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  text text not null,
  position integer default 0
);

-- Add position column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'course_requirements' AND column_name = 'position'
  ) THEN
    ALTER TABLE course_requirements ADD COLUMN position INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS course_requirements_course_idx ON course_requirements (course_id);

ALTER TABLE course_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage requirements" ON course_requirements;
CREATE POLICY "Authenticated users can manage requirements" 
  ON course_requirements FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

-- Course FAQs
CREATE TABLE IF NOT EXISTS course_faqs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  question text not null,
  answer text not null
);

CREATE INDEX IF NOT EXISTS course_faqs_course_idx ON course_faqs (course_id);

ALTER TABLE course_faqs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage FAQs" ON course_faqs;
CREATE POLICY "Authenticated users can manage FAQs" 
  ON course_faqs FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  description text not null default '',
  time_limit integer not null default 30,
  passing_score integer not null default 60,
  retake_limit integer not null default 3,
  created_at timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS assessments_course_idx ON assessments (course_id);

ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage assessments" ON assessments;
CREATE POLICY "Authenticated users can manage assessments" 
  ON assessments FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

-- Assessment Questions
CREATE TABLE IF NOT EXISTS assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments(id) on delete cascade,
  type text not null default 'mc',
  question text not null,
  options jsonb,
  answer text,
  explanation text default '',
  position integer default 0,
  points integer default 1
);

-- Add missing columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessment_questions' AND column_name = 'position'
  ) THEN
    ALTER TABLE assessment_questions ADD COLUMN position INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assessment_questions' AND column_name = 'points'
  ) THEN
    ALTER TABLE assessment_questions ADD COLUMN points INTEGER DEFAULT 1;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS assessment_questions_assessment_idx ON assessment_questions (assessment_id);

ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can manage questions" ON assessment_questions;
CREATE POLICY "Authenticated users can manage questions" 
  ON assessment_questions FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ MISSING TABLES CREATED SUCCESSFULLY!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE '✅ profiles table created';
  RAISE NOTICE '✅ categories table created';
  RAISE NOTICE '✅ user_sessions table created';
  RAISE NOTICE '✅ course_sections table created';
  RAISE NOTICE '✅ lessons table fixed (section_id)';
  RAISE NOTICE '✅ course_objectives table created';
  RAISE NOTICE '✅ course_requirements table created';
  RAISE NOTICE '✅ course_faqs table created';
  RAISE NOTICE '✅ assessments table created';
  RAISE NOTICE '✅ assessment_questions table created';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEP: Create your admin account';
  RAISE NOTICE 'Run this SQL:';
  RAISE NOTICE '';
  RAISE NOTICE 'INSERT INTO profiles (name, email, role, password_hash, email_confirmed, is_active)';
  RAISE NOTICE 'VALUES (''Your Name'', ''your-email@example.com'', ''admin'', '''', true, true);';
  RAISE NOTICE '';
END $$;
