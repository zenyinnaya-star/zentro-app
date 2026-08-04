-- `events.attendee_count` was a static number that ticket purchases never
-- updated, and there was no way to mark an event sold out — Buy Ticket would
-- happily oversell forever. This adds a capacity ceiling (null = unlimited)
-- and enforces it in the database (not just the client) so concurrent
-- purchases can't race past it.

alter table public.events
  add column if not exists capacity int;

create or replace function public.handle_ticket_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count int;
begin
  update public.events
  set attendee_count = attendee_count + new.quantity
  where id = new.event_id
    and (capacity is null or attendee_count + new.quantity <= capacity)
  returning attendee_count into updated_count;

  if updated_count is null then
    raise exception 'SOLD_OUT: not enough tickets remaining for this event';
  end if;

  return new;
end;
$$;

drop trigger if exists on_ticket_insert_capacity on public.tickets;

create trigger on_ticket_insert_capacity
  before insert on public.tickets
  for each row execute function public.handle_ticket_capacity();
