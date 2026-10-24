-- Persist uploaded 3D anatomy models and their public assets.
create table if not exists public.anatomy_models (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default '',
  model_type text not null default '',
  body_system text not null default '',
  model_url text not null,
  thumbnail_url text,
  file_size bigint not null default 0,
  format text not null default 'GLB',
  tags text[] not null default '{}',
  is_published boolean not null default false,
  views integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.anatomy_models add column if not exists description text not null default '';
alter table public.anatomy_models add column if not exists category text not null default '';
alter table public.anatomy_models add column if not exists model_type text not null default '';
alter table public.anatomy_models add column if not exists body_system text not null default '';
alter table public.anatomy_models add column if not exists model_url text;
alter table public.anatomy_models add column if not exists thumbnail_url text;
alter table public.anatomy_models add column if not exists file_size bigint not null default 0;
alter table public.anatomy_models add column if not exists format text not null default 'GLB';
alter table public.anatomy_models add column if not exists tags text[] not null default '{}';
alter table public.anatomy_models add column if not exists is_published boolean not null default false;
alter table public.anatomy_models add column if not exists views integer not null default 0;
alter table public.anatomy_models add column if not exists created_at timestamptz not null default now();
alter table public.anatomy_models add column if not exists updated_at timestamptz not null default now();

grant select on public.anatomy_models to anon;
grant select, insert, update, delete on public.anatomy_models to authenticated;
alter table public.anatomy_models enable row level security;

drop policy if exists "Published anatomy models read" on public.anatomy_models;
create policy "Published anatomy models read" on public.anatomy_models
  for select using (is_published = true);

drop policy if exists "Admins manage anatomy models" on public.anatomy_models;
create policy "Admins manage anatomy models" on public.anatomy_models
  for all to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  ));

insert into storage.buckets (id, name, public, file_size_limit)
values ('anatomy-models', 'anatomy-models', true, 104857600)
on conflict (id) do update
set public = excluded.public, file_size_limit = excluded.file_size_limit;

grant insert, select, update, delete on storage.objects to authenticated;

drop policy if exists "Admins upload anatomy model assets" on storage.objects;
create policy "Admins upload anatomy model assets" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'anatomy-models'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Admins update anatomy model assets" on storage.objects;
create policy "Admins update anatomy model assets" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'anatomy-models'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  )
  with check (
    bucket_id = 'anatomy-models'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

drop policy if exists "Admins delete anatomy model assets" on storage.objects;
create policy "Admins delete anatomy model assets" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'anatomy-models'
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

notify pgrst, 'reload schema';
