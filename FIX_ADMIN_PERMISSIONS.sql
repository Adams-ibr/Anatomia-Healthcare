-- ============================================================================
-- FIX ADMIN PERMISSIONS & RLS POLICIES FOR COURSES AND PLATFORM SETTINGS
-- ============================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================================

-- 1. COURSES TABLE PERMISSIONS & POLICIES
-- Allow authenticated admins to view, insert, update, and delete courses
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public courses read" ON public.courses;
CREATE POLICY "Public courses read" ON public.courses
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin full access on courses" ON public.courses;
CREATE POLICY "Admin full access on courses" ON public.courses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. PLATFORM SETTINGS PERMISSIONS & POLICIES
-- Allow reading and writing platform_settings
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO anon;

DROP POLICY IF EXISTS "Platform settings read" ON public.platform_settings;
CREATE POLICY "Platform settings read" ON public.platform_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Platform settings write" ON public.platform_settings;
CREATE POLICY "Platform settings write" ON public.platform_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. TEAM MEMBERS PERMISSIONS & POLICIES
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "team_members_public_read" ON public.team_members;
CREATE POLICY "team_members_public_read" ON public.team_members
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "team_members_admin_all" ON public.team_members;
CREATE POLICY "team_members_admin_all" ON public.team_members
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

DO $$
BEGIN
  RAISE NOTICE '✅ Permissions and RLS policies updated successfully for courses, platform_settings, and team_members!';
END $$;
