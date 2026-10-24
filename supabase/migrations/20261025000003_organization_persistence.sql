-- Persist organization administration and tighten management access to admins.

alter table public.team_members
  add column if not exists department text not null default '',
  add column if not exists phone text,
  add column if not exists twitter_url text,
  add column if not exists specialties text[] not null default '{}';

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  description text not null default '',
  head_id uuid references public.profiles(id) on delete set null,
  head_name text,
  member_count integer not null default 0,
  course_count integer not null default 0,
  color text not null default '#3B82F6',
  is_active boolean not null default true,
  "order" integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists departments_code_upper_unique on public.departments (upper(code));

grant select, insert, update, delete on public.departments to authenticated;
alter table public.departments enable row level security;
drop policy if exists "Admins manage departments" on public.departments;
create policy "Admins manage departments" on public.departments for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Remove permissive policies that allowed any profiled user to edit these records.
drop policy if exists "Authenticated users can manage team" on public.team_members;
drop policy if exists "team_members_admin_all" on public.team_members;
drop policy if exists "team_members_public_read" on public.team_members;
grant select, insert, update, delete on public.team_members to authenticated;
drop policy if exists "Admins manage team members" on public.team_members;
create policy "Admins manage team members" on public.team_members for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "Active team members are public" on public.team_members;
create policy "Active team members are public" on public.team_members for select to anon, authenticated
  using (is_active = true);

drop policy if exists "Authenticated users can manage partners" on public.partners;
grant select, insert, update, delete on public.partners to authenticated;
drop policy if exists "Admins manage partners" on public.partners;
create policy "Admins manage partners" on public.partners for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
drop policy if exists "Active partners are public" on public.partners;
create policy "Active partners are public" on public.partners for select to anon, authenticated
  using (status = 'active' and is_active = true);

notify pgrst, 'reload schema';
