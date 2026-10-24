-- Keep the flashcard schema aligned with the admin deck/card forms.
create table if not exists public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'General',
  course_id uuid references public.courses(id) on delete set null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.flashcard_decks add column if not exists description text not null default '';
alter table public.flashcard_decks add column if not exists category text not null default 'General';
alter table public.flashcard_decks add column if not exists course_id uuid references public.courses(id) on delete set null;
alter table public.flashcard_decks add column if not exists is_published boolean not null default false;
alter table public.flashcard_decks add column if not exists created_at timestamptz not null default now();
alter table public.flashcard_decks add column if not exists updated_at timestamptz not null default now();

create table if not exists public.flashcards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  front text not null,
  back text not null,
  card_type text not null default 'learning',
  image_url text,
  audio_url text,
  options jsonb,
  correct_answer text,
  explanation text,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.flashcards add column if not exists card_type text not null default 'learning';
alter table public.flashcards add column if not exists image_url text;
alter table public.flashcards add column if not exists audio_url text;
alter table public.flashcards add column if not exists options jsonb;
alter table public.flashcards add column if not exists correct_answer text;
alter table public.flashcards add column if not exists explanation text;
alter table public.flashcards add column if not exists "order" integer not null default 0;
alter table public.flashcards add column if not exists created_at timestamptz not null default now();

grant select on public.flashcard_decks, public.flashcards to anon;
grant select, insert, update, delete on public.flashcard_decks, public.flashcards to authenticated;
alter table public.flashcard_decks enable row level security;
alter table public.flashcards enable row level security;

drop policy if exists "Published flashcard decks read" on public.flashcard_decks;
create policy "Published flashcard decks read" on public.flashcard_decks
  for select using (is_published = true);
drop policy if exists "Admins manage flashcard decks" on public.flashcard_decks;
create policy "Admins manage flashcard decks" on public.flashcard_decks
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Published flashcards read" on public.flashcards;
create policy "Published flashcards read" on public.flashcards
  for select using (exists (
    select 1 from public.flashcard_decks d where d.id = flashcards.deck_id and d.is_published = true
  ));
drop policy if exists "Admins manage flashcards" on public.flashcards;
create policy "Admins manage flashcards" on public.flashcards
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

notify pgrst, 'reload schema';
