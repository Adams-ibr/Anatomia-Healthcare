-- Check what columns team_members actually has
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'team_members'
ORDER BY ordinal_position;
