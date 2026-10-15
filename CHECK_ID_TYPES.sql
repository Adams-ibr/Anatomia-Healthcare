-- Check the ID types of all main tables
SELECT 
  table_name,
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'uuid' THEN '✅ UUID (correct)'
    WHEN data_type IN ('character varying', 'text') THEN '❌ TEXT (wrong!)'
    ELSE data_type
  END as status
FROM information_schema.columns
WHERE table_name IN ('courses', 'course_sections', 'lessons', 'articles', 'partners', 'products', 'team_members')
  AND column_name = 'id'
ORDER BY table_name;
