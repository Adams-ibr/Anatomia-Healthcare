-- Add sample courses for testing
-- Make sure you have categories first

-- Insert sample courses (adjust instructor_id and category as needed)
INSERT INTO courses (
  title,
  slug,
  short_description,
  description,
  category,
  price,
  is_published,
  level,
  language,
  has_certificate,
  rating,
  student_count,
  review_count
) VALUES
(
  'Introduction to Human Anatomy',
  'intro-human-anatomy',
  'Learn the fundamental structures and systems of the human body',
  'This comprehensive course covers all major body systems including skeletal, muscular, cardiovascular, and nervous systems. Perfect for medical students and healthcare professionals.',
  (SELECT slug FROM course_categories WHERE name = 'Anatomy' LIMIT 1),
  49.99,
  true,
  'Beginner',
  'English',
  true,
  4.8,
  1250,
  156
),
(
  'Advanced Cardiovascular System',
  'advanced-cardiovascular',
  'Deep dive into heart anatomy and circulatory system',
  'Explore the intricacies of the cardiovascular system with detailed 3D models and interactive diagrams. Learn about heart chambers, blood vessels, and cardiac function.',
  (SELECT slug FROM course_categories WHERE name = 'Anatomy' LIMIT 1),
  79.99,
  true,
  'Advanced',
  'English',
  true,
  4.9,
  850,
  98
),
(
  'Musculoskeletal System Basics',
  'musculoskeletal-basics',
  'Understanding bones, joints, and muscles',
  'Master the fundamentals of the musculoskeletal system. Study bone structure, joint mechanics, and muscle anatomy with practical applications.',
  (SELECT slug FROM course_categories WHERE name = 'Anatomy' LIMIT 1),
  59.99,
  true,
  'Intermediate',
  'English',
  true,
  4.7,
  920,
  112
),
(
  'Clinical Skills for Healthcare Professionals',
  'clinical-skills-professionals',
  'Essential practical skills for medical practice',
  'Develop crucial clinical skills including patient examination, vital signs monitoring, and basic procedures. Designed for nursing and medical students.',
  (SELECT slug FROM course_categories WHERE name = 'Clinical Skills' LIMIT 1),
  89.99,
  true,
  'Intermediate',
  'English',
  true,
  4.8,
  1100,
  145
)
ON CONFLICT (slug) DO NOTHING;

-- Verify the insertion
SELECT id, title, slug, price, is_published, student_count FROM courses ORDER BY created_at DESC LIMIT 5;
