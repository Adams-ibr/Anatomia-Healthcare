create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  role text not null,
  title text not null,
  department text not null,
  bio text,
  avatar text,
  phone text,
  "linkedIn" text,
  twitter text,
  specialties text[] default '{}',
  is_active boolean not null default true,
  joined_at timestamptz not null default now(),
  "order" integer not null default 0
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'unread',
  created_at timestamptz not null default now()
);

create table public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text not null default 'general',
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
