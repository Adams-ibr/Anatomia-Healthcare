-- ============================================================================
-- DROP ALL TABLES AND START FRESH
-- ============================================================================
-- ⚠️  WARNING: This deletes ALL data in your database!
-- Only run this if you're sure you want to start fresh.

-- Drop all tables in correct order (children before parents)
DROP TABLE IF EXISTS assessment_questions CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS course_faqs CASCADE;
DROP TABLE IF EXISTS course_requirements CASCADE;
DROP TABLE IF EXISTS course_objectives CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS course_sections CASCADE;
DROP TABLE IF EXISTS course_modules CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS certificates CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS course_categories CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS partners CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS contact_messages CASCADE;
DROP TABLE IF EXISTS faq_items CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS gallery_items CASCADE;
DROP TABLE IF EXISTS careers CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS newsletter_subscriptions CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS flashcard_decks CASCADE;
DROP TABLE IF EXISTS flashcards CASCADE;
DROP TABLE IF EXISTS question_bank CASCADE;
DROP TABLE IF EXISTS anatomy_models CASCADE;
DROP TABLE IF EXISTS lesson_anatomy_models CASCADE;
DROP TABLE IF EXISTS learning_paths CASCADE;
DROP TABLE IF EXISTS learning_path_courses CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS wishlists CASCADE;
DROP TABLE IF EXISTS reviews_votes CASCADE;

-- Drop all custom types
DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS course_status CASCADE;
DROP TYPE IF EXISTS course_level CASCADE;
DROP TYPE IF EXISTS lesson_type CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;
DROP TYPE IF EXISTS assignment_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS question_type CASCADE;

-- Verify everything is dropped
SELECT 
  'All tables dropped! Ready to run schema.sql' as status,
  COUNT(*) as remaining_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '✅ ALL TABLES DROPPED SUCCESSFULLY!';
  RAISE NOTICE '✅ ============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'NEXT STEP: Run schema.sql to recreate everything';
  RAISE NOTICE '1. Open schema.sql';
  RAISE NOTICE '2. Copy ALL contents (entire file)';
  RAISE NOTICE '3. Paste into SQL Editor';
  RAISE NOTICE '4. Click Run';
  RAISE NOTICE '';
END $$;
