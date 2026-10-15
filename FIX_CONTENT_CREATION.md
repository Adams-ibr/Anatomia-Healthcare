# Fix Content Creation - Quick Setup Guide

## Problem
You cannot add new content (courses, lessons, modules) to your Anatomia LMS because critical database tables are missing.

## Root Cause
The API code expects these tables to exist, but they're not in your database:
- `course_sections`
- `lessons`
- `course_objectives`
- `course_requirements`
- `course_faqs`
- `assessments`
- `assessment_questions`

## Solution (5 minutes)

### Step 1: Run the Migration SQL

1. Open your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project: `evfdnyxrkrkcigkkrhyr`
3. Go to **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the entire contents of `fix_content_tables.sql`
6. Paste into the SQL Editor
7. Click **Run** (or press Cmd+Enter)

You should see success messages confirming all 7 tables were created.

### Step 2: Verify the Fix

After running the migration, test content creation:

1. Start your development server: `npm run dev`
2. Login to your LMS as an admin or instructor
3. Go to **Course Studio** or **Admin → Courses**
4. Try creating a new course with:
   - Course title and description
   - Add a section
   - Add a lesson to that section
   - Add learning objectives
5. Click **Save Draft** or **Publish**

It should now save successfully without errors!

### Step 3: Check Your Browser Console

Open browser DevTools (F12) → Console tab:
- **Before fix**: You'll see 404 errors about missing tables
- **After fix**: No errors, API calls return 200 OK

## What Was Fixed

### Tables Created:
✓ `course_sections` - Organizes lessons into course sections  
✓ `lessons` - Individual lesson content (video, text, quiz, etc.)  
✓ `course_objectives` - Learning objectives for each course  
✓ `course_requirements` - Prerequisites needed  
✓ `course_faqs` - Frequently asked questions  
✓ `assessments` - Course quizzes and tests  
✓ `assessment_questions` - Quiz questions  

### Security:
✓ Row Level Security (RLS) enabled on all tables  
✓ Public can view published content  
✓ Authenticated users can create/edit content  
✓ Proper foreign key cascading deletes  

### Features Now Working:
✓ Create and edit courses in Course Studio  
✓ Add sections and lessons  
✓ Add learning objectives and requirements  
✓ Create course FAQs  
✓ Build assessments and quizzes  
✓ Save and publish courses  

## Troubleshooting

### If you still get errors after running the SQL:

**Error: "relation 'courses' does not exist"**
→ Your courses table itself might be missing. Check if you need to run the main schema first.

**Error: "permission denied"**
→ Make sure you're running the SQL as the project owner/admin in Supabase Dashboard.

**Error: "foreign key constraint"**
→ The `courses` table might not have required columns. Run `add_missing_columns.sql` first.

### Still having issues?

1. Check if the tables exist:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%course%' OR table_name LIKE '%lesson%' OR table_name LIKE '%assessment%';
```

2. Check your user's role:
```sql
SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';
```

You should have role = 'admin' or 'instructor' to create content.

## Files Reference

- `fix_content_tables.sql` - Main migration script (RUN THIS)
- `.agents/tasks/content-creation-diagnosis.md` - Detailed technical analysis
- `add_missing_columns.sql` - If courses table needs updates (run first if needed)
- `supabase_schema.sql` - Your current database schema

## Need More Help?

If content creation still doesn't work after running the migration:
1. Check the browser console for specific error messages
2. Check the Network tab to see which API calls are failing
3. Verify the Supabase Edge Function is properly deployed
4. Confirm your `.env` file has correct Supabase credentials

The diagnosis report at `.agents/tasks/content-creation-diagnosis.md` has more technical details.
