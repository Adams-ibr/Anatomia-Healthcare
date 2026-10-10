-- Missing tables from supabase.ts

create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '',
  is_active boolean not null default true,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default '',
  is_published boolean not null default false,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  type text not null default '',
  status text not null default 'active',
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.careers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  is_active boolean not null default true,
  status text not null default 'open',
  type text not null default '',
  created_at timestamptz not null default now()
);

create table public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.careers (id) on delete cascade,
  status text not null default 'pending',
  applicant_name text,
  applicant_email text,
  resume_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table public.anatomy_models (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default '',
  body_system text not null default '',
  is_published boolean not null default false,
  model_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  course_id uuid references public.courses (id) on delete set null,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks (id) on delete cascade,
  front text not null,
  back text not null,
  "order" integer not null default 0
);

create table public.question_bank (
  id uuid primary key default gen_random_uuid(),
  topic_id text,
  difficulty text not null default 'medium',
  is_active boolean not null default true,
  question_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_bank_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.question_bank (id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false
);
