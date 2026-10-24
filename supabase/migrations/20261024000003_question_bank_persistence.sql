-- Complete question-bank fields and allow admins to persist questions, answers,
-- and their topic assignments.
create table if not exists public.question_topics (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  category text not null default 'General',
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.question_topics add column if not exists description text not null default '';
alter table public.question_topics add column if not exists category text not null default 'General';
alter table public.question_topics add column if not exists "order" integer not null default 0;
alter table public.question_topics add column if not exists created_at timestamptz not null default now();

create table if not exists public.question_bank (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  question_type text not null default 'mc',
  difficulty text not null default 'medium',
  explanation text not null default '',
  points integer not null default 1,
  is_active boolean not null default true,
  topic_id uuid references public.question_topics(id) on delete set null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='question_bank' and column_name='question_text')
     and not exists (select 1 from information_schema.columns where table_schema='public' and table_name='question_bank' and column_name='question') then
    alter table public.question_bank rename column question_text to question;
  end if;
end $$;
alter table public.question_bank add column if not exists question text not null default '';
alter table public.question_bank add column if not exists question_type text not null default 'mc';
alter table public.question_bank add column if not exists difficulty text not null default 'medium';
alter table public.question_bank add column if not exists explanation text not null default '';
alter table public.question_bank add column if not exists points integer not null default 1;
alter table public.question_bank add column if not exists is_active boolean not null default true;
alter table public.question_bank add column if not exists topic_id uuid;
alter table public.question_bank add column if not exists tags text[] not null default '{}';
alter table public.question_bank add column if not exists created_at timestamptz not null default now();
alter table public.question_bank add column if not exists updated_at timestamptz not null default now();

create table if not exists public.question_bank_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.question_bank(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false,
  "order" integer not null default 0
);
alter table public.question_bank_options add column if not exists option_text text not null default '';
alter table public.question_bank_options add column if not exists is_correct boolean not null default false;
alter table public.question_bank_options add column if not exists "order" integer not null default 0;

create table if not exists public.question_topic_links (
  question_id uuid not null references public.question_bank(id) on delete cascade,
  topic_id uuid not null references public.question_topics(id) on delete cascade,
  primary key (question_id, topic_id)
);

grant select on public.question_topics, public.question_bank, public.question_bank_options, public.question_topic_links to anon;
grant select, insert, update, delete on public.question_topics, public.question_bank, public.question_bank_options, public.question_topic_links to authenticated;
alter table public.question_topics enable row level security;
alter table public.question_bank enable row level security;
alter table public.question_bank_options enable row level security;
alter table public.question_topic_links enable row level security;

drop policy if exists "Question topics are public" on public.question_topics;
create policy "Question topics are public" on public.question_topics for select using (true);
drop policy if exists "Admins manage question topics" on public.question_topics;
create policy "Admins manage question topics" on public.question_topics for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Active questions are public" on public.question_bank;
create policy "Active questions are public" on public.question_bank for select using (is_active = true);
drop policy if exists "Admins manage questions" on public.question_bank;
create policy "Admins manage questions" on public.question_bank for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Active question options are public" on public.question_bank_options;
create policy "Active question options are public" on public.question_bank_options for select using (exists (
  select 1 from public.question_bank q where q.id = question_bank_options.question_id and q.is_active = true));
drop policy if exists "Admins manage question options" on public.question_bank_options;
create policy "Admins manage question options" on public.question_bank_options for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Active question topics are public" on public.question_topic_links;
create policy "Active question topics are public" on public.question_topic_links for select using (exists (
  select 1 from public.question_bank q where q.id = question_topic_links.question_id and q.is_active = true));
drop policy if exists "Admins manage question topic links" on public.question_topic_links;
create policy "Admins manage question topic links" on public.question_topic_links for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

notify pgrst, 'reload schema';
