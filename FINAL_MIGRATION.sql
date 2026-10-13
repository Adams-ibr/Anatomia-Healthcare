-- ============================================================================
-- ANATOMIA HEALTHCARE - COMPLETE DATABASE MIGRATION
-- ============================================================================
-- This migration adds all missing tables needed for the dashboard and system
-- Compatible with existing codebase structure
-- Run in Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================================

-- ============================================================================
-- 1. ENROLLMENTS TABLE
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
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_at ON enrollments(enrolled_at DESC);

-- Enable RLS
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "enrollments_select_own" ON enrollments;
CREATE POLICY "enrollments_select_own" ON enrollments
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "enrollments_insert_own" ON enrollments;
CREATE POLICY "enrollments_insert_own" ON enrollments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "enrollments_update_own" ON enrollments;
CREATE POLICY "enrollments_update_own" ON enrollments
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 2. ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method TEXT,
  payment_reference TEXT,
  payment_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "orders_select_own" ON orders;
CREATE POLICY "orders_select_own" ON orders
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_insert_own" ON orders;
CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "orders_update_own" ON orders;
CREATE POLICY "orders_update_own" ON orders
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- 3. ORDER_ITEMS TABLE (junction table for orders and courses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_course_id ON order_items(course_id);

-- Enable RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (inherit from orders table)
DROP POLICY IF EXISTS "order_items_select_via_order" ON order_items;
CREATE POLICY "order_items_select_via_order" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "order_items_insert_via_order" ON order_items;
CREATE POLICY "order_items_insert_via_order" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.id = order_items.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 4. CERTIFICATES TABLE
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON certificates(issued_at DESC);

-- Enable RLS
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "certificates_select_own" ON certificates;
CREATE POLICY "certificates_select_own" ON certificates
  FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "certificates_select_public_active" ON certificates;
CREATE POLICY "certificates_select_public_active" ON certificates
  FOR SELECT USING (is_active = true);

-- ============================================================================
-- 5. TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to enrollments
DROP TRIGGER IF EXISTS set_enrollments_updated_at ON enrollments;
CREATE TRIGGER set_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to orders
DROP TRIGGER IF EXISTS set_orders_updated_at ON orders;
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply to certificates
DROP TRIGGER IF EXISTS set_certificates_updated_at ON certificates;
CREATE TRIGGER set_certificates_updated_at
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. VERIFICATION & COMPLETION MESSAGE
-- ============================================================================
DO $$
DECLARE
  enr_exists BOOLEAN;
  ord_exists BOOLEAN;
  ord_items_exists BOOLEAN;
  cert_exists BOOLEAN;
BEGIN
  -- Check if tables exist
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'enrollments'
  ) INTO enr_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'orders'
  ) INTO ord_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'order_items'
  ) INTO ord_items_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'certificates'
  ) INTO cert_exists;
  
  -- Display results
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '      ANATOMIA DATABASE MIGRATION';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  
  IF enr_exists THEN
    RAISE NOTICE '✓ enrollments table ready';
  ELSE
    RAISE WARNING '✗ enrollments table not created';
  END IF;
  
  IF ord_exists THEN
    RAISE NOTICE '✓ orders table ready';
  ELSE
    RAISE WARNING '✗ orders table not created';
  END IF;
  
  IF ord_items_exists THEN
    RAISE NOTICE '✓ order_items table ready';
  ELSE
    RAISE WARNING '✗ order_items table not created';
  END IF;
  
  IF cert_exists THEN
    RAISE NOTICE '✓ certificates table ready';
  ELSE
    RAISE WARNING '✗ certificates table not created';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  
  IF enr_exists AND ord_exists AND ord_items_exists AND cert_exists THEN
    RAISE NOTICE 'SUCCESS! All tables created successfully.';
    RAISE NOTICE 'Your dashboard is now ready to use!';
  ELSE
    RAISE WARNING 'Some tables failed to create. Check errors above.';
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;
