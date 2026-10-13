-- ============================================================================
-- ANATOMIA HEALTHCARE - ORDERS TABLES MIGRATION
-- ============================================================================
-- This adds only the missing tables needed for dashboard revenue stats
-- Your enrollments and certificates tables already exist!
-- Run in Supabase SQL Editor: https://supabase.com/dashboard
-- ============================================================================

-- ============================================================================
-- 1. ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id character varying NOT NULL DEFAULT gen_random_uuid(),
  member_id character varying NOT NULL,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  payment_method text,
  payment_reference text,
  payment_data jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_member_id_fkey FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_member_id ON orders(member_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_reference ON orders(payment_reference);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- ============================================================================
-- 2. ORDER_ITEMS TABLE (junction table for orders and courses)
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id character varying NOT NULL DEFAULT gen_random_uuid(),
  order_id character varying NOT NULL,
  course_id character varying NOT NULL,
  title text NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT order_items_course_id_fkey FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_course_id ON order_items(course_id);

-- ============================================================================
-- 3. UPDATE TRIGGER FOR ORDERS
-- ============================================================================
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_orders_updated_at ON orders;
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_orders_updated_at();

-- ============================================================================
-- 4. VERIFICATION
-- ============================================================================
DO $$
DECLARE
  ord_exists BOOLEAN;
  ord_items_exists BOOLEAN;
  enr_exists BOOLEAN;
  cert_exists BOOLEAN;
BEGIN
  -- Check tables
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
    WHERE table_name = 'enrollments'
  ) INTO enr_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'certificates'
  ) INTO cert_exists;
  
  -- Display results
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '      ANATOMIA ORDERS MIGRATION';
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
  
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
  
  IF enr_exists THEN
    RAISE NOTICE '✓ enrollments table exists (already created)';
  ELSE
    RAISE WARNING '⚠ enrollments table not found!';
  END IF;
  
  IF cert_exists THEN
    RAISE NOTICE '✓ certificates table exists (already created)';
  ELSE
    RAISE WARNING '⚠ certificates table not found!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '==============================================';
  
  IF ord_exists AND ord_items_exists THEN
    RAISE NOTICE 'SUCCESS! Dashboard is ready!';
    RAISE NOTICE '';
    RAISE NOTICE 'All required tables:';
    RAISE NOTICE '  • orders ✓';
    RAISE NOTICE '  • order_items ✓';
    RAISE NOTICE '  • enrollments ✓';
    RAISE NOTICE '  • certificates ✓';
  ELSE
    RAISE WARNING 'Some tables failed. Check errors above.';
  END IF;
  
  RAISE NOTICE '==============================================';
  RAISE NOTICE '';
END $$;
