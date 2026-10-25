create table if not exists public.custom_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null default '',
  permissions text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists custom_role_id uuid references public.custom_roles(id) on delete set null;

alter table public.custom_roles enable row level security;

comment on table public.custom_roles is 'Named permission groups assignable to user profiles by administrators.';
