# The REAL Problem - Schema Mismatch

## Root Cause

Your application has **TWO DIFFERENT data models** fighting each other:

### Model A: Used by Frontend & Database (Current)
- Table: `course_modules`
- Lessons reference: `module_id` → `course_modules.id`
- Used in: Frontend UI, Supabase client API calls

### Model B: Used by Edge Function API
- Table: `course_sections`
- Lessons reference: `section_id` → `course_sections.id`
- Used in: `supabase/functions/auth/index.ts` (saveCourseContent function)

**When you save course content**, the Edge Function tries to INSERT into `course_sections` table, which doesn't exist! It expects `section_id` but your database has `module_id`.

## The Fix

You have 2 options:

### Option 1: Rename Database Tables (Easiest - 2 minutes)

Rename your database tables to match what the Edge Function expects:

```sql
-- Rename table
ALTER TABLE course_modules RENAME TO course_sections;

-- Rename column in lessons
ALTER TABLE lessons RENAME COLUMN module_id TO section_id;

-- Update foreign key name (optional, for clarity)
ALTER TABLE lessons 
  DROP CONSTRAINT IF EXISTS lessons_module_id_fkey;
  
ALTER TABLE lessons 
  ADD CONSTRAINT lessons_section_id_fkey 
  FOREIGN KEY (section_id) 
  REFERENCES course_sections(id) 
  ON DELETE CASCADE;
```

**Then update frontend code** to use `course_sections` instead of `course_modules`:
- `src/lib/supabase.ts` - change all `course_modules` to `course_sections`
- `src/pages/AdminModules.tsx` - change `module_id` to `section_id`
- `src/pages/AdminLessons.tsx` - change `module_id` to `section_id`
- `src/pages/Courses.tsx` - change `course_modules` to `course_sections`
- `src/pages/CourseDetails.tsx` - change `course_modules` to `course_sections`

### Option 2: Fix Edge Function (More Changes)

Update the Edge Function to use `course_modules` instead of `course_sections`:

Edit `supabase/functions/auth/index.ts` line ~1589-1615:
- Change `course_sections` to `course_modules`
- Change `section_id` to `module_id`

## Recommendation

**Go with Option 1** - Rename the database tables.

Why?
1. Faster (just 2 SQL commands)
2. The Edge Function code uses industry-standard naming ("sections" is more common than "modules")
3. Your `schema.sql` file already uses `course_sections` (the correct model)
4. Less code to change overall

## Implementation Steps

### Step 1: Rename Database (Run in Supabase SQL Editor)

```sql
-- Rename course_modules to course_sections
ALTER TABLE course_modules RENAME TO course_sections;

-- Rename module_id to section_id in lessons
ALTER TABLE lessons RENAME COLUMN module_id TO section_id;

-- Verify
SELECT table_name, column_name 
FROM information_schema.columns 
WHERE table_name IN ('course_sections', 'lessons')
  AND column_name IN ('id', 'section_id', 'course_id');
```

### Step 2: Update Frontend Code

Run this search-and-replace:
1. In `src/lib/supabase.ts`:
   - Replace `course_modules` → `course_sections`
   - Replace `module_id` → `section_id` (in lessonsApi)

2. In `src/pages/AdminModules.tsx`:
   - Replace `module_id` → `section_id`

3. In `src/pages/AdminLessons.tsx`:
   - Replace `module_id` → `section_id`

4. In `src/pages/Courses.tsx`:
   - Replace `course_modules` → `course_sections`

5. In `src/pages/CourseDetails.tsx`:
   - Replace `course_modules` → `course_sections`

6. In `src/lib/database.types.ts`:
   - Replace `course_modules` → `course_sections`
   - Replace `module_id` → `section_id`

### Step 3: Test

1. `npm run dev`
2. Login as admin
3. Go to Admin → Modules (might need to rename to "Sections" in UI)
4. Create/edit a module (section)
5. Go to Course Studio
6. Create a course with sections and lessons
7. Save → Should work!

## Why This Happened

Your project has two schema files:
- `schema.sql` - Uses `course_sections` (correct)
- Your actual database - Uses `course_modules` (old/wrong)

Someone started with `course_modules` but the Edge Function was written expecting `course_sections` from the official schema. The two never got synchronized.

## After the Fix

Everything will use consistent naming:
- ✅ Database: `course_sections` table
- ✅ Edge Function: expects `course_sections`
- ✅ Frontend: queries `course_sections`
- ✅ Content creation: WORKS!

---

Let me know if you want me to make these changes for you!
