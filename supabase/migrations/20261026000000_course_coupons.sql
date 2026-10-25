create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_percent integer not null check (discount_percent between 1 and 100),
  is_active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coupon_courses (
  coupon_id uuid not null references public.coupons(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  primary key (coupon_id, course_id)
);

alter table public.orders
  add column if not exists coupon_code text,
  add column if not exists subtotal numeric(12, 2),
  add column if not exists discount_total numeric(12, 2) not null default 0;

alter table public.coupons enable row level security;
alter table public.coupon_courses enable row level security;
grant select, insert, update, delete on public.coupons, public.coupon_courses to authenticated;

drop policy if exists "Admins manage coupons" on public.coupons;
create policy "Admins manage coupons" on public.coupons for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "Admins manage coupon courses" on public.coupon_courses;
create policy "Admins manage coupon courses" on public.coupon_courses for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

notify pgrst, 'reload schema';
