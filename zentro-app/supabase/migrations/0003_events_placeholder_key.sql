-- Lets the Home screen's placeholder/mock event cards (shown only while the
-- events table is empty) turn into real event rows the first time a user
-- taps into one. `placeholder_key` stores the client-side mock id (e.g.
-- "mock-u1") so the hydration upsert is idempotent — tapping the same
-- placeholder twice reuses the same real row instead of duplicating it.

alter table public.events
  add column if not exists placeholder_key text unique;

create policy "Authenticated users can create events"
  on public.events for insert
  with check (auth.uid() is not null);
