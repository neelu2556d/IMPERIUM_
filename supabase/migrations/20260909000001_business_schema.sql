-- business_lots
create table public.business_lots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  design_no text not null,
  design_photo_url text,
  date_arrived date not null default current_date,
  status text not null default 'arrived'
    check (status in ('arrived','active','low_stock','cleared','dead_stock')),
  low_stock_threshold integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_lots enable row level security;

create policy "users can read own lots"
  on public.business_lots for select
  using (auth.uid() = user_id);

create policy "users can insert own lots"
  on public.business_lots for insert
  with check (auth.uid() = user_id);

create policy "users can update own lots"
  on public.business_lots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own lots"
  on public.business_lots for delete
  using (auth.uid() = user_id);

-- business_lot_components
create table public.business_lot_components (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lot_id uuid not null references business_lots(id) on delete cascade,
  component text not null check (component in ('top','bottom','dupatta')),
  opening_metres numeric(10,2) not null default 0,
  sold_metres numeric(10,2) not null default 0,
  cost_per_metre numeric(10,2),
  unique(lot_id, component)
);

alter table public.business_lot_components enable row level security;

create policy "users can read own lot components"
  on public.business_lot_components for select
  using (auth.uid() = user_id);

create policy "users can insert own lot components"
  on public.business_lot_components for insert
  with check (auth.uid() = user_id);

create policy "users can update own lot components"
  on public.business_lot_components for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own lot components"
  on public.business_lot_components for delete
  using (auth.uid() = user_id);

-- business_parties
create table public.business_parties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  area text,
  city text,
  phone text,
  gstin text,
  default_payment_days integer default 30,
  default_cd_percent numeric(5,2) default 0,
  default_gst_preference text default 'non_gst'
    check (default_gst_preference in ('non_gst','gst')),
  credit_limit numeric(12,2),
  notes text default '',
  created_at timestamptz not null default now()
);

alter table public.business_parties enable row level security;

create policy "users can read own parties"
  on public.business_parties for select
  using (auth.uid() = user_id);

create policy "users can insert own parties"
  on public.business_parties for insert
  with check (auth.uid() = user_id);

create policy "users can update own parties"
  on public.business_parties for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own parties"
  on public.business_parties for delete
  using (auth.uid() = user_id);

-- business_rate_cards
create table public.business_rate_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  party_id uuid not null references business_parties(id) on delete cascade,
  item_name text not null,
  top_rate numeric(10,2),
  bottom_rate numeric(10,2),
  dupatta_rate numeric(10,2),
  discount_percent numeric(5,2) default 0,
  payment_days integer default 30,
  gst_preference text default 'non_gst'
    check (gst_preference in ('non_gst','gst')),
  unique(party_id, item_name)
);

alter table public.business_rate_cards enable row level security;

create policy "users can read own rate cards"
  on public.business_rate_cards for select
  using (auth.uid() = user_id);

create policy "users can insert own rate cards"
  on public.business_rate_cards for insert
  with check (auth.uid() = user_id);

create policy "users can update own rate cards"
  on public.business_rate_cards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own rate cards"
  on public.business_rate_cards for delete
  using (auth.uid() = user_id);

-- business_orders
create table public.business_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_date date not null default current_date,
  party_id uuid not null references business_parties(id) on delete cascade,
  lot_id uuid not null references business_lots(id) on delete cascade,
  item_name text not null,
  design_no text not null,
  top_metres numeric(10,2) not null default 0,
  bottom_metres numeric(10,2) not null default 0,
  dupatta_metres numeric(10,2) not null default 0,
  colours integer not null default 1,
  top_rate numeric(10,2) not null default 0,
  bottom_rate numeric(10,2) not null default 0,
  dupatta_rate numeric(10,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  gst_applied boolean not null default false,
  payment_days integer not null default 30,
  subtotal numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  gst_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  amount_received numeric(12,2) not null default 0,
  status text not null default 'pending'
    check (status in ('pending','paid','partial','overdue')),
  due_date date not null,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_orders enable row level security;

create policy "users can read own orders"
  on public.business_orders for select
  using (auth.uid() = user_id);

create policy "users can insert own orders"
  on public.business_orders for insert
  with check (auth.uid() = user_id);

create policy "users can update own orders"
  on public.business_orders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own orders"
  on public.business_orders for delete
  using (auth.uid() = user_id);

-- business_payments
create table public.business_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid not null references business_orders(id) on delete cascade,
  amount numeric(12,2) not null,
  payment_date date not null default current_date,
  cd_applied boolean default false,
  cd_amount numeric(12,2) default 0,
  notes text default '',
  created_at timestamptz not null default now()
);

alter table public.business_payments enable row level security;

create policy "users can read own payments"
  on public.business_payments for select
  using (auth.uid() = user_id);

create policy "users can insert own payments"
  on public.business_payments for insert
  with check (auth.uid() = user_id);

create policy "users can update own payments"
  on public.business_payments for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own payments"
  on public.business_payments for delete
  using (auth.uid() = user_id);

-- business_catalogue
create table public.business_catalogue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  design_no text not null,
  photo_url text not null,
  lot_id uuid references business_lots(id) on delete set null,
  uploaded_at timestamptz not null default now(),
  unique(user_id, item_name, design_no)
);

alter table public.business_catalogue enable row level security;

create policy "users can read own catalogue"
  on public.business_catalogue for select
  using (auth.uid() = user_id);

create policy "users can insert own catalogue"
  on public.business_catalogue for insert
  with check (auth.uid() = user_id);

create policy "users can update own catalogue"
  on public.business_catalogue for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own catalogue"
  on public.business_catalogue for delete
  using (auth.uid() = user_id);

-- business_morning_briefings
create table public.business_morning_briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  briefing_date date not null default current_date,
  content text not null,
  created_at timestamptz not null default now(),
  unique(user_id, briefing_date)
);

alter table public.business_morning_briefings enable row level security;

create policy "users can read own morning briefings"
  on public.business_morning_briefings for select
  using (auth.uid() = user_id);

create policy "users can insert own morning briefings"
  on public.business_morning_briefings for insert
  with check (auth.uid() = user_id);

create policy "users can update own morning briefings"
  on public.business_morning_briefings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users can delete own morning briefings"
  on public.business_morning_briefings for delete
  using (auth.uid() = user_id);

-- Function: recalculate_lot_status
create or replace function public.recalculate_lot_status()
returns trigger as $$
declare
  lot_record business_lots%rowtype;
  all_remaining numeric := 0;
  min_remaining numeric := 0;
  lot_age integer;
begin
  select * into lot_record from business_lots where id = new.id;

  -- Calculate remaining stock for each component
  select coalesce(sum(opening_metres - sold_metres), 0) into all_remaining
  from business_lot_components
  where lot_id = lot_record.id;

  min_remaining := lot_record.low_stock_threshold;

  -- Calculate lot age in days
  lot_age = (date_part('day', current_date) - date_part('day', lot_record.date_arrived));

  -- Apply business rules
  if all_remaining <= (lot_record.low_stock_threshold * 0.05) then
    new_status := 'cleared';
  elsif all_remaining < min_remaining then
    new_status := 'low_stock';
  elsif all_remaining > 0 then
    new_status := 'active';
  elsif lot_age >= 45 and all_remaining >= lot_record.low_stock_threshold then
    new_status := 'dead_stock';
  else
    new_status := 'arrived';
  end if;

  update public.business_lots
  set status = new_status
  where id = lot_record.id;

  return new;
end;
$$ language plpgsql;

-- Trigger for recalculating lot status after order insert/update
create trigger lot_status_after_order
after insert or update on business_orders
for each row
execute function public.recalculate_lot_status();

-- Function: deduct_stock_on_order
create or replace function public.deduct_stock_on_order()
returns trigger as $$
declare
  lot_record business_lots%rowtype;
  top_component business_lot_components%rowtype;
  bottom_component business_lot_components%rowtype;
  dupatta_component business_lot_components%rowtype;
begin
  select * into lot_record from business_lots where id = new.lot_id;

  -- Deduct top component
  select * into top_component from business_lot_components
  where lot_id = lot_record.id and component = 'top';
  if top_component.id is not null then
    update business_lot_components
    set sold_metres = sold_metres + (new.top_metres * new.colours)
    where id = top_component.id;
  end if;

  -- Deduct bottom component
  select * into bottom_component from business_lot_components
  where lot_id = lot_record.id and component = 'bottom';
  if bottom_component.id is not null then
    update business_lot_components
    set sold_metres = sold_metres + (new.bottom_metres * new.colours)
    where id = bottom_component.id;
  end if;

  -- Deduct dupatta component
  select * into dupatta_component from business_lot_components
  where lot_id = lot_record.id and component = 'dupatta';
  if dupatta_component.id is not null then
    update business_lot_components
    set sold_metres = sold_metres + (new.dupatta_metres * new.colours)
    where id = dupatta_component.id;
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger for deducting stock on order insert
create trigger stock_deduct_after_order
after insert on business_orders
for each row
execute function public.deduct_stock_on_order();

-- Function: refresh_overdue_statuses
create or replace function public.refresh_overdue_statuses()
returns void as $$
begin
  update business_orders
  set status = 'overdue'
  where status = 'pending'
    and due_date < current_date;
end;
$$ language plpgsql;

-- Note: The refresh_overdue_statuses function is to be called via an API route on app load,
-- not as a trigger. We'll create an API route for it later.