
-- Enable pgcrypto for UUID generation if needed (built-in in PG 13+)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  role VARCHAR NOT NULL DEFAULT 'content_admin',
  profile_image_url VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Members Table
CREATE TABLE IF NOT EXISTS members (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR NOT NULL UNIQUE,
  password VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  membership_tier VARCHAR NOT NULL DEFAULT 'bronze',
  membership_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions(expire);

-- Course Categories
CREATE TABLE IF NOT EXISTS course_categories (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_name TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Newsletter Subscriptions
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Articles
CREATE TABLE IF NOT EXISTS articles (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  author TEXT NOT NULL,
  image_url TEXT,
  read_time TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Team Members
CREATE TABLE IF NOT EXISTS team_members (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  description TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  email TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  image_url TEXT,
  badge TEXT,
  badge_color TEXT,
  is_active BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- FAQ Items
CREATE TABLE IF NOT EXISTS faq_items (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Careers
CREATE TABLE IF NOT EXISTS careers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT NOT NULL,
  location TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  head_id VARCHAR,
  image_url TEXT,
  color TEXT,
  "order" INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Anatomy Models
CREATE TABLE IF NOT EXISTS anatomy_models (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  body_system TEXT,
  model_url TEXT NOT NULL,
  thumbnail_url TEXT,
  tags TEXT[],
  annotations JSONB,
  is_published BOOLEAN DEFAULT true,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_description TEXT,
  thumbnail_url TEXT,
  category TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'beginner',
  duration TEXT,
  price INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  required_membership_tier TEXT NOT NULL DEFAULT 'bronze',
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Course Modules
CREATE TABLE IF NOT EXISTS course_modules (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lessons
CREATE TABLE IF NOT EXISTS lessons (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id VARCHAR NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  content_type TEXT NOT NULL DEFAULT 'text',
  video_url TEXT,
  duration INTEGER,
  "order" INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Lesson Assets
CREATE TABLE IF NOT EXISTS lesson_assets (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id VARCHAR NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id VARCHAR NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  progress INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE UNIQUE INDEX IF NOT EXISTS "enrollments_member_course_idx" ON enrollments(member_id, course_id);

-- Lesson Progress
CREATE TABLE IF NOT EXISTS lesson_progress (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id VARCHAR NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  lesson_id VARCHAR NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  progress_percent INTEGER DEFAULT 0,
  time_spent_seconds INTEGER DEFAULT 0,
  resume_position_seconds INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "lesson_progress_member_lesson_idx" ON lesson_progress(member_id, lesson_id);

-- Quizzes
CREATE TABLE IF NOT EXISTS quizzes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  lesson_id VARCHAR REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit INTEGER,
  passing_score INTEGER DEFAULT 70,
  max_attempts INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz Questions
CREATE TABLE IF NOT EXISTS quiz_questions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id VARCHAR NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  explanation TEXT,
  points INTEGER DEFAULT 1,
  "order" INTEGER DEFAULT 0
);

-- Quiz Options
CREATE TABLE IF NOT EXISTS quiz_options (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id VARCHAR NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  "order" INTEGER DEFAULT 0
);

-- Quiz Attempts
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id VARCHAR NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  quiz_id VARCHAR NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  is_passed BOOLEAN DEFAULT false,
  answers JSONB,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Certificates
CREATE TABLE IF NOT EXISTS certificates (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id VARCHAR NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_number TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Course Prerequisites
CREATE TABLE IF NOT EXISTS course_prerequisites (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  prerequisite_id VARCHAR NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "course_prereq_idx" ON course_prerequisites(course_id, prerequisite_id);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id VARCHAR,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Question Topics
CREATE TABLE IF NOT EXISTS question_topics (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id VARCHAR,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Question Bank
CREATE TABLE IF NOT EXISTS question_bank (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice',
  difficulty TEXT NOT NULL DEFAULT 'medium',
  topic_id VARCHAR REFERENCES question_topics(id),
  explanation TEXT,
  points INTEGER DEFAULT 1,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Question Bank Options
CREATE TABLE IF NOT EXISTS question_bank_options (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id VARCHAR NOT NULL REFERENCES question_bank(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  explanation TEXT,
  "order" INTEGER DEFAULT 0
);

-- Flashcard Decks
CREATE TABLE IF NOT EXISTS flashcard_decks (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id VARCHAR REFERENCES courses(id) ON DELETE CASCADE,
  module_id VARCHAR REFERENCES course_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Flashcards
CREATE TABLE IF NOT EXISTS flashcards (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id VARCHAR NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL DEFAULT 'learning',
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  options JSONB,
  correct_answer TEXT,
  explanation TEXT,
  image_url TEXT,
  audio_url TEXT,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Flashcard Progress
CREATE TABLE IF NOT EXISTS flashcard_progress (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id VARCHAR NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  flashcard_id VARCHAR NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  mastery_level INTEGER DEFAULT 0,
  interval INTEGER DEFAULT 1,
  ease_factor INTEGER DEFAULT 250,
  next_review_at TIMESTAMP DEFAULT NOW(),
  review_count INTEGER DEFAULT 0,
  last_reviewed_at TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "flashcard_progress_member_card_idx" ON flashcard_progress(member_id, flashcard_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id VARCHAR REFERENCES members(id) ON DELETE CASCADE,
  user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_url TEXT,
  type TEXT NOT NULL,
  criteria JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Member Achievements
CREATE TABLE IF NOT EXISTS member_achievements (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id VARCHAR NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  achievement_id VARCHAR NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  earned_at TIMESTAMP DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS "member_achievement_idx" ON member_achievements(member_id, achievement_id);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id VARCHAR NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  membership_tier TEXT NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 1,
  payment_provider TEXT NOT NULL,
  provider_reference TEXT,
  provider_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR NOT NULL DEFAULT 'direct',
  name VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversation Participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR NOT NULL,
  member_id VARCHAR NOT NULL,
  joined_at TIMESTAMP DEFAULT NOW(),
  last_read_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_conversation_participants_conversation" ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS "idx_conversation_participants_member" ON conversation_participants(member_id);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id VARCHAR NOT NULL,
  sender_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_messages_conversation" ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS "idx_messages_sender" ON messages(sender_id);
CREATE INDEX IF NOT EXISTS "idx_messages_created" ON messages(created_at);

-- Membership Plans
CREATE TABLE IF NOT EXISTS membership_plans (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL UNIQUE,
  description TEXT,
  access_level INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Plan Pricing
CREATE TABLE IF NOT EXISTS plan_pricing (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id VARCHAR NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
  user_type VARCHAR NOT NULL,
  monthly_price INTEGER NOT NULL,
  yearly_price INTEGER,
  currency VARCHAR DEFAULT 'NGN',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Feature Access
CREATE TABLE IF NOT EXISTS feature_access (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id VARCHAR NOT NULL REFERENCES membership_plans(id) ON DELETE CASCADE,
  feature_key VARCHAR NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);


-- Comments
CREATE TABLE IF NOT EXISTS comments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  commentable_type VARCHAR NOT NULL,
  commentable_id VARCHAR NOT NULL,
  member_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  parent_id VARCHAR,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_comments_commentable" ON comments(commentable_type, commentable_id);
CREATE INDEX IF NOT EXISTS "idx_comments_member" ON comments(member_id);
CREATE INDEX IF NOT EXISTS "idx_comments_parent" ON comments(parent_id);

-- Discussions
CREATE TABLE IF NOT EXISTS discussions (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  course_id VARCHAR,
  lesson_id VARCHAR,
  member_id VARCHAR NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count VARCHAR DEFAULT '0',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_discussions_course" ON discussions(course_id);
CREATE INDEX IF NOT EXISTS "idx_discussions_lesson" ON discussions(lesson_id);
CREATE INDEX IF NOT EXISTS "idx_discussions_member" ON discussions(member_id);

-- Discussion Replies
CREATE TABLE IF NOT EXISTS discussion_replies (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id VARCHAR NOT NULL,
  member_id VARCHAR NOT NULL,
  content TEXT NOT NULL,
  parent_id VARCHAR,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_discussion_replies_discussion" ON discussion_replies(discussion_id);
CREATE INDEX IF NOT EXISTS "idx_discussion_replies_member" ON discussion_replies(member_id);
CREATE INDEX IF NOT EXISTS "idx_discussion_replies_parent" ON discussion_replies(parent_id);

-- Likes
CREATE TABLE IF NOT EXISTS likes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  likeable_type VARCHAR NOT NULL,
  likeable_id VARCHAR NOT NULL,
  member_id VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "idx_likes_likeable" ON likes(likeable_type, likeable_id);
CREATE INDEX IF NOT EXISTS "idx_likes_member" ON likes(member_id);
