-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR ANATOMIA
-- =============================================================================
-- ARCHITECTURE NOTE:
--   The server uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS entirely.
--   These policies protect against direct PostgREST (anon/authenticated) access.
--
-- STRATEGY:
--   1. Enable RLS on every table (silences Security Advisor warnings)
--   2. Sensitive/admin tables: NO policies = deny all direct access
--   3. Public content tables: allow anon SELECT on published/active rows only
--   4. User-owned data: allow authenticated members to read their own rows only
--
-- Run this script in the Supabase SQL Editor.
-- =============================================================================


-- =============================================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- =============================================================================

-- Auth / Identity
ALTER TABLE sessions              ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE members               ENABLE ROW LEVEL SECURITY;

-- Public / Marketing content
ALTER TABLE contact_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products              ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE careers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist              ENABLE ROW LEVEL SECURITY;
ALTER TABLE partners              ENABLE ROW LEVEL SECURITY;

-- LMS content
ALTER TABLE course_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_modules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons               ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_assets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_anatomy_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress       ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options          ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_prerequisites  ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_topics       ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank         ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_bank_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_decks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards            ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_progress    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_achievements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE anatomy_models        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions  ENABLE ROW LEVEL SECURITY;

-- Interactions
ALTER TABLE conversations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies         ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes                      ENABLE ROW LEVEL SECURITY;

-- Billing
ALTER TABLE membership_plans      ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_pricing          ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_access        ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- STEP 2: DROP ANY EXISTING POLICIES (idempotent re-run safety)
-- =============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;


-- =============================================================================
-- STEP 3: SENSITIVE / ADMIN-ONLY TABLES — NO POLICIES (deny all direct access)
-- =============================================================================
-- Tables with no policies = RLS blocks everything for anon and authenticated.
-- The service role key used by the server bypasses this completely.
--
-- Covered by silence (no policy needed):
--   sessions, users, members, audit_logs, payment_transactions,
--   enrollments, lesson_progress, quiz_attempts, certificates,
--   flashcard_progress, notifications, member_achievements,
--   conversations, conversation_participants, messages,
--   question_bank, question_bank_options, question_topics,
--   contact_messages, newsletter_subscriptions, waitlist


-- =============================================================================
-- STEP 4: PUBLIC READ — Marketing / static content
-- =============================================================================
-- These tables contain content that is intentionally public-facing.
-- Anon users can SELECT published/active rows. No INSERT/UPDATE/DELETE.

-- Articles (published only)
CREATE POLICY "public_read_articles"
  ON articles FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Team Members (active only)
CREATE POLICY "public_read_team_members"
  ON team_members FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Products (active only)
CREATE POLICY "public_read_products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- FAQ Items (active only)
CREATE POLICY "public_read_faq_items"
  ON faq_items FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Careers (active only)
CREATE POLICY "public_read_careers"
  ON careers FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Departments (active only)
CREATE POLICY "public_read_departments"
  ON departments FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Gallery Items (published only)
CREATE POLICY "public_read_gallery_items"
  ON gallery_items FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Partners (active only)
CREATE POLICY "public_read_partners"
  ON partners FOR SELECT
  TO anon, authenticated
  USING (is_active = true);


-- =============================================================================
-- STEP 5: PUBLIC READ — LMS catalogue (published content only)
-- =============================================================================

-- Course Categories (active only)
CREATE POLICY "public_read_course_categories"
  ON course_categories FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Courses (published only)
CREATE POLICY "public_read_courses"
  ON courses FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Course Modules (published only, via published course)
CREATE POLICY "public_read_course_modules"
  ON course_modules FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_modules.course_id
        AND c.is_published = true
    )
  );

-- Lessons (published only, via published module + course)
CREATE POLICY "public_read_lessons"
  ON lessons FOR SELECT
  TO anon, authenticated
  USING (
    is_published = true
    AND EXISTS (
      SELECT 1 FROM course_modules m
      JOIN courses c ON c.id = m.course_id
      WHERE m.id = lessons.module_id
        AND m.is_published = true
        AND c.is_published = true
    )
  );

-- Lesson Assets (via published lesson)
CREATE POLICY "public_read_lesson_assets"
  ON lesson_assets FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM lessons l
      WHERE l.id = lesson_assets.lesson_id
        AND l.is_published = true
    )
  );

-- Quizzes (published only)
CREATE POLICY "public_read_quizzes"
  ON quizzes FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Quiz Questions (via published quiz)
CREATE POLICY "public_read_quiz_questions"
  ON quiz_questions FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quizzes q
      WHERE q.id = quiz_questions.quiz_id
        AND q.is_published = true
    )
  );

-- Quiz Options (via published quiz)
CREATE POLICY "public_read_quiz_options"
  ON quiz_options FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM quiz_questions qq
      JOIN quizzes q ON q.id = qq.quiz_id
      WHERE qq.id = quiz_options.question_id
        AND q.is_published = true
    )
  );

-- Course Prerequisites (via published courses)
CREATE POLICY "public_read_course_prerequisites"
  ON course_prerequisites FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = course_prerequisites.course_id
        AND c.is_published = true
    )
  );

-- Flashcard Decks (published only)
CREATE POLICY "public_read_flashcard_decks"
  ON flashcard_decks FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Flashcards (via published deck)
CREATE POLICY "public_read_flashcards"
  ON flashcards FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM flashcard_decks fd
      WHERE fd.id = flashcards.deck_id
        AND fd.is_published = true
    )
  );

-- Anatomy Models (published only)
CREATE POLICY "public_read_anatomy_models"
  ON anatomy_models FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Lesson Anatomy Models (via published lesson or module)
CREATE POLICY "public_read_lesson_anatomy_models"
  ON lesson_anatomy_models FOR SELECT
  TO anon, authenticated
  USING (
    (
      lesson_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM lessons l
        WHERE l.id = lesson_anatomy_models.lesson_id
          AND l.is_published = true
      )
    )
    OR
    (
      module_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM course_modules m
        WHERE m.id = lesson_anatomy_models.module_id
          AND m.is_published = true
      )
    )
  );

-- Achievements (active only — public catalogue)
CREATE POLICY "public_read_achievements"
  ON achievements FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Membership Plans (active only — public pricing page)
CREATE POLICY "public_read_membership_plans"
  ON membership_plans FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Plan Pricing (public — needed for pricing page)
CREATE POLICY "public_read_plan_pricing"
  ON plan_pricing FOR SELECT
  TO anon, authenticated
  USING (true);

-- Feature Access (public — needed for feature comparison)
CREATE POLICY "public_read_feature_access"
  ON feature_access FOR SELECT
  TO anon, authenticated
  USING (true);


-- =============================================================================
-- STEP 6: VERIFY — list all tables with RLS status
-- =============================================================================
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_policies p
   WHERE p.schemaname = t.schemaname
     AND p.tablename = t.tablename) AS policy_count
FROM pg_tables t
WHERE schemaname = 'public'
ORDER BY tablename;
