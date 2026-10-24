-- Add persistent inventory fields and authenticated admin access for products.
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'Books',
  description text not null default '',
  price text not null default '0',
  badge text,
  badge_color text,
  image_url text,
  is_active boolean not null default true,
  "order" integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.products
  add column if not exists sku text,
  add column if not exists cost_price numeric(12, 2),
  add column if not exists stock integer not null default 0,
  add column if not exists low_stock_threshold integer not null default 10,
  add column if not exists is_digital boolean not null default false,
  add column if not exists sales_count integer not null default 0,
  add column if not exists status text not null default 'available';

grant select on public.products to anon;
grant select, insert, update, delete on public.products to authenticated;
alter table public.products enable row level security;

drop policy if exists "Available products are public" on public.products;
create policy "Available products are public" on public.products for select to anon, authenticated
  using (is_active = true);

drop policy if exists "Admins manage products" on public.products;
create policy "Admins manage products" on public.products for all to authenticated
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ))
  with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

notify pgrst, 'reload schema';
