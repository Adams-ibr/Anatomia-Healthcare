-- Shared public image bucket for admin-managed images. Upload, replace, and delete
-- are restricted to authenticated admin profiles.
alter table public.team_members add column if not exists photo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('admin-media', 'admin-media', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public reads admin media images" on storage.objects;
create policy "Public reads admin media images" on storage.objects for select to public
  using (bucket_id = 'admin-media');

drop policy if exists "Admins manage admin media images" on storage.objects;
create policy "Admins manage admin media images" on storage.objects for all to authenticated
  using (bucket_id = 'admin-media' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (bucket_id = 'admin-media' and exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));
