create unique index if not exists products_sku_unique_idx
  on public.products (sku)
  where sku is not null;
