-- Keep the open-role application count aligned with submitted applications.
update public.careers c
set application_count = (select count(*)::integer from public.job_applications a where a.job_id = c.id);

create or replace function public.refresh_career_application_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.careers set application_count = application_count + 1, updated_at = now() where id = new.job_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.careers set application_count = greatest(0, application_count - 1), updated_at = now() where id = old.job_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists refresh_career_application_count on public.job_applications;
create trigger refresh_career_application_count
after insert or delete on public.job_applications
for each row execute function public.refresh_career_application_count();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-resumes',
  'job-resumes',
  false,
  10485760,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public applicants upload resumes" on storage.objects;
create policy "Public applicants upload resumes" on storage.objects
for insert to anon, authenticated
with check (bucket_id = 'job-resumes');

drop policy if exists "Admins read application resumes" on storage.objects;
create policy "Admins read application resumes" on storage.objects
for select to authenticated
using (
  bucket_id = 'job-resumes'
  and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
);

notify pgrst, 'reload schema';
