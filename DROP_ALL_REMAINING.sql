-- Drop ALL remaining tables
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS course_prerequisites CASCADE;
DROP TABLE IF EXISTS feature_access CASCADE;
DROP TABLE IF EXISTS flashcard_progress CASCADE;
DROP TABLE IF EXISTS lesson_assets CASCADE;
DROP TABLE IF EXISTS lesson_progress CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS member_achievements CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TABLE IF EXISTS membership_plans CASCADE;
DROP TABLE IF EXISTS plan_pricing CASCADE;
DROP TABLE IF EXISTS question_bank_options CASCADE;
DROP TABLE IF EXISTS question_topics CASCADE;
DROP TABLE IF EXISTS quiz_options CASCADE;
DROP TABLE IF EXISTS quiz_questions CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;

-- Verify everything is gone
SELECT COUNT(*) as remaining_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

DO $$
BEGIN
  RAISE NOTICE '✅ ALL APPLICATION TABLES DROPPED!';
  RAISE NOTICE 'Now run schema.sql to recreate everything fresh';
END $$;
