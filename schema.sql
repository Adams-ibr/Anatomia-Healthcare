-- =============================================================================
-- HamaAcademy — Supabase PostgreSQL schema
-- Derived from the frontend data model (src/lib/types.ts)
-- Run in the Supabase SQL editor, or via: supabase db push
-- =============================================================================

create extension if not exists "pgcrypto";

-- Supabase app-role access (subject to RLS). Run this against an existing
-- database too — new tables won't inherit grants if defaults were altered.
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant all on all functions in schema public to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------

create type public.app_role as enum ('student', 'instructor', 'admin', 'support');
create type public.course_status as enum ('published', 'draft', 'pending', 'approved', 'archived');
create type public.course_level as enum ('Beginner', 'Intermediate', 'Advanced');
create type public.lesson_type as enum ('video', 'article', 'pdf', 'audio', 'quiz', 'assignment', 'exam', 'project');
create type public.enrollment_status as enum ('active', 'completed');
create type public.assignment_status as enum ('open', 'graded', 'closed');
create type public.order_status as enum ('completed', 'pending', 'refunded', 'failed');
create type public.question_type as enum ('mc', 'multi', 'truefalse', 'short', 'essay', 'fill');

-- -----------------------------------------------------------------------------
-- Profiles (one row per auth.users entry; auto-created on signup)
-- -----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role public.app_role not null default 'student',
  avatar text,
  title text,
  bio text,
  skills text[] default '{}',
  headline text,
  website text,
  student_count integer not null default 0,
  course_count integer not null default 0,
  rating numeric(2,1) not null default 0,
  is_active boolean not null default true,
  joined_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);
create index profiles_email_idx on public.profiles (email);

-- Auto-create a profile row when a new auth user signs up.
create function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- -----------------------------------------------------------------------------
-- Categories
-- -----------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  icon text,
  color text,
  course_count integer not null default 0
);

-- -----------------------------------------------------------------------------
-- Courses
-- -----------------------------------------------------------------------------

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text not null default '',
  description text not null default '',
  long_description text not null default '',
  category_id uuid not null references public.categories (id),
  instructor_id uuid not null references public.profiles (id),
  thumbnail text,
  price numeric(10,2) not null default 0,
  discount_price numeric(10,2),
  rating numeric(2,1) not null default 0,
  review_count integer not null default 0,
  student_count integer not null default 0,
  duration integer not null default 0, -- minutes
  level public.course_level not null default 'Beginner',
  language text not null default 'English',
  last_updated timestamptz not null default now(),
  has_certificate boolean not null default false,
  is_featured boolean not null default false,
  is_trending boolean not null default false,
  is_new boolean not null default false,
  status public.course_status not null default 'pending',
  created_at timestamptz not null default now()
);

create index courses_category_idx on public.courses (category_id);
create index courses_instructor_idx on public.courses (instructor_id);
create index courses_status_idx on public.courses (status);
create index courses_featured_idx on public.courses (is_featured) where is_featured;

create table public.course_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  position integer not null default 0
);

create index course_sections_course_idx on public.course_sections (course_id, position);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references public.course_sections (id) on delete cascade,
  title text not null,
  type public.lesson_type not null default 'video',
  duration integer not null default 0,
  content text not null default '',
  video_url text,
  resource_url text,
  position integer not null default 0
);

create index lessons_section_idx on public.lessons (section_id, position);

create table public.course_objectives (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  text text not null,
  position integer not null default 0
);

create index course_objectives_course_idx on public.course_objectives (course_id);

create table public.course_requirements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  text text not null,
  position integer not null default 0
);

create index course_requirements_course_idx on public.course_requirements (course_id);

create table public.course_faqs (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  question text not null,
  answer text not null
);

create index course_faqs_course_idx on public.course_faqs (course_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  user_name text not null,
  rating integer not null check (rating between 1 and 5),
  text text not null default '',
  created_at timestamptz not null default now()
);

create index reviews_course_idx on public.reviews (course_id);

-- -----------------------------------------------------------------------------
-- Certificates
-- -----------------------------------------------------------------------------

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  instructor_id uuid references public.profiles (id) on delete set null,
  issued_at timestamptz not null default now(),
  completion_date timestamptz not null default now(),
  verification_code text not null unique,
  unique (user_id, course_id)
);

create index certificates_user_idx on public.certificates (user_id);
create index certificates_code_idx on public.certificates (verification_code);

-- -----------------------------------------------------------------------------
-- Enrollments / progress
-- -----------------------------------------------------------------------------

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  progress integer not null default 0 check (progress between 0 and 100),
  status public.enrollment_status not null default 'active',
  completed_lessons text[] default '{}',
  current_lesson_id uuid references public.lessons (id) on delete set null,
  certificate_issued boolean not null default false,
  certificate_id uuid references public.certificates (id) on delete set null,
  price_paid numeric(10,2) not null default 0,
  unique (user_id, course_id)
);

create index enrollments_user_idx on public.enrollments (user_id);
create index enrollments_course_idx on public.enrollments (course_id);

-- -----------------------------------------------------------------------------
-- Assessments & assignments
-- -----------------------------------------------------------------------------

create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text not null default '',
  time_limit integer not null default 30, -- minutes
  passing_score integer not null default 60,
  retake_limit integer not null default 3
);

create index assessments_course_idx on public.assessments (course_id);

create table public.assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  type public.question_type not null default 'mc',
  question text not null,
  options text[],
  answer text,
  explanation text,
  position integer not null default 0
);

create index assessment_questions_assessment_idx on public.assessment_questions (assessment_id);

create table public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  score integer not null default 0,
  answers jsonb not null default '{}',
  passed boolean not null default false,
  attempted_at timestamptz not null default now()
);

create index assessment_attempts_user_idx on public.assessment_attempts (user_id);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  section_id uuid references public.course_sections (id) on delete set null,
  title text not null,
  description text not null default '',
  deadline timestamptz,
  points integer not null default 0,
  resources jsonb not null default '[]', -- [{name, url}]
  status public.assignment_status not null default 'open'
);

create index assignments_course_idx on public.assignments (course_id);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  text text not null default '',
  link text,
  files jsonb not null default '[]', -- [{name, url}]
  submitted_at timestamptz not null default now(),
  grade integer,
  feedback text,
  returned boolean not null default false
);

create index submissions_assignment_idx on public.submissions (assignment_id);
create index submissions_user_idx on public.submissions (user_id);

-- -----------------------------------------------------------------------------
-- Communication
-- -----------------------------------------------------------------------------

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  last_message_at timestamptz not null default now()
);

create table public.conversation_participants (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  primary key (conversation_id, user_id)
);

create index conversation_participants_user_idx on public.conversation_participants (user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  text text not null,
  attachment jsonb, -- {name, url}
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null default 'general',
  title text not null,
  message text not null default '',
  is_read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, is_read);

create table public.discussions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null,
  title text not null,
  body text not null default '',
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

create index discussions_course_idx on public.discussions (course_id);

create table public.discussion_answers (
  id uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  author_name text not null,
  text text not null,
  created_at timestamptz not null default now()
);

create index discussion_answers_discussion_idx on public.discussion_answers (discussion_id);

create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);

create index announcements_course_idx on public.announcements (course_id);

-- -----------------------------------------------------------------------------
-- Commerce
-- -----------------------------------------------------------------------------

create table public.wishlist (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table public.cart_items (
  user_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  total numeric(10,2) not null default 0,
  status public.order_status not null default 'pending',
  payment_method text not null default '',
  payment_reference text,
  created_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create unique index orders_payment_ref_idx on public.orders (payment_reference) where payment_reference is not null;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  course_id uuid not null references public.courses (id),
  title text not null,
  price numeric(10,2) not null default 0
);

create index order_items_order_idx on public.order_items (order_id);

-- -----------------------------------------------------------------------------
-- Marketing / content
-- -----------------------------------------------------------------------------

create table public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  career text not null default '',
  icon text,
  level text not null default 'Beginner'
);

create table public.learning_path_courses (
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  position integer not null default 0,
  primary key (path_id, course_id)
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  category text not null default '',
  author text not null default '',
  author_title text,
  published_at timestamptz not null default now(),
  read_time integer not null default 5,
  thumbnail text,
  content jsonb not null default '[]' -- array of blocks/paragraphs
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  company text,
  text text not null,
  rating integer not null default 5 check (rating between 1 and 5)
);

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null default 0,
  period text not null default 'month',
  description text not null default '',
  features text[] default '{}',
  is_highlight boolean not null default false
);

-- -----------------------------------------------------------------------------
-- User preferences (per-account notification, privacy and language settings)
-- -----------------------------------------------------------------------------

create table public.user_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  email_notifications boolean not null default true,
  course_notifications boolean not null default true,
  assignment_notifications boolean not null default true,
  marketing_notifications boolean not null default false,
  public_profile boolean not null default true,
  show_learning boolean not null default true,
  show_skills boolean not null default true,
  language text not null default 'en',
  updated_at timestamptz not null default now()
);

create table public.user_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  token_jti text not null,
  user_agent text not null default '',
  ip text not null default '',
  is_revoked boolean not null default false,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index user_sessions_user_idx on public.user_sessions (user_id, last_seen_at desc);

-- -----------------------------------------------------------------------------
-- Platform settings (single row)
-- -----------------------------------------------------------------------------

create table public.platform_settings (
  id boolean primary key default true constraint platform_settings_singleton check (id),
  platform_name text not null default 'HamaAcademy',
  support_email text not null default '',
  default_currency text not null default 'NGN',
  instructor_share integer not null default 70,
  primary_color text not null default '#1B4E9B',
  tagline text not null default '',
  refund_window_days integer not null default 7,
  passing_score integer not null default 70,
  welcome_email boolean not null default true,
  completion_email boolean not null default true,
  assignment_reminders boolean not null default true,
  weekly_digest boolean not null default false,
  updated_at timestamptz not null default now()
);

insert into public.platform_settings (id) values (true) on conflict (id) do nothing;

grant all on public.platform_settings to service_role, postgres;
grant select on public.platform_settings to anon, authenticated;
grant all on public.user_preferences to service_role, postgres;
grant select, insert, update, delete on public.user_preferences to authenticated;
grant all on public.user_sessions to service_role, postgres;
grant select, insert, update, delete on public.user_sessions to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security (enable + base policies)
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.courses enable row level security;
alter table public.course_sections enable row level security;
alter table public.lessons enable row level security;
alter table public.course_objectives enable row level security;
alter table public.course_requirements enable row level security;
alter table public.course_faqs enable row level security;
alter table public.reviews enable row level security;
alter table public.enrollments enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_questions enable row level security;
alter table public.assessment_attempts enable row level security;
alter table public.assignments enable row level security;
alter table public.submissions enable row level security;
alter table public.certificates enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.discussions enable row level security;
alter table public.discussion_answers enable row level security;
alter table public.announcements enable row level security;
alter table public.wishlist enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.learning_paths enable row level security;
alter table public.blog_posts enable row level security;
alter table public.testimonials enable row level security;
alter table public.plans enable row level security;
alter table public.platform_settings enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_sessions enable row level security;

-- Public catalog reads
create policy "Public catalog read" on public.categories for select using (true);
create policy "Published courses read" on public.courses for select using (status = 'published');
create policy "Sections read" on public.course_sections for select using (exists (
  select 1 from public.courses c where c.id = course_sections.course_id and c.status = 'published'));
create policy "Lessons read" on public.lessons for select using (exists (
  select 1 from public.course_sections s
  join public.courses c on c.id = s.course_id
  where s.id = lessons.section_id and c.status = 'published'));
create policy "Objectives read" on public.course_objectives for select using (true);
create policy "Requirements read" on public.course_requirements for select using (true);
create policy "FAQs read" on public.course_faqs for select using (true);
create policy "Reviews read" on public.reviews for select using (true);
create policy "Public content read" on public.learning_paths for select using (true);
create policy "Public content read" on public.blog_posts for select using (true);
create policy "Public content read" on public.testimonials for select using (true);
create policy "Public content read" on public.plans for select using (true);
create policy "Platform settings read" on public.platform_settings for select using (true);
create policy "Own preferences read" on public.user_preferences for select using (auth.uid() = user_id);
create policy "Own preferences write" on public.user_preferences for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own sessions read" on public.user_sessions for select using (auth.uid() = user_id);
create policy "Own sessions write" on public.user_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Self-service policies for authenticated users
create policy "Own profile read/write" on public.profiles for select using (auth.uid() = id);
create policy "Own profile update" on public.profiles for update using (auth.uid() = id);

create policy "Own enrollments read/write" on public.enrollments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own notifications read/write" on public.notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own certificates read" on public.certificates for select using (auth.uid() = user_id);
create policy "Own attempts read/write" on public.assessment_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own submissions read/write" on public.submissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own orders read" on public.orders for select using (auth.uid() = user_id);
create policy "Own wishlist read/write" on public.wishlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Own cart read/write" on public.cart_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Instructor-owned content
create policy "Own courses manage" on public.courses for all using (auth.uid() = instructor_id) with check (auth.uid() = instructor_id);

-- Message participants access
create policy "Conversation participants read" on public.conversation_participants for select using (auth.uid() = user_id);
create policy "Conversation read" on public.conversations for select using (exists (
  select 1 from public.conversation_participants p where p.conversation_id = conversations.id and p.user_id = auth.uid()));
create policy "Messages read" on public.messages for select using (exists (
  select 1 from public.conversation_participants p
  where p.conversation_id = messages.conversation_id and p.user_id = auth.uid()));
create policy "Messages send" on public.messages for insert with check (from_id = auth.uid());