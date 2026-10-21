-- ============================================================================
-- OPTIONAL MIGRATION: ADD EXTENDED COLUMNS TO team_members
-- ============================================================================
-- If you would like the team_members table to support explicit description,
-- slug, headline, and skills columns, run this script in your Supabase SQL Editor.
-- ============================================================================

ALTER TABLE team_members ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS headline TEXT;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';

-- Optional: reload schema cache in PostgREST
NOTIFY pgrst, 'reload schema';
