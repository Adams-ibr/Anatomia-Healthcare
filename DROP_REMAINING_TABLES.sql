-- Drop tables that weren't in the first drop script
DROP TABLE IF EXISTS discussions CASCADE;
DROP TABLE IF EXISTS discussion_replies CASCADE;
DROP TABLE IF EXISTS discussion_votes CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS quiz_attempts CASCADE;
DROP TABLE IF EXISTS quiz_answers CASCADE;
DROP TABLE IF EXISTS student_progress CASCADE;
DROP TABLE IF EXISTS course_reviews CASCADE;
DROP TABLE IF EXISTS instructor_earnings CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS coupon_usage CASCADE;
DROP TABLE IF EXISTS activity_logs CASCADE;
DROP TABLE IF EXISTS email_queue CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- Now check what's left
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

DO $$
BEGIN
  RAISE NOTICE '✅ Additional tables dropped';
  RAISE NOTICE 'Now run schema.sql';
END $$;
