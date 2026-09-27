-- Drobi Line — Supabase schema (project cogucqqwqxuzhlyljmlg)
-- Mirrors migrations: init_store_schema + harden_functions.
-- Documentation / disaster recovery only: running it on the live project again will fail (objects exist).
-- Seed data (products, repair prices, trade-in values) is not included here.

-- ============ Admins ============
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create schema if not exists private;
grant usage on schema private to anon, authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins a where a.user_id = (select auth.uid()));
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

create policy "admins can see own row" on public.admins
  for select to authenticated using (user_id = (select auth.uid()));

-- ============ Products ============
create table public.products (
  id text primary key,
  name text not null check (length(name) between 1 and 200),
  brand text not null default '',
  cat text not null check (cat in ('iphone','samsung','other','acc','used')),
  spec text not null default '',
  price numeric(10,2) not null check (price > 0),
  was numeric(10,2) check (was is null or was > price),
  stock integer not null default 0 check (stock >= 0),
  art text not null default 'iphone' check (art in ('iphone','galaxy','flip','charger','case','glass','bank','buds')),
  color text not null default '#6E7F99',
  image_url text,
  is_new boolean not null default false,
  visible boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;

create policy "public reads visible products" on public.products
  for select to anon, authenticated using (visible or (select private.is_admin()));
create policy "admin inserts products" on public.products
  for insert to authenticated with check ((select private.is_admin()));
create policy "admin updates products" on public.products
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin deletes products" on public.products
  for delete to authenticated using ((select private.is_admin()));

create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
revoke all on function private.touch_updated_at() from public, anon, authenticated;
create trigger products_touch before update on public.products
  for each row execute function private.touch_updated_at();

-- ============ Orders ============
create table public.orders (
  id bigint generated always as identity (start with 1001) primary key,
  customer_name text not null check (length(customer_name) between 1 and 100),
  customer_phone text check (customer_phone is null or length(customer_phone) <= 20),
  area text not null default '' check (length(area) <= 60),
  address text not null default '' check (length(address) <= 500),
  pay_method text not null default '' check (length(pay_method) <= 40),
  subtotal numeric(10,2) not null,
  delivery numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  status text not null default 'new' check (status in ('new','prep','ship','done','cancel')),
  created_at timestamptz not null default now()
);
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
alter table public.orders enable row level security;

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  name text not null,
  price numeric(10,2) not null,
  qty integer not null check (qty between 1 and 20)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
alter table public.order_items enable row level security;

create policy "admin reads orders" on public.orders
  for select to authenticated using ((select private.is_admin()));
create policy "admin updates orders" on public.orders
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin reads order items" on public.order_items
  for select to authenticated using ((select private.is_admin()));

-- Customers create orders only through this function: prices come from the products table, never from the browser.
create or replace function public.place_order(
  p_items jsonb, p_name text, p_area text, p_address text, p_pay text, p_phone text default null
) returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id bigint;
  v_sub numeric(10,2) := 0;
  v_item jsonb;
  v_p public.products%rowtype;
  v_qty int;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'السلة فاضية أو فيها عناصر كثيرة';
  end if;
  if coalesce(trim(p_name), '') = '' or coalesce(trim(p_address), '') = '' then
    raise exception 'الاسم والعنوان مطلوبين';
  end if;

  insert into public.orders (customer_name, customer_phone, area, address, pay_method, subtotal, delivery, total)
  values (left(trim(p_name), 100), nullif(left(trim(coalesce(p_phone, '')), 20), ''), left(coalesce(p_area, ''), 60),
          left(trim(p_address), 500), left(coalesce(p_pay, ''), 40), 0, 0, 0)
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(1, least(20, coalesce((v_item->>'qty')::int, 1)));
    select * into v_p from public.products where id = v_item->>'id' and visible;
    if not found then
      raise exception 'منتج غير متوفر: %', v_item->>'id';
    end if;
    insert into public.order_items (order_id, product_id, name, price, qty)
    values (v_order_id, v_p.id, coalesce(nullif(left(v_item->>'label', 200), ''), v_p.name), v_p.price, v_qty);
    v_sub := v_sub + v_p.price * v_qty;
  end loop;

  update public.orders
     set subtotal = v_sub,
         delivery = case when v_sub >= 500 then 0 else 25 end,
         total = v_sub + case when v_sub >= 500 then 0 else 25 end
   where id = v_order_id;

  return v_order_id;
end;
$$;
revoke all on function public.place_order(jsonb, text, text, text, text, text) from public;
grant execute on function public.place_order(jsonb, text, text, text, text, text) to anon, authenticated;

-- Stock moves when the admin confirms an order (new -> prep/ship/done) and comes back if it is cancelled/reopened.
create or replace function private.orders_stock_sync()
returns trigger language plpgsql security definer set search_path = '' as $$
declare was_counted boolean; now_counted boolean;
begin
  was_counted := old.status in ('prep','ship','done');
  now_counted := new.status in ('prep','ship','done');
  if now_counted and not was_counted then
    update public.products p set stock = greatest(0, p.stock - i.qty)
      from public.order_items i where i.order_id = new.id and i.product_id = p.id;
  elsif was_counted and not now_counted then
    update public.products p set stock = p.stock + i.qty
      from public.order_items i where i.order_id = new.id and i.product_id = p.id;
  end if;
  return new;
end; $$;
revoke all on function private.orders_stock_sync() from public, anon, authenticated;
create trigger orders_stock after update of status on public.orders
  for each row when (old.status is distinct from new.status) execute function private.orders_stock_sync();

-- ============ Repair prices & trade-in values ============
create table public.repair_prices (
  id bigint generated always as identity primary key,
  brand text not null,
  model text not null,
  screen numeric(10,2) not null default 0 check (screen >= 0),
  battery numeric(10,2) not null default 0 check (battery >= 0),
  back numeric(10,2) not null default 0 check (back >= 0),
  sort integer not null default 0,
  unique (brand, model)
);
alter table public.repair_prices enable row level security;
create policy "public reads repair prices" on public.repair_prices for select to anon, authenticated using (true);
create policy "admin inserts repair prices" on public.repair_prices for insert to authenticated with check ((select private.is_admin()));
create policy "admin updates repair prices" on public.repair_prices for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin deletes repair prices" on public.repair_prices for delete to authenticated using ((select private.is_admin()));

create table public.trade_values (
  id bigint generated always as identity primary key,
  model text not null unique,
  value numeric(10,2) not null default 0 check (value >= 0),
  sort integer not null default 0
);
alter table public.trade_values enable row level security;
create policy "public reads trade values" on public.trade_values for select to anon, authenticated using (true);
create policy "admin inserts trade values" on public.trade_values for insert to authenticated with check ((select private.is_admin()));
create policy "admin updates trade values" on public.trade_values for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin deletes trade values" on public.trade_values for delete to authenticated using ((select private.is_admin()));

-- ============ Product images bucket ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 3145728, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "admin uploads product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and (select private.is_admin()));
create policy "admin updates product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and (select private.is_admin()));
create policy "admin deletes product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and (select private.is_admin()));
