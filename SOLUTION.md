# Content Creation Fix - Manual Solution

## The Real Problem

Your error message was:
```
foreign key constraint "course_sections_course_id_fkey" cannot be implemented
Key columns "course_id" and "id" are of incompatible types: uuid and character varying.
```

This means **one of two things**:

1. **Either**: The `courses` table has `id` as `character varying` (text) instead of `uuid`
2. **Or**: The content tables (`course_sections`, `lessons`, etc.) don't exist at all

## Diagnosis Steps (5 minutes)

### Step 1: Run Diagnostic Queries

1. Go to: https://supabase.com/dashboard/project/evfdnyxrkrkcigkkrhyr/sql
2. Open `DIAGNOSTIC_QUERIES.sql` in this folder
3. Copy the ENTIRE file
4. Paste into Supabase SQL Editor
5. Click **Run** (Cmd+Enter)
6. Review the results

### Step 2: Interpret Results

Look at the output from STEP 2 (courses table structure):

**If `id` column shows `data_type = 'uuid'`:**
✅ Good! The courses table is correct.
→ **Solution**: Run `schema.sql` to create missing content tables

**If `id` column shows `data_type = 'character varying'` or `text`:**
❌ Problem! The courses table has wrong ID type.
→ **Solution**: Need to recreate courses table OR migrate data

## Solutions

### Solution A: courses.id is UUID (most likely)

If diagnostic shows courses.id is already UUID type, just run the full schema:

1. Open: https://supabase.com/dashboard/project/evfdnyxrkrkcigkkrhyr/sql
2. Click "New Query"
3. Copy ALL contents of `schema.sql`
4. Paste and Run
5. Wait for completion (may take 30-60 seconds)
6. Done! Test content creation

**Note**: `schema.sql` uses `CREATE TABLE IF NOT EXISTS` so it won't break existing tables.

### Solution B: courses.id is VARCHAR/TEXT (less likely)

If courses table has wrong ID type, you have 2 options:

**Option B1: Start Fresh (if no important data)**
1. Delete all course-related data
2. Drop courses table
3. Run full `schema.sql`

**Option B2: Keep Data (if you have courses)**
1. Create a migration script to convert IDs
2. This is complex - let me know and I'll help

## Test After Fix

After running the SQL:

1. `npm run dev`
2. Login as admin/instructor
3. Go to Course Studio
4. Create a test course:
   - Add title: "Test Course"
   - Add a section: "Section 1"
   - Add a lesson: "Lesson 1" with some content
   - Click "Save Draft"
5. Should save without errors!

## Expected Result

After running `schema.sql`, these tables will exist:
- ✅ profiles
- ✅ categories  
- ✅ courses (with UUID id)
- ✅ course_sections (with UUID course_id referencing courses.id)
- ✅ lessons (with UUID section_id referencing course_sections.id)
- ✅ course_objectives
- ✅ course_requirements
- ✅ course_faqs
- ✅ assessments
- ✅ assessment_questions
- ✅ reviews
- ✅ certificates
- ✅ enrollments

All with proper foreign key relationships and RLS policies.

## Still Not Working?

If content creation still fails after running schema.sql:

1. Check browser console for errors
2. Check Network tab for API response
3. Verify you have admin or instructor role:
   ```sql
   SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';
   ```
4. Check if Supabase Edge Function is deployed
5. Verify `.env` has correct Supabase URL and keys

## Files

- `DIAGNOSTIC_QUERIES.sql` - Run this FIRST to diagnose
- `schema.sql` - Complete database schema (run this to fix)
- `supabase_schema.sql` - Incomplete schema (don't use this)
- `fix_content_tables.sql` - My failed attempt (ignore this)

## Why This Happened

You have two schema files:
1. `schema.sql` - Complete, correct schema with all tables
2. `supabase_schema.sql` - Incomplete schema (missing content tables)

It looks like `supabase_schema.sql` was partially applied to your database, but the complete `schema.sql` was never run. Running the full `schema.sql` will fix everything.

---

**Let me know the results from DIAGNOSTIC_QUERIES.sql** and I can give you the exact next steps!
