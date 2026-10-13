-- ============================================================================
-- FIX TEAM_MEMBERS RLS POLICIES
-- ============================================================================
-- This adds proper RLS policies to allow admins to manage team members
-- Run in Supabase SQL Editor
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Allow public to read active team members (for public website)
DROP POLICY IF EXISTS "team_members_public_read" ON team_members;
CREATE POLICY "team_members_public_read" ON team_members
  FOR SELECT
  USING (is_active = true);

-- Allow authenticated users (admins) to do everything
-- Note: You may want to make this more restrictive to only admin role
DROP POLICY IF EXISTS "team_members_admin_all" ON team_members;
CREATE POLICY "team_members_admin_all" ON team_members
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Verification
DO $$
BEGIN
  RAISE NOTICE '=============================================';
  RAISE NOTICE 'Team Members RLS Policies Updated';
  RAISE NOTICE '=============================================';
  RAISE NOTICE 'Policies created:';
  RAISE NOTICE '  ✓ team_members_public_read (SELECT for active members)';
  RAISE NOTICE '  ✓ team_members_admin_all (ALL for authenticated users)';
  RAISE NOTICE '=============================================';
END $$;
