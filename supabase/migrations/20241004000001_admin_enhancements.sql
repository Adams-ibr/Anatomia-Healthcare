-- ============================================================================
-- ADMIN PANEL ENHANCEMENTS
-- Adds helpful columns to existing tables for admin components
-- All changes are OPTIONAL and backwards compatible
-- ============================================================================

-- Articles: Add view counter and published status tracking
ALTER TABLE articles 
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Gallery: Add tagging and view tracking
ALTER TABLE gallery_items 
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS uploaded_by varchar REFERENCES users(id) ON DELETE SET NULL;

-- FAQ: Add engagement tracking
ALTER TABLE faq_items 
  ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS helpful_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_published boolean DEFAULT true;

-- Partners: Enhanced partner management
ALTER TABLE partners 
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS start_date timestamp DEFAULT now(),
  ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- Contact Messages: Better workflow management
ALTER TABLE contact_messages 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS assigned_to varchar REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

-- Careers: Enhanced job posting management
ALTER TABLE careers 
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS application_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS salary text,
  ADD COLUMN IF NOT EXISTS posted_at timestamp DEFAULT now(),
  ADD COLUMN IF NOT EXISTS closing_date timestamp;

-- Job Applications: Add updated_at tracking
ALTER TABLE job_applications 
  ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now();

-- Products: Add inventory tracking
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS sku text UNIQUE,
  ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS is_digital boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sales_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'available';

-- Departments: Add member count tracking
ALTER TABLE departments 
  ADD COLUMN IF NOT EXISTS member_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS course_count integer DEFAULT 0;

-- ============================================================================
-- INDEXES FOR ADMIN QUERIES
-- ============================================================================

-- Articles
CREATE INDEX IF NOT EXISTS idx_articles_view_count ON articles(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

-- Gallery
CREATE INDEX IF NOT EXISTS idx_gallery_view_count ON gallery_items(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_uploaded_by ON gallery_items(uploaded_by);

-- Contact Messages
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_assigned ON contact_messages(assigned_to);
CREATE INDEX IF NOT EXISTS idx_contact_starred ON contact_messages(is_starred) WHERE is_starred = true;

-- Partners
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_type ON partners(type);
CREATE INDEX IF NOT EXISTS idx_partners_featured ON partners(is_featured) WHERE is_featured = true;

-- Careers
CREATE INDEX IF NOT EXISTS idx_careers_status ON careers(status);

-- Products
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that need it
CREATE TRIGGER IF NOT EXISTS update_contact_messages_updated_at 
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR ADMIN DASHBOARDS
-- ============================================================================

-- Admin Overview Stats
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
  (SELECT COUNT(*) FROM members WHERE is_active = true) as active_members,
  (SELECT COUNT(*) FROM courses WHERE is_published = true) as published_courses,
  (SELECT COUNT(*) FROM articles WHERE is_published = true) as published_articles,
  (SELECT COUNT(*) FROM contact_messages WHERE status = 'new') as unread_contacts,
  (SELECT COUNT(*) FROM job_applications WHERE status = 'pending') as pending_applications,
  (SELECT COUNT(*) FROM enrollments) as total_enrollments,
  (SELECT COUNT(*) FROM certificates) as certificates_issued;

-- Course Statistics View
CREATE OR REPLACE VIEW course_stats AS
SELECT 
  c.id,
  c.title,
  c.slug,
  COUNT(DISTINCT e.member_id) as enrolled_count,
  COUNT(DISTINCT cm.id) as module_count,
  COUNT(DISTINCT l.id) as lesson_count,
  AVG(qa.score::numeric / NULLIF(qa.max_score, 0) * 100) as avg_quiz_score
FROM courses c
LEFT JOIN enrollments e ON e.course_id = c.id
LEFT JOIN course_modules cm ON cm.course_id = c.id
LEFT JOIN lessons l ON l.module_id = cm.id
LEFT JOIN quizzes q ON q.course_id = c.id
LEFT JOIN quiz_attempts qa ON qa.quiz_id = q.id
GROUP BY c.id, c.title, c.slug;

-- Member Activity View
CREATE OR REPLACE VIEW member_activity AS
SELECT 
  m.id,
  m.email,
  m.first_name,
  m.last_name,
  m.membership_tier,
  COUNT(DISTINCT e.id) as enrolled_courses,
  COUNT(DISTINCT lp.id) as lessons_completed,
  COUNT(DISTINCT qa.id) as quizzes_taken,
  MAX(lp.last_accessed_at) as last_activity
FROM members m
LEFT JOIN enrollments e ON e.member_id = m.id
LEFT JOIN lesson_progress lp ON lp.member_id = m.id AND lp.is_completed = true
LEFT JOIN quiz_attempts qa ON qa.member_id = m.id
GROUP BY m.id, m.email, m.first_name, m.last_name, m.membership_tier;

-- ============================================================================
-- COMMENTS
-- ============================================================================
-- This migration adds optional enhancements for admin components
-- All changes are backwards compatible
-- If a column already exists, it will be skipped (IF NOT EXISTS)
-- ============================================================================
