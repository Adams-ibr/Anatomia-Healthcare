-- ============================================================================
-- ADD MISSING COLUMNS TO EXISTING COURSES TABLE
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor
-- This adds columns needed by the admin interface without recreating the table

-- Add instructor_id column if it doesn't exist (for compatibility with admin pages)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'instructor_id'
  ) THEN
    ALTER TABLE courses ADD COLUMN instructor_id UUID;
    COMMENT ON COLUMN courses.instructor_id IS 'References the instructor/teacher for this course';
  END IF;
END $$;

-- Add thumbnail_url column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'thumbnail_url'
  ) THEN
    ALTER TABLE courses ADD COLUMN thumbnail_url TEXT;
    COMMENT ON COLUMN courses.thumbnail_url IS 'URL to the course thumbnail image';
  END IF;
END $$;

-- Add has_certificate column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'has_certificate'
  ) THEN
    ALTER TABLE courses ADD COLUMN has_certificate BOOLEAN DEFAULT true;
    COMMENT ON COLUMN courses.has_certificate IS 'Whether this course awards a certificate upon completion';
  END IF;
END $$;

-- Add is_published column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE courses ADD COLUMN is_published BOOLEAN DEFAULT false;
    COMMENT ON COLUMN courses.is_published IS 'Whether this course is published and visible to students';
  END IF;
END $$;

-- Enable RLS on courses if not already enabled
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Authenticated users can insert courses" ON courses;
DROP POLICY IF EXISTS "Users can update their own courses" ON courses;
DROP POLICY IF EXISTS "Users can delete their own courses" ON courses;

-- Create RLS Policies for courses
CREATE POLICY "Published courses are viewable by everyone" 
  ON courses FOR SELECT 
  USING (is_published = true OR auth.uid() = created_by OR auth.uid() = instructor_id);

CREATE POLICY "Authenticated users can insert courses" 
  ON courses FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Course creators and instructors can update" 
  ON courses FOR UPDATE 
  USING (auth.uid() = created_by OR auth.uid() = instructor_id);

CREATE POLICY "Course creators and instructors can delete" 
  ON courses FOR DELETE 
  USING (auth.uid() = created_by OR auth.uid() = instructor_id);

-- Verify the changes
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'courses' 
  AND column_name IN ('instructor_id', 'thumbnail_url', 'has_certificate', 'is_published', 'created_by')
ORDER BY column_name;
