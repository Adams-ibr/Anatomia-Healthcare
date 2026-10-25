-- Publicly readable illustration images for instructor-authored text lessons.
-- Authenticated admins and instructors may manage only files in their own folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lesson-content', 'lesson-content', true, 10485760, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

grant select, insert, update, delete on storage.objects to authenticated;

drop policy if exists "Public reads lesson content images" on storage.objects;
create policy "Public reads lesson content images" on storage.objects for select to public
  using (bucket_id = 'lesson-content');

drop policy if exists "Course authors manage lesson content images" on storage.objects;
create policy "Course authors manage lesson content images" on storage.objects for all to authenticated
  using (
    bucket_id = 'lesson-content'
    and (storage.foldername(name))[1] = 'uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'instructor')
    )
  )
  with check (
    bucket_id = 'lesson-content'
    and (storage.foldername(name))[1] = 'uploads'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('admin', 'instructor')
    )
  );
