-- Enable RLS and add policy for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "team_members_all_access" ON team_members;
CREATE POLICY "team_members_all_access" ON team_members FOR ALL USING (true);
