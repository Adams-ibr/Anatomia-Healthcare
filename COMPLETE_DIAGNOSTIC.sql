-- ============================================================================
-- COMPLETE DIAGNOSTIC - Check ALL content creation issues
-- ============================================================================
-- Run this in Supabase SQL Editor to see what's broken across the entire system

-- ============================================================================
-- 1. CHECK ALL TABLES IN DATABASE
-- ============================================================================
SELECT 
  tablename as table_name,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. CHECK INSERT POLICIES FOR ALL TABLES
-- ============================================================================
SELECT
  tablename,
  policyname,
  CASE cmd
    WHEN 'INSERT' THEN '✅ Has INSERT policy'
    ELSE cmd
  END as policy_type,
  qual as policy_condition
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 3. TABLES WITHOUT INSERT POLICIES (THESE WILL FAIL!)
-- ============================================================================
SELECT DISTINCT
  t.tablename,
  '❌ NO INSERT POLICY' as status
FROM pg_tables t
LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.cmd = 'INSERT'
WHERE t.schemaname = 'public'
  AND p.policyname IS NULL
  AND t.rowsecurity = true
ORDER BY t.tablename;

-- ============================================================================
-- 4. CHECK YOUR USER'S ROLE AND PERMISSIONS
-- ============================================================================
SELECT 
  id,
  email,
  role,
  is_active,
  email_confirmed
FROM profiles
LIMIT 5;

-- ============================================================================
-- 5. TEST ACTUAL INSERT OPERATIONS
-- ============================================================================
-- Try to insert test data into key tables (will show exact error)

-- Test 1: Articles
DO $$
BEGIN
  BEGIN
    INSERT INTO articles (title, slug, content, is_published)
    VALUES ('Test Article', 'test-article-diagnostic', 'Test content', false);
    RAISE NOTICE '✅ articles: INSERT works';
    DELETE FROM articles WHERE slug = 'test-article-diagnostic';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ articles: INSERT FAILED - %', SQLERRM;
  END;
END $$;

-- Test 2: Partners
DO $$
BEGIN
  BEGIN
    INSERT INTO partners (name, status)
    VALUES ('Test Partner', 'active');
    RAISE NOTICE '✅ partners: INSERT works';
    DELETE FROM partners WHERE name = 'Test Partner';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ partners: INSERT FAILED - %', SQLERRM;
  END;
END $$;

-- Test 3: Products
DO $$
BEGIN
  BEGIN
    INSERT INTO products (name, price)
    VALUES ('Test Product', 99.99);
    RAISE NOTICE '✅ products: INSERT works';
    DELETE FROM products WHERE name = 'Test Product';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ products: INSERT FAILED - %', SQLERRM;
  END;
END $$;

-- Test 4: Team Members
DO $$
BEGIN
  BEGIN
    INSERT INTO team_members (name, email, title)
    VALUES ('Test Member', 'test@example.com', 'Test Title');
    RAISE NOTICE '✅ team_members: INSERT works';
    DELETE FROM team_members WHERE email = 'test@example.com';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ team_members: INSERT FAILED - %', SQLERRM;
  END;
END $$;

-- Test 5: Categories
DO $$
BEGIN
  BEGIN
    INSERT INTO course_categories (name, slug)
    VALUES ('Test Category', 'test-category-diagnostic');
    RAISE NOTICE '✅ course_categories: INSERT works';
    DELETE FROM course_categories WHERE slug = 'test-category-diagnostic';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ course_categories: INSERT FAILED - %', SQLERRM;
  END;
END $$;

-- Test 6: Courses (if course_modules exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_modules') THEN
    BEGIN
      -- Your database uses course_modules, not course_sections
      RAISE NOTICE '⚠️  Found course_modules table (should be course_sections for API compatibility)';
    END;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_sections') THEN
    RAISE NOTICE '✅ Found course_sections table (correct for API)';
  END IF;
END $$;

-- ============================================================================
-- 6. SUMMARY OF ISSUES
-- ============================================================================
SELECT
  'DIAGNOSTIC COMPLETE' as status,
  'Check the messages above for:' as instructions,
  '1. Tables without INSERT policies' as check_1,
  '2. Failed INSERT tests' as check_2,
  '3. RLS disabled tables' as check_3,
  '4. course_modules vs course_sections mismatch' as check_4;
