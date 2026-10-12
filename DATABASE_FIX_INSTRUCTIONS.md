# Database Schema Fix Instructions

## Problem Summary
The admin pages are failing because:
1. The `course_categories` table doesn't exist (causing 404 errors)
2. The `courses` table is missing columns that the app expects: `instructor_id`, `thumbnail_url`, `has_certificate`, `is_published`

## Solution

### Step 1: Fix the Courses Table (CRITICAL - Do This First)
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `evfdnyxrkrkcigkkrhyr`
3. Click "SQL Editor" in the left sidebar
4. Open the file `add_missing_columns.sql` from this project
5. Copy all the SQL and paste it into the SQL Editor
6. Click "Run" to execute

**What this does:**
- Adds `instructor_id` column (fixes the "column does not exist" error)
- Adds `thumbnail_url`, `has_certificate`, `is_published` columns
- Sets up proper RLS (Row Level Security) policies
- Does NOT recreate the table - safely adds columns to existing structure

### Step 2: Create Missing Tables
1. In the same SQL Editor
2. Open the file `supabase_schema.sql` from this project
3. Copy all the SQL and paste it into the SQL Editor
4. Click "Run" to execute

**What this does:**
- Creates the `course_categories` table (fixes 404 on admin categories page)
- Creates `team_members`, `partners`, and other missing tables
- Sets up RLS policies for all tables

### Step 3: Verify the Changes
After running both SQL scripts, check:

1. **Admin Courses Page**: Should load without "instructor_id does not exist" error
2. **Admin Categories Page**: Should load without 404 errors
3. **Admin Instructors Page**: Should show team members
4. **Admin Partners Page**: Should show partners

### Step 4: Check Your Current Courses Table Structure
If you want to see what columns already exist in your courses table, run this query in SQL Editor:

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'courses'
ORDER BY column_name;
```

This will show you all existing columns and help identify any other mismatches.

## Common Issues

### If you get "policy already exists" errors:
The script handles this automatically with `DROP POLICY IF EXISTS`, but if you still see errors, you can manually drop policies first:

```sql
DROP POLICY IF EXISTS "Published courses are viewable by everyone" ON courses;
DROP POLICY IF EXISTS "Authenticated users can insert courses" ON courses;
DROP POLICY IF EXISTS "Course creators and instructors can update" ON courses;
DROP POLICY IF EXISTS "Course creators and instructors can delete" ON courses;
```

### If you get "column already exists" errors:
The script checks for existence before adding columns, so this shouldn't happen. But if it does, it means the column is already there and you can skip that part.

### If the courses table has different column names:
Run the query in Step 4 above and share the output. We may need to map different column names (like `teacher_id` instead of `instructor_id`).

## Next Steps After Database Fix
Once the database is fixed:

1. Test the admin pages at https://www.anatomia.co/admin2
2. Verify you can:
   - View all courses
   - Create a new course
   - View all categories
   - View all instructors
   - View all partners

## Files Created
- `add_missing_columns.sql` - Adds missing columns to existing courses table (CRITICAL)
- `supabase_schema.sql` - Creates all missing tables
- `DATABASE_FIX_INSTRUCTIONS.md` - This guide
