-- Add sample courses for testing
-- Insert sample courses (adjust instructor_id and category as needed)
INSERT INTO courses (
  title,
  slug,
  short_description,
  description,
  category,
  level,
  duration,
  price,
  is_free,
  is_published,
  is_featured
) VALUES
(
  'Introduction to Human Anatomy',
  'intro-human-anatomy',
  'Learn the fundamental structures and systems of the human body',
  'This comprehensive course covers all major body systems including skeletal, muscular, cardiovascular, and nervous systems. Perfect for medical students and healthcare professionals.',
  'anatomy',
  'Beginner',
  '20 hours',
  4999,
  false,
  true,
  true
),
(
  'Advanced Cardiovascular System',
  'advanced-cardiovascular',
  'Deep dive into heart anatomy and circulatory system',
  'Explore the intricacies of the cardiovascular system with detailed 3D models and interactive diagrams. Learn about heart chambers, blood vessels, and cardiac function.',
  'anatomy',
  'Advanced',
  '15 hours',
  7999,
  false,
  true,
  false
),
(
  'Musculoskeletal System Basics',
  'musculoskeletal-basics',
  'Understanding bones, joints, and muscles',
  'Master the fundamentals of the musculoskeletal system. Study bone structure, joint mechanics, and muscle anatomy with practical applications.',
  'anatomy',
  'Intermediate',
  '18 hours',
  5999,
  false,
  true,
  false
),
(
  'Clinical Skills for Healthcare Professionals',
  'clinical-skills-professionals',
  'Essential practical skills for medical practice',
  'Develop crucial clinical skills including patient examination, vital signs monitoring, and basic procedures. Designed for nursing and medical students.',
  'clinical-skills',
  'Intermediate',
  '25 hours',
  8999,
  false,
  true,
  true
),
(
  'Human Physiology Fundamentals',
  'human-physiology',
  'How the human body systems function',
  'Comprehensive study of physiological processes in the human body. Learn how organs and systems work together to maintain homeostasis.',
  'physiology',
  'Beginner',
  '22 hours',
  5499,
  false,
  true,
  false
)
ON CONFLICT (slug) DO NOTHING;

-- Verify the insertion
SELECT id, title, slug, price, is_published FROM courses WHERE is_published = true ORDER BY created_at DESC LIMIT 10;
