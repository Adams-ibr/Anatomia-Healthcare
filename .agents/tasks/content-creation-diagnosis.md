# Content Creation Issue - Diagnosis Report

## Problem Summary
The user cannot add new content or resources to the Anatomia LMS platform. This affects courses, lessons, modules, and other learning materials.

## Root Cause Analysis

### 1. **CRITICAL: Missing Database Tables**

The `saveCourseContent` function in `/Users/user/Anatomia Healthcare/supabase/functions/auth/index.ts` (lines 1522-1644) attempts to INSERT data into several tables that **DO NOT EXIST** in the database schema:

**Missing Tables:**
- `course_sections` - Used to store course sections
- `lessons` - Used to store individual lessons within sections  
- `course_objectives` - Used to store learning objectives
- `course_requirements` - Used to store course prerequisites
- `course_faqs` - Used to store FAQ entries
- `assessments` - Used to store course assessments/quizzes
- `assessment_questions` - Used to store quiz questions

**Evidence:**
The `supabase_schema.sql` file (507 lines) only defines these tables:
- `course_categories`
- `courses`
- `team_members`
- `partners`
- `products`
- `articles`
- `enrollments`
- `orders`
- `certificates`

But the API code tries to insert into missing tables:
```typescript
// Line 1589-1594: Deletes from non-existent tables
await Promise.all([
  supabase.from('course_objectives').delete().eq('course_id', id),
  supabase.from('course_requirements').delete().eq('course_id', id),
  supabase.from('course_faqs').delete().eq('course_id', id),
  supabase.from('assessments').delete().eq('course_id', id),
  supabase.from('course_sections').delete().eq('course_id', id)
])

// Line 1597-1604: Inserts into non-existent tables
await supabase.from('course_sections').insert({...})
await supabase.from('lessons').insert({...})
```

### 2. **Missing RLS Policies**

Even if the tables existed, they would need proper Row Level Security (RLS) policies to allow authenticated users to INSERT data.

Currently only `enrollments` and `orders` have INSERT policies in `supabase_schema.sql`.

### 3. **API Points to localhost:8787**

The `.env` file has:
```
VITE_API_URL=http://localhost:8787
```

This suggests content creation goes through a local backend server, but:
- The server may not be running
- The Edge Function should be deployed to Supabase instead

## Impact

**What's Broken:**
- ✗ Creating/editing courses in Course Studio
- ✗ Adding lessons to courses
- ✗ Saving course sections and curriculum
- ✗ Adding objectives, requirements, FAQs
- ✗ Creating assessments/quizzes
- ✗ Any content that uses the `saveCourseContent` API endpoint

**What Still Works:**
- ✓ Viewing existing courses (if any exist)
- ✓ Authentication and login
- ✓ Browsing the LMS interface
- ✓ User management (separate API)

## Solution: Create Missing Tables

The database schema needs to be extended with the missing tables. Here's what needs to be added:

### Required Tables:

1. **`course_sections`** - Organizes lessons into sections
   - `id` (UUID, primary key)
   - `course_id` (UUID, foreign key to courses)
   - `title` (TEXT)
   - `position` (INTEGER)
   - `created_at`, `updated_at`

2. **`lessons`** - Individual lesson content
   - `id` (UUID, primary key)
   - `section_id` (UUID, foreign key to course_sections)
   - `title` (TEXT)
   - `type` (TEXT: video, text, quiz, etc.)
   - `duration` (INTEGER minutes)
   - `content` (TEXT)
   - `video_url` (TEXT, nullable)
   - `resource_url` (TEXT, nullable)
   - `position` (INTEGER)
   - `created_at`, `updated_at`

3. **`course_objectives`** - Learning objectives
   - `id` (UUID, primary key)
   - `course_id` (UUID, foreign key)
   - `text` (TEXT)
   - `position` (INTEGER)

4. **`course_requirements`** - Prerequisites
   - `id` (UUID, primary key)
   - `course_id` (UUID, foreign key)
   - `text` (TEXT)
   - `position` (INTEGER)

5. **`course_faqs`** - FAQ entries
   - `id` (UUID, primary key)
   - `course_id` (UUID, foreign key)
   - `question` (TEXT)
   - `answer` (TEXT)

6. **`assessments`** - Course assessments/quizzes
   - `id` (UUID, primary key)
   - `course_id` (UUID, foreign key)
   - `title` (TEXT)
   - `description` (TEXT)
   - `time_limit` (INTEGER)
   - `passing_score` (INTEGER)
   - `retake_limit` (INTEGER)

7. **`assessment_questions`** - Quiz questions
   - `id` (UUID, primary key)
   - `assessment_id` (UUID, foreign key)
   - `type` (TEXT: mc, tf, essay, etc.)
   - `question` (TEXT)
   - `options` (JSONB, nullable)
   - `answer` (TEXT, nullable)
   - `explanation` (TEXT)
   - `position` (INTEGER)

### Required RLS Policies:

Each table needs:
- **SELECT policy**: Allow authenticated users to read
- **INSERT policy**: Allow authenticated users to create
- **UPDATE policy**: Allow course owners/instructors to edit
- **DELETE policy**: Allow course owners/instructors to delete

## Recommended Actions

1. **IMMEDIATE**: Create missing database tables with proper schema
2. **IMMEDIATE**: Add RLS policies for all new tables
3. **IMPORTANT**: Test course creation flow end-to-end
4. **OPTIONAL**: Consider deploying Edge Function to Supabase (instead of localhost:8787)

## Next Steps

Would you like me to:
1. Generate the complete SQL migration script to create all missing tables?
2. Create and run the migration automatically?
3. Test the course creation functionality after the fix?
