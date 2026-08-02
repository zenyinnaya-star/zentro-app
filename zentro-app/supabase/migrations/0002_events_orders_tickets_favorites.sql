-- Events, favorites, orders, tickets tables backing the Discovery/Booking flow
-- (Event Detail, Order Detail, Ticket Booked, View Ticket, Favourite, All Tickets).

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  location text not null,
  date timestamptz not null,
  price numeric(10,2) not null default 0,
  is_free boolean not null default false,
  category text,
  attendee_count int not null default 0,
  organizer_name text,
  organizer_avatar_url text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now()
);

alter table public.events enable row level security;

create policy "Events are viewable by everyone"
  on public.events for select
  using (true);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);

alter table public.favorites enable row level security;

create policy "Users can view their own favorites"
  on public.favorites for select
  using (auth.uid() = user_id);

create policy "Users can insert their own favorites"
  on public.favorites for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own favorites"
  on public.favorites for delete
  using (auth.uid() = user_id);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  quantity int not null default 1,
  promo_code text,
  payment_method text not null default 'card',
  subtotal numeric(10,2) not null,
  service_fee numeric(10,2) not null,
  total numeric(10,2) not null,
  status text not null default 'paid' check (status in ('paid', 'refunded', 'failed')),
  created_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Users can view their own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  event_id uuid not null references public.events (id) on delete cascade,
  event_title text not null,
  event_image_url text,
  event_location text not null,
  event_date timestamptz not null,
  quantity int not null default 1,
  holder_name text not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'completed', 'cancelled')),
  cancel_reason text,
  created_at timestamptz not null default now()
);

alter table public.tickets enable row level security;

create policy "Users can view their own tickets"
  on public.tickets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own tickets"
  on public.tickets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own tickets"
  on public.tickets for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
