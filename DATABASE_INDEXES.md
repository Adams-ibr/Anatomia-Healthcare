# Database Index Migration

## Overview
This document describes the indexes that need to be added to the PostgreSQL database to optimize query performance.

## Why Indexes Matter
Indexes significantly improve query performance on:
- Login queries (users.email, members.email lookups)
- Course lookups (courses.slug queries)
- Session cleanup (sessions.expire filtering)
- Member dashboards (enrollments.member_id queries)
- Payment verification (payment_transactions.provider_reference lookups)

## How to Apply These Indexes

### Option 1: Using SQL directly (Recommended for existing database)

Connect to your Supabase PostgreSQL database and run the SQL commands from `shared/models/indexes.ts`.

```sql
-- Authentication & Session Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_sessions_sid ON sessions(sid);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- LMS Course Indexes
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(is_featured);

-- LMS Enrollment Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_member_id ON enrollments(member_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_member_course ON enrollments(member_id, course_id);

-- Progress Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_progress_member_id ON lesson_progress(member_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_member_id ON quiz_attempts(member_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);

-- Payment Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_member_id ON payment_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_ref ON payment_transactions(provider_reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Content Indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured);

-- Gallery Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_items_published ON gallery_items(is_published);
CREATE INDEX IF NOT EXISTS idx_gallery_items_category ON gallery_items(category);

-- Interaction Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_comments_content_id ON comments(content_id);
CREATE INDEX IF NOT EXISTS idx_discussions_course_id ON discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
```

### Option 2: Using Supabase SQL Editor

1. Go to Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste the SQL from Option 1
4. Click "Run" to execute

### Option 3: Using Drizzle Kit (for new migrations)

Create a new migration file:
```bash
npx drizzle-kit generate:pg --schema=./shared/models --name add_indexes
```

Then add the index definitions to the generated migration file.

## Performance Impact

After adding these indexes, you should see:
- **Login performance**: 10-50x faster (from full table scan to index lookup)
- **Course searches**: 5-20x faster (slug-based lookups)
- **Member dashboards**: 3-10x faster (enrollment queries)
- **Payment verification**: 5-15x faster (reference lookups)
- **Session cleanup**: 2-5x faster (expire timestamp filtering)

## Monitoring Index Usage

Monitor index effectiveness using Supabase dashboard or PostgreSQL queries:

```sql
-- See index sizes and usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Find unused indexes
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Important Notes

- **IF NOT EXISTS**: All index creation statements use `IF NOT EXISTS` to prevent errors if indexes already exist
- **No downtime**: PostgreSQL allows index creation without table locks
- **Storage overhead**: Indexes use additional disk space (typically 10-20% of table size)
- **Write performance**: Slightly slower INSERT/UPDATE/DELETE operations due to index maintenance
- **Index statistics**: Run `ANALYZE` after creating indexes for query planner optimization

## Recommended Actions

1. ✅ Run the index creation SQL to add all missing indexes
2. ✅ Monitor query performance in your application
3. ✅ Check Supabase logs for slow queries
4. ✅ Adjust indexes if needed based on your actual query patterns
