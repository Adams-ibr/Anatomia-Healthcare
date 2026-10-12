# Migration Summary & Issues

## ✅ Completed Tasks

### 1. Replaced "HamaAcademy" with "Anatomia"
All occurrences of "HamaAcademy" have been replaced with "Anatomia" throughout the codebase:

**Files Updated:**
- ✅ `src/pages/Admin2.tsx` - CSV export filenames
- ✅ `src/pages/CourseStudio.tsx` - SVG placeholder text
- ✅ `src/pages/AdminInstructors.tsx` - Email placeholder
- ✅ `src/pages/Login.tsx` - Demo account emails
- ✅ `src/lib/i18n/resources/en.ts` - All English translations
- ✅ `src/lib/i18n/resources/pcm.ts` - All Pidgin translations
- ✅ `src/layouts/PortalLayout.tsx` - Navigation references
- ✅ `supabase/functions/auth/index.ts` - Email templates, SMTP config, URLs
- ✅ `supabase/functions/auth/README.md` - Documentation
- ✅ `server/src/index.ts` - Console logs

**Changes Made:**
- CSV exports now use `anatomia-` prefix instead of `hamaacademy-`
- Demo emails changed from `@hamaacademy.com` to `@anatomia.co`
- Email placeholders updated to `@anatomia.co`
- SMTP default sender changed to `info@anatomia.co`
- SMTP EHLO command uses `anatomia.co`
- Email templates show "Anatomia" instead of "HamaAcademy"
- Frontend URL defaults to `https://www.anatomia.co`
- All translation strings updated

### 2. Fixed Sidebar "community" Error
- Changed nav item label from `'community'` to `'nav.community'` to resolve translation key conflict
- Deployed successfully to production

### 3. Migrated Admin Pages to Supabase
- ✅ AdminCourses.tsx
- ✅ AdminCategories.tsx
- ✅ AdminInstructors.tsx
- ✅ AdminPartners.tsx

## ⚠️ Current Issues

### 1. Vercel Deployment Authorization
**Error:** `Not authorized` when running `vercel --prod`

**Solution:**
```bash
# Re-authenticate with Vercel
vercel login

# Then deploy again
vercel --prod --yes
```

### 2. Supabase Categories Table Missing (404 Error)
**Error:** `Failed to load resource: the server responded with a status of 404 ()`
**URL:** `evfdnyxrkrkcigkkrhyr.supabase.co/rest/v1/course_categories?select=*`

**Cause:** The `course_categories` table doesn't exist in your Supabase database.

**Solution:** You need to create the table in Supabase. Here's the SQL schema:

```sql
-- Create course_categories table
CREATE TABLE IF NOT EXISTS course_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#1B4E9B',
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  course_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_course_categories_slug ON course_categories(slug);
CREATE INDEX IF NOT EXISTS idx_course_categories_order ON course_categories("order");

-- Enable Row Level Security (RLS)
ALTER TABLE course_categories ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access" ON course_categories
  FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated users full access" ON course_categories
  FOR ALL USING (auth.role() = 'authenticated');
```

**Steps to Fix:**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/evfdnyxrkrkcigkkrhyr
2. Click on "SQL Editor" in the left sidebar
3. Paste the SQL schema above
4. Click "Run" to execute
5. Refresh your admin categories page

### 3. Other Missing Tables

Based on the code, you may also need these tables:
- `courses` - for courses management
- `team_members` - for instructors
- `partners` - for partners
- `products` - for products
- `articles` - for articles/blog

Check which ones exist in your Supabase dashboard.

## 📋 Next Steps

1. **Re-authenticate with Vercel** and deploy
   ```bash
   vercel login
   vercel --prod --yes
   ```

2. **Create missing Supabase tables** using the SQL schema above

3. **Verify admin pages load correctly** after tables are created:
   - Admin Categories: https://www.anatomia.co/admin/categories
   - Admin Courses: https://www.anatomia.co/admin/courses
   - Admin Instructors: https://www.anatomia.co/admin/instructors

4. **Update Supabase Edge Function secrets** (if using email features):
   ```bash
   supabase secrets set FRONTEND_URL=https://www.anatomia.co
   supabase secrets set SMTP_USER=info@anatomia.co
   ```

## 🎉 What's Working

- ✅ Build compiles successfully
- ✅ All "HamaAcademy" references replaced with "Anatomia"
- ✅ Sidebar navigation error fixed
- ✅ Admin pages connected to Supabase (when tables exist)
- ✅ User creation working
- ✅ Authentication working

## 📝 Build Status

```
✓ 2921 modules transformed
✓ built in 15.64s
dist/index.html                     0.85 kB │ gzip:   0.47 kB
dist/assets/index-Bn6yz9_E.css     48.05 kB │ gzip:   8.39 kB
dist/assets/index-CEqIhBKV.js   1,743.71 kB │ gzip: 442.73 kB
```

Everything is ready to deploy once you re-authenticate with Vercel!
