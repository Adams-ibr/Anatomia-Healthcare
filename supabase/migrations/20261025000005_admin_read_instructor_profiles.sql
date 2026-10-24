-- Allow the authenticated admin UI to populate course instructor selectors
-- from the same profile records referenced by courses.instructor_id.
grant select on public.profiles to authenticated;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;
grant execute on function public.is_current_user_admin() to authenticated;

drop policy if exists "Admins can read instructor profiles" on public.profiles;
create policy "Admins can read instructor profiles" on public.profiles for select to authenticated
  using (public.is_current_user_admin());
