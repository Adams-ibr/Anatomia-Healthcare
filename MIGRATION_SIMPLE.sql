-- ============================================================================
-- SIMPLE MIGRATION FOR DASHBOARD TABLES
-- ============================================================================
-- This creates the three tables needed for dashboard stats
-- Run this in Supabase SQL Editor

-- ============================================================================
-- ENROLLMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0,
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Simple policies - users see their own, service role sees all
CREATE POLICY "Users view own enrollments" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own enrollments" ON enrollments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users create own enrollments" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number TEXT UNIQUE NOT NULL DEFAULT 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'),
  status TEXT DEFAULT 'pending',
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
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Simple policies
CREATE POLICY "Users view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- CERTIFICATES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number TEXT UNIQUE NOT NULL DEFAULT 'CERT-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  completion_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON certificates(certificate_number);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Simple policies
CREATE POLICY "Users view own certificates" ON certificates
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Public verify certificates" ON certificates
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'Migration Complete!';
  RAISE NOTICE '==============================================';
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'enrollments') THEN
    RAISE NOTICE '✓ enrollments table created';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'orders') THEN
    RAISE NOTICE '✓ orders table created';
  END IF;
  
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'certificates') THEN
    RAISE NOTICE '✓ certificates table created';
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'You can now use the dashboard!';
  RAISE NOTICE '==============================================';
END $$;
