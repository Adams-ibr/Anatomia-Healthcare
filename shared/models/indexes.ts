/**
 * Database Indexes for Performance Optimization
 * 
 * This file documents the indexes that should be created on the database
 * to optimize query performance on frequently-accessed columns.
 * 
 * These can be applied via SQL migration or Drizzle Kit.
 */

export const indexCreationSQL = `
-- Authentication & Session Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_sessions_sid ON sessions(sid);
CREATE INDEX IF NOT EXISTS idx_sessions_expire ON sessions(expire);

-- LMS Course Indexes
CREATE INDEX IF NOT EXISTS idx_courses_slug ON courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_published ON courses(is_published);
CREATE INDEX IF NOT EXISTS idx_courses_featured ON courses(is_featured);

-- LMS Enrollment Indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_member_id ON enrollments(member_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_member_course ON enrollments(member_id, course_id);

-- Progress Tracking Indexes
CREATE INDEX IF NOT EXISTS idx_lesson_progress_member_id ON lesson_progress(member_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_member_id ON quiz_attempts(member_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);

-- Payment Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_member_id ON payment_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider_ref ON payment_transactions(provider_reference);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);

-- Content Indexes
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured);

-- Gallery Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_items_published ON gallery_items(is_published);
CREATE INDEX IF NOT EXISTS idx_gallery_items_category ON gallery_items(category);

-- Interaction Indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_comments_content_id ON comments(content_id);
CREATE INDEX IF NOT EXISTS idx_discussions_course_id ON discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
`;

/**
 * Drizzle ORM index definitions for new tables
 * Add these to table definitions when creating new tables
 */
export const indexDefinitions = {
  users: [
    "CREATE INDEX idx_users_email ON users(email)",
  ],
  members: [
    "CREATE INDEX idx_members_email ON members(email)",
  ],
  sessions: [
    "CREATE INDEX idx_sessions_sid ON sessions(sid)",
    "CREATE INDEX idx_sessions_expire ON sessions(expire)",
  ],
  courses: [
    "CREATE INDEX idx_courses_slug ON courses(slug)",
    "CREATE INDEX idx_courses_published ON courses(is_published)",
    "CREATE INDEX idx_courses_featured ON courses(is_featured)",
  ],
  enrollments: [
    "CREATE INDEX idx_enrollments_member_id ON enrollments(member_id)",
    "CREATE INDEX idx_enrollments_course_id ON enrollments(course_id)",
    "CREATE INDEX idx_enrollments_member_course ON enrollments(member_id, course_id)",
  ],
  payment_transactions: [
    "CREATE INDEX idx_payment_transactions_member_id ON payment_transactions(member_id)",
    "CREATE INDEX idx_payment_transactions_provider_ref ON payment_transactions(provider_reference)",
    "CREATE INDEX idx_payment_transactions_status ON payment_transactions(status)",
  ],
};
