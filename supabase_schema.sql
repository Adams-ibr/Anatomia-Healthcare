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


-- ============================================================================
-- ENROLLMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'suspended', 'expired')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  price_paid DECIMAL(10, 2) DEFAULT 0,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  current_module_id UUID,
  current_lesson_id UUID,
  completed_lessons TEXT[] DEFAULT '{}',
  quiz_scores JSONB DEFAULT '[]',
  certificate_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_at ON enrollments(enrolled_at DESC);

-- Enable RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own enrollments" ON enrollments;
CREATE POLICY "Users can view their own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own enrollments" ON enrollments;
CREATE POLICY "Users can update their own enrollments" ON enrollments
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all enrollments" ON enrollments;
CREATE POLICY "Admins can view all enrollments" ON enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create enrollments" ON enrollments;
CREATE POLICY "Authenticated users can create enrollments" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  subtotal DECIMAL(10, 2) DEFAULT 0,
  tax DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  payment_reference TEXT,
  payment_data JSONB,
  items JSONB NOT NULL DEFAULT '[]',
  billing_address JSONB,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own orders" ON orders;
CREATE POLICY "Users can view their own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
CREATE POLICY "Authenticated users can create orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update orders" ON orders;
CREATE POLICY "System can update orders" ON orders
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- CERTIFICATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  completion_date TIMESTAMPTZ NOT NULL,
  score INTEGER,
  grade TEXT,
  instructor_signature TEXT,
  template_id TEXT,
  metadata JSONB DEFAULT '{}',
  verification_url TEXT,
  is_active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at DESC);

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own certificates" ON certificates;
CREATE POLICY "Users can view their own certificates" ON certificates
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Public can verify certificates by number" ON certificates;
CREATE POLICY "Public can verify certificates by number" ON certificates
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage all certificates" ON certificates;
CREATE POLICY "Admins can manage all certificates" ON certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- FUNCTION: Generate Order Number
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get count of orders today
  SELECT COUNT(*) INTO counter
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format: ORD-YYYYMMDD-0001
  new_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((counter + 1)::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Generate Certificate Number
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  -- Get total count of certificates
  SELECT COUNT(*) INTO counter FROM certificates;
  
  -- Format: CERT-YYYY-000001
  new_number := 'CERT-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD((counter + 1)::TEXT, 6, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Auto-generate order numbers
-- ============================================================================
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION set_order_number();

-- ============================================================================
-- TRIGGER: Auto-generate certificate numbers
-- ============================================================================
CREATE OR REPLACE FUNCTION set_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.certificate_number IS NULL THEN
    NEW.certificate_number := generate_certificate_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_certificate_number ON certificates;
CREATE TRIGGER trigger_set_certificate_number
  BEFORE INSERT ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION set_certificate_number();

-- ============================================================================
-- TRIGGER: Update timestamps
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_enrollments_updated_at ON enrollments;
CREATE TRIGGER trigger_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trigger_certificates_updated_at ON certificates;
CREATE TRIGGER trigger_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
