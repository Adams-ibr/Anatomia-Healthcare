-- Create the Career and Communication records that the admin modules manage.
create table if not exists public.careers (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  department text not null default '',
  location text not null default '',
  type text not null default 'full_time',
  description text not null default '',
  requirements text not null default '',
  is_active boolean not null default false,
  status text not null default 'draft',
  application_count integer not null default 0,
  salary text,
  posted_at timestamptz not null default now(),
  closing_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.careers(id) on delete cascade,
  name text not null,
  email text not null,
  phone text not null default '',
  location text not null default '',
  experience integer not null default 0,
  cover_letter text not null default '',
  portfolio_url text,
  resume_url text,
  start_date text not null default '',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  topic text not null default '',
  subject text not null default '',
  message text not null,
  category text not null default 'General',
  status text not null default 'new',
  is_read boolean not null default false,
  is_starred boolean not null default false,
  notes text,
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists newsletter_subscriptions_email_lower_unique
  on public.newsletter_subscriptions (lower(email));

grant select on public.careers to anon;
grant select, insert, update, delete on public.careers to authenticated;
alter table public.careers enable row level security;
drop policy if exists "Open careers are public" on public.careers;
create policy "Open careers are public" on public.careers for select to anon, authenticated
  using (status = 'open' and is_active = true);
drop policy if exists "Admins manage careers" on public.careers;
create policy "Admins manage careers" on public.careers for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

grant select, insert, update, delete on public.job_applications to authenticated;
grant insert on public.job_applications to anon;
alter table public.job_applications enable row level security;
drop policy if exists "Applicants submit applications" on public.job_applications;
create policy "Applicants submit applications" on public.job_applications for insert to anon, authenticated
  with check (exists (select 1 from public.careers c where c.id = job_id and c.status = 'open' and c.is_active = true));
drop policy if exists "Admins manage job applications" on public.job_applications;
create policy "Admins manage job applications" on public.job_applications for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

grant insert on public.contact_messages to anon;
grant select, insert, update, delete on public.contact_messages to authenticated;
alter table public.contact_messages enable row level security;
drop policy if exists "Public submit contact messages" on public.contact_messages;
create policy "Public submit contact messages" on public.contact_messages for insert to anon, authenticated
  with check (true);
drop policy if exists "Admins manage contact messages" on public.contact_messages;
create policy "Admins manage contact messages" on public.contact_messages for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

grant insert on public.newsletter_subscriptions to anon;
grant select, insert, delete on public.newsletter_subscriptions to authenticated;
alter table public.newsletter_subscriptions enable row level security;
drop policy if exists "Public subscribe to newsletter" on public.newsletter_subscriptions;
create policy "Public subscribe to newsletter" on public.newsletter_subscriptions for insert to anon, authenticated
  with check (true);
drop policy if exists "Admins manage newsletter subscribers" on public.newsletter_subscriptions;
create policy "Admins manage newsletter subscribers" on public.newsletter_subscriptions for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

notify pgrst, 'reload schema';
