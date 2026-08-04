-- Backs the Party Group screen (app/party-group/index.tsx), which already
-- queries these tables but they never existed — every load/create/invite was
-- silently failing (Supabase returns an error, the screen just treats it as
-- "no group yet").

create table if not exists public.party_groups (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  name text not null default 'My Party Group',
  invite_code text not null unique,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (event_id)
);

alter table public.party_groups enable row level security;

create policy "Party groups are viewable by everyone"
  on public.party_groups for select
  using (true);

create policy "Authenticated users can create party groups"
  on public.party_groups for insert
  with check (auth.uid() = created_by);

create table if not exists public.party_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.party_groups (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  username text not null,
  avatar_url text,
  status text not null default 'invited' check (status in ('invited', 'joined')),
  created_at timestamptz not null default now()
);

alter table public.party_group_members enable row level security;

create policy "Party group members are viewable by everyone"
  on public.party_group_members for select
  using (true);

create policy "Authenticated users can add party group members"
  on public.party_group_members for insert
  with check (auth.role() = 'authenticated');
