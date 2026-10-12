-- Check if articles exist and list them
SELECT id, title, slug, is_published, created_at 
FROM articles 
ORDER BY created_at DESC 
LIMIT 10;
