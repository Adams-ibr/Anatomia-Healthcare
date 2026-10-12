-- ============================================================================
-- SUPABASE DATABASE SCHEMA FOR ANATOMIA
-- ============================================================================
-- Run this SQL in your Supabase SQL Editor to create all necessary tables
-- Dashboard: https://supabase.com/dashboard

-- ============================================================================
-- COURSE CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS course_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#1B4E9B',
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  course_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_course_categories_slug ON course_categories(slug);
CREATE INDEX IF NOT EXISTS idx_course_categories_order ON course_categories("order");

-- Enable RLS
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Allow public read access" ON course_categories;
CREATE POLICY "Allow public read access" ON course_categories
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users full access" ON course_categories;
CREATE POLICY "Allow authenticated users full access" ON course_categories
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- COURSES TABLE - Check if columns exist, add if missing
-- ============================================================================
-- Add instructor_id column to courses table if it doesn't exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'courses') THEN
    -- Add instructor_id column if missing
    IF NOT EXISTS (SELECT FROM information_schema.columns 
                   WHERE table_name = 'courses' AND column_name = 'instructor_id') THEN
      ALTER TABLE courses ADD COLUMN instructor_id UUID REFERENCES auth.users(id);
      CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
      RAISE NOTICE 'Added instructor_id column to courses table';
    END IF;
  END IF;
END $$;

-- The courses table already exists, so we'll just ensure it has RLS enabled
ALTER TABLE IF EXISTS courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow public read published courses" ON courses;
  DROP POLICY IF EXISTS "Allow authenticated users full access to courses" ON courses;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Create policies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'courses') THEN
    EXECUTE 'CREATE POLICY "Allow public read published courses" ON courses FOR SELECT USING (is_published = true)';
    EXECUTE 'CREATE POLICY "Allow authenticated users full access to courses" ON courses FOR ALL USING (auth.role() = ''authenticated'')';
  END IF;
END $$;

-- ============================================================================
-- TEAM MEMBERS TABLE (Instructors)
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  title TEXT,
  role TEXT,
  bio TEXT,
  avatar TEXT,
  photo_url TEXT,
  linkedin_url TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_order ON team_members("order");

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read team members" ON team_members;
CREATE POLICY "Allow public read team members" ON team_members
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Allow authenticated full access to team" ON team_members;
CREATE POLICY "Allow authenticated full access to team" ON team_members
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- PARTNERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  type TEXT,
  status TEXT DEFAULT 'active',
  description TEXT,
  website TEXT,
  contact_name TEXT,
  contact_email TEXT,
  start_date TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_order ON partners("order");

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read partners" ON partners;
CREATE POLICY "Allow public read partners" ON partners
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Allow authenticated full access to partners" ON partners;
CREATE POLICY "Allow authenticated full access to partners" ON partners
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  description TEXT,
  category TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  cost_price NUMERIC(10,2),
  stock INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  is_digital BOOLEAN DEFAULT false,
  sales_count INTEGER DEFAULT 0,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read active products" ON products;
CREATE POLICY "Allow public read active products" ON products
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Allow authenticated full access to products" ON products;
CREATE POLICY "Allow authenticated full access to products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- ARTICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  cover_image TEXT,
  author_id UUID REFERENCES auth.users(id),
  category TEXT,
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  tags TEXT[]
);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published);

ALTER TABLE articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read published articles" ON articles;
CREATE POLICY "Allow public read published articles" ON articles
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Allow authenticated full access to articles" ON articles;
CREATE POLICY "Allow authenticated full access to articles" ON articles
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================================================

-- Sample Categories
INSERT INTO course_categories (name, slug, description, color, "order") VALUES
  ('Anatomy', 'anatomy', 'Human body structure and systems', '#1B4E9B', 1),
  ('Physiology', 'physiology', 'How the body functions', '#7c3aed', 2),
  ('Pathology', 'pathology', 'Disease and conditions', '#dc2626', 3),
  ('Clinical Skills', 'clinical-skills', 'Practical medical procedures', '#059669', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Anatomia database schema created successfully!';
  RAISE NOTICE 'Tables created: course_categories, courses, team_members, partners, products, articles';
  RAISE NOTICE 'All tables have RLS enabled with appropriate policies';
END $$;
