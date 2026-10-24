-- Persist admin-created articles and gallery photos, including uploaded images.
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  cover_image text,
  author_id uuid references auth.users(id) on delete set null,
  category text,
  is_published boolean not null default false,
  view_count integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  tags text[] not null default '{}'
);
alter table public.articles add column if not exists cover_image text;
alter table public.articles add column if not exists author_id uuid references auth.users(id) on delete set null;
alter table public.articles add column if not exists category text;
alter table public.articles add column if not exists is_published boolean not null default false;
alter table public.articles add column if not exists view_count integer not null default 0;
alter table public.articles add column if not exists published_at timestamptz;
alter table public.articles add column if not exists updated_at timestamptz not null default now();
alter table public.articles add column if not exists tags text[] not null default '{}';
grant select on public.articles to anon;
grant select, insert, update, delete on public.articles to authenticated;
alter table public.articles enable row level security;

drop policy if exists "Articles viewable by everyone" on public.articles;
drop policy if exists "Allow public read published articles" on public.articles;
drop policy if exists "Allow authenticated full access to articles" on public.articles;
drop policy if exists "Authenticated users can manage articles" on public.articles;
drop policy if exists "Published articles are public" on public.articles;
create policy "Published articles are public" on public.articles for select
  using (is_published = true);
drop policy if exists "Admins manage articles" on public.articles;
create policy "Admins manage articles" on public.articles for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

create table if not exists public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'General',
  is_published boolean not null default true,
  image_url text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  tags text[] not null default '{}',
  view_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.gallery_items add column if not exists description text not null default '';
alter table public.gallery_items add column if not exists category text not null default 'General';
alter table public.gallery_items add column if not exists is_published boolean not null default true;
alter table public.gallery_items add column if not exists image_url text;
alter table public.gallery_items add column if not exists uploaded_by uuid references auth.users(id) on delete set null;
alter table public.gallery_items add column if not exists tags text[] not null default '{}';
alter table public.gallery_items add column if not exists view_count integer not null default 0;
alter table public.gallery_items add column if not exists created_at timestamptz not null default now();
alter table public.gallery_items add column if not exists updated_at timestamptz not null default now();
grant select on public.gallery_items to anon;
grant select, insert, update, delete on public.gallery_items to authenticated;
alter table public.gallery_items enable row level security;

drop policy if exists "Published gallery items are public" on public.gallery_items;
create policy "Published gallery items are public" on public.gallery_items for select
  using (is_published = true);
drop policy if exists "Admins manage gallery items" on public.gallery_items;
create policy "Admins manage gallery items" on public.gallery_items for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

insert into storage.buckets (id, name, public, file_size_limit)
values ('gallery-images', 'gallery-images', true, 52428800)
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit;

drop policy if exists "Public gallery image reads" on storage.objects;
create policy "Public gallery image reads" on storage.objects for select to public
  using (bucket_id = 'gallery-images');
drop policy if exists "Admins manage gallery images" on storage.objects;
create policy "Admins manage gallery images" on storage.objects for all to authenticated
  using (bucket_id = 'gallery-images' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (bucket_id = 'gallery-images' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

notify pgrst, 'reload schema';
