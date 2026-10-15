# Complete Database Fix - Root Cause Found

## The Root Problem

Your `courses` table has **`id` as VARCHAR/TEXT** instead of **UUID**.

This breaks EVERYTHING because:
- ❌ Foreign keys can't reference VARCHAR id from UUID columns
- ❌ The Edge Function API expects UUID
- ❌ All related tables fail to create
- ❌ Content creation completely broken

## The Solution: Start Fresh

Since your database is in an inconsistent state with mixed schemas, the cleanest solution is:

### Option 1: Drop Everything and Recreate (RECOMMENDED)

**⚠️ WARNING: This deletes ALL data in your database!**

Only do this if you have NO production data, or can afford to lose it.

```sql
-- 1. Drop all existing tables
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
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
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

-- 2. Drop types
DROP TYPE IF EXISTS app_role CASCADE;
DROP TYPE IF EXISTS course_status CASCADE;
DROP TYPE IF EXISTS course_level CASCADE;
DROP TYPE IF EXISTS lesson_type CASCADE;
DROP TYPE IF EXISTS enrollment_status CASCADE;
DROP TYPE IF EXISTS assignment_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS question_type CASCADE;

-- 3. Now run the complete schema.sql file
-- This creates everything fresh with correct UUID types
```

Then run `schema.sql` to recreate everything properly.

### Option 2: Keep Existing Data (COMPLEX)

If you have courses/data you MUST keep:

1. Export existing data
2. Drop and recreate tables with UUID
3. Re-import with new UUID IDs
4. Update all foreign key references

**This is complex and error-prone. Only do this if you have critical data.**

## Recommended Steps

### Step 1: Backup (if you have data to keep)

```sql
-- Export courses to check if you have any
SELECT * FROM courses;
```

If empty or test data, proceed to drop everything.

### Step 2: Run the Drop Script

Copy the DROP commands above into Supabase SQL Editor and run them.

### Step 3: Run schema.sql

After dropping everything, run the complete `schema.sql` file to recreate the database correctly.

### Step 4: Create Your Admin User

```sql
INSERT INTO profiles (name, email, role, password_hash, email_confirmed, is_active)
VALUES (
  'Your Name',
  'your-email@example.com',
  'admin',
  crypt('YourPassword123', gen_salt('bf')),
  true,
  true
);
```

### Step 5: Test Content Creation

Everything should now work!

## Why This Happened

You likely ran different schema migrations at different times:
1. An old schema that used VARCHAR IDs
2. Then tried to add new tables expecting UUID IDs
3. Result: Incompatible types throughout

The only clean fix is to recreate everything with consistent UUID types.

---

**Do you have any production data in your database that you need to keep?**

If NO → Drop everything and recreate (5 minutes)
If YES → We need to plan a data migration (30+ minutes)
