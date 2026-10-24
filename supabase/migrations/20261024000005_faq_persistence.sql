-- Add the FAQ engagement fields used by the admin dashboard.
alter table public.faq_items
  add column if not exists view_count integer not null default 0,
  add column if not exists helpful_count integer not null default 0;

grant select on public.faq_items to anon;
grant select, insert, update, delete on public.faq_items to authenticated;

drop policy if exists "FAQ viewable by everyone" on public.faq_items;
drop policy if exists "Authenticated users can manage FAQ" on public.faq_items;
drop policy if exists "Published FAQs are public" on public.faq_items;
drop policy if exists "Admins manage FAQs" on public.faq_items;

create policy "Published FAQs are public" on public.faq_items
  for select to anon, authenticated using (is_active = true);

create policy "Admins manage FAQs" on public.faq_items
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
