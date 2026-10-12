-- List all courses in the database
SELECT 
  id, 
  title, 
  slug, 
  category,
  price,
  is_published,
  is_featured,
  created_at
FROM courses 
ORDER BY created_at DESC;