-- Business module schema for Imperium
-- Created: 2026-09-13

-- Drop existing tables if re-running
drop table if exists business_morning_briefings;
drop table if exists business_conversations;
drop table if exists business_rates;
drop table if exists business_payments;
drop table if exists business_order_items;
drop table if exists business_orders;
drop table if exists business_parties;
drop table if exists business_lot_components;
drop table if exists business_lots;

-- Lots: Each fabric roll you buy/trade
create table public.business_lots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_name text not null,
  design_no text not null,
  design_photo_url text,
  date_arrived date not null default current_date,
  top_metres numeric not null default 0,
  bottom_metres numeric not null default 0,
  dupatta_metres numeric not null default 0,
  top_colour_count integer not null default 0,
  bottom_colour_count integer not null default 0,
  dupatta_colour_count integer not null default 0,
  top_remaining numeric not null default 0,
  bottom_remaining numeric not null default 0,
  dupatta_remaining numeric not null default 0,
  opening_top numeric not null default 0,
  opening_bottom numeric not null default 0,
  opening_dupatta numeric not null default 0,
  low_stock_threshold numeric not null default 0.1,
  notes text,
  created_at timestamp with time zone default now()
);

-- Lot components for tracking individual colour batches
create table business_lot_components (
  id uuid primary key default gen_random_uuid(),
  lot_id uuid references business_lots(id) on delete cascade,
  component_type text not null check (component_type in ('top', 'bottom', 'dupatta')),
  colour_name text not null,
  colour_metre numeric not null,
  colour_price numeric not null default 0,
  unique key (lot_id, component_type, colour_name)
);

-- Parties: Customers and suppliers
create table public.business_parties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  party_name text not null,
  city text,
  contact_person text,
  phone text,
  email text,
  address text,
  default_payment_terms integer default 30,
  default_gst text default 'GSTIN',
  default_cash_discount numeric default 0,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);

-- Orders: Invoices/sales
create table public.business_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  party_id uuid not null references business_parties(id),
  order_date date not null default current_date,
  due_date date not null,
  total_metre numeric not null default 0,
  total_amount numeric not null default 0,
  discount_percent numeric default 0,
  gst_percent numeric default 0,
  cash_discount_percent numeric default 0,
  amount_received numeric default 0,
  status text not null default 'pending' check (status in ('pending', 'partially_paid', 'paid', 'cancelled')),
  invoice_number text,
  notes text,
  created_at timestamp with time zone default now()
);

-- Order items: Each line item in an order
create table public.business_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references business_orders(id) on delete cascade,
  lot_id uuid references business_lots(id),
  item_name text not null,
  design_no text not null,
  top_metre numeric not null default 0,
  bottom_metre numeric not null default 0,
  dupatta_metre numeric not null default 0,
  colour_name text,
  metre numeric not null default 0,
  price_per_metre numeric not null default 0,
  amount numeric not null default 0,
  unique key (order_id, lot_id)
);

-- Payments: Money received
create table public.business_payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references business_orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric not null default 0,
  payment_method text not null check (payment_method in ('cash', 'bank_transfer', 'online')),
  reference_number text,
  notes text,
  created_at timestamp with time zone default now()
);

-- Rate cards: Pricing per party/item
create table public.business_rates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  party_id uuid not null references business_parties(id),
  item_name text not null,
  design_no text not null,
  price_per_metre numeric not null default 0,
  is_default boolean default false,
  created_at timestamp with time zone default now(),
  unique key (party_id, item_name, design_no)
);

-- AI conversations: Business mentor chat history
create table public.business_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  mode text not null default 'chat' check (mode in ('chat', 'morning_briefing', 'pre_visit_brief', 'post_day')),
  created_at timestamp with time zone default now()
);

-- Morning briefings: Daily AI summaries cached
create table public.business_morning_briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  briefing_date date not null,
  content jsonb not null,
  created_at timestamp with time zone default now(),
  unique (user_id, briefing_date)
);

-- RLS Policies
alter table business_lots enable row level security;
alter table business_lot_components enable row level security;
alter table business_parties enable row level security;
alter table business_orders enable row level security;
alter table business_order_items enable row level security;
alter table business_payments enable row level security;
alter table business_rates enable row level security;
alter table business_conversations enable row level security;
alter table business_morning_briefings enable row level security;

-- RLS Policy: user can only see their own data
create policy "user can view own lots" on business_lots for select using (user_id = auth.uid());
create policy "user can insert own lots" on business_lots for insert with check (user_id = auth.uid());
create policy "user can update own lots" on business_lots for update using (user_id = auth.uid());
create policy "user can delete own lots" on business_lots for delete using (user_id = auth.uid());

create policy "user can view own lot components" on business_lot_components for select using (
  lot_id in (select id from business_lots where user_id = auth.uid())
);
create policy "user can insert own lot components" on business_lot_components for insert with check (
  lot_id in (select id from business_lots where user_id = auth.uid())
);
create policy "user can update own lot components" on business_lot_components for update using (
  lot_id in (select id from business_lots where user_id = auth.uid())
);
create policy "user can delete own lot components" on business_lot_components for delete using (
  lot_id in (select id from business_lots where user_id = auth.uid())
);

create policy "user can view own parties" on business_parties for select using (user_id = auth.uid());
create policy "user can insert own parties" on business_parties for insert with check (user_id = auth.uid());
create policy "user can update own parties" on business_parties for update using (user_id = auth.uid());
create policy "user can delete own parties" on business_parties for delete using (user_id = auth.uid());

create policy "user can view own orders" on business_orders for select using (user_id = auth.uid());
create policy "user can insert own orders" on business_orders for insert with check (user_id = auth.uid());
create policy "user can update own orders" on business_orders for update using (user_id = auth.uid());
create policy "user can delete own orders" on business_orders for delete using (user_id = auth.uid());

create policy "user can view own order items" on business_order_items for select using (user_id = auth.uid());
create policy "user can insert own order items" on business_order_items for insert with check (user_id = auth.uid());
create policy "user can update own order items" on business_order_items for update using (user_id = auth.uid());
create policy "user can delete own order items" on business_order_items for delete using (user_id = auth.uid());

create policy "user can view own payments" on business_payments for select using (user_id = auth.uid());
create policy "user can insert own payments" on business_payments for insert with check (user_id = auth.uid());
create policy "user can update own payments" on business_payments for update using (user_id = auth.uid());
create policy "user can delete own payments" on business_payments for delete using (user_id = auth.uid());

create policy "user can view own rates" on business_rates for select using (user_id = auth.uid());
create policy "user can insert own rates" on business_rates for insert with check (user_id = auth.uid());
create policy "user can update own rates" on business_rates for update using (user_id = auth.uid());
create policy "user can delete own rates" on business_rates for delete using (user_id = auth.uid());

create policy "user can view own conversations" on business_conversations for select using (user_id = auth.uid());
create policy "user can insert own conversations" on business_conversations for insert with check (user_id = auth.uid());
create policy "user can update own conversations" on business_conversations for update using (user_id = auth.uid());
create policy "user can delete own conversations" on business_conversations for delete using (user_id = auth.uid());

create policy "user can view own briefings" on business_morning_briefings for select using (user_id = auth.uid());
create policy "user can insert own briefings" on business_morning_briefings for insert with check (user_id = auth.uid());
create policy "user can update own briefings" on business_morning_briefings for update using (user_id = auth.uid());
create policy "user can delete own briefings" on business_morning_briefings for delete using (user_id = auth.uid());

-- Indexes for common queries
create index business_lots_user_date_arrived_idx on business_lots(user_id, date_arrived desc);
create index business_lots_status_idx on business_lots(user_id, status);
create index business_parties_user_name_idx on business_parties(user_id, party_name);
create index business_orders_user_date_idx on business_orders(user_id, order_date desc);
create index business_orders_party_idx on business_orders(user_id, party_id);
create index business_order_items_order_idx on business_order_items(order_id);
create index business_payments_user_date_idx on business_payments(user_id, payment_date desc);
create index business_payments_order_idx on business_payments(order_id);
create index business_rates_party_item_idx on business_rates(party_id, item_name, design_no);