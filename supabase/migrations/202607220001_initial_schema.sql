create sequence if not exists public.lead_reference_seq start with 1049;

create table if not exists public.leads (
  id text primary key default ('FL-' || lpad(nextval('public.lead_reference_seq')::text, 4, '0')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  client_name text not null check (char_length(client_name) >= 2),
  phone text not null default '',
  email text not null default '',
  service_type text not null,
  urgency text not null default 'Standard' check (urgency in ('Standard', 'Soon', 'Urgent')),
  location text not null,
  preferred_date date,
  message text not null check (char_length(message) >= 12),
  status text not null default 'new' check (
    status in ('new', 'contacted', 'booked', 'in progress', 'completed', 'lost')
  ),
  notes text not null default '',
  assigned_user text not null default 'Unassigned',
  timeline jsonb not null default '[]'::jsonb,
  constraint lead_contact_required check (phone <> '' or email <> '')
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists leads_touch_updated_at on public.leads;
create trigger leads_touch_updated_at
before update on public.leads
for each row execute function public.touch_updated_at();

create or replace function public.append_lead_status_event()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  event_label text;
  event_tone text;
begin
  if new.status is distinct from old.status then
    event_label := case new.status
      when 'new' then 'Marked as new'
      when 'contacted' then 'Client contacted'
      when 'booked' then 'Visit booked'
      when 'in progress' then 'Work started'
      when 'completed' then 'Job completed'
      else 'Lead closed'
    end;
    event_tone := case
      when new.status = 'completed' then 'green'
      when new.status = 'lost' then 'gray'
      else 'blue'
    end;
    new.timeline := coalesce(new.timeline, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'label', event_label,
        'detail', 'Status updated in FlowLead CRM',
        'timestamp', 'Just now',
        'tone', event_tone
      )
    );
  end if;
  return new;
end;
$$;

drop trigger if exists leads_append_status_event on public.leads;
create trigger leads_append_status_event
before update on public.leads
for each row execute function public.append_lead_status_event();

alter table public.leads enable row level security;

revoke all on table public.leads from anon;
grant select, update on table public.leads to authenticated;

drop policy if exists "Authenticated users can read leads" on public.leads;
create policy "Authenticated users can read leads"
on public.leads for select
to authenticated
using (true);

drop policy if exists "Authenticated users can update leads" on public.leads;
create policy "Authenticated users can update leads"
on public.leads for update
to authenticated
using (true)
with check (true);

create or replace function public.submit_lead(
  full_name text,
  contact_phone text,
  contact_email text,
  requested_service text,
  request_urgency text,
  service_location text,
  requested_date date,
  problem_message text
)
returns setof public.leads
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(trim(contact_phone), '') = '' and coalesce(trim(contact_email), '') = '' then
    raise exception 'A phone number or email is required';
  end if;

  return query
  insert into public.leads (
    client_name, phone, email, service_type, urgency, location, preferred_date, message, timeline
  ) values (
    trim(full_name),
    trim(coalesce(contact_phone, '')),
    trim(coalesce(contact_email, '')),
    requested_service,
    request_urgency,
    service_location,
    requested_date,
    problem_message,
    jsonb_build_array(
      jsonb_build_object(
        'id', gen_random_uuid()::text,
        'label', 'Request received',
        'detail', 'Website form submitted',
        'timestamp', 'Just now',
        'tone', 'blue'
      )
    )
  )
  returning *;
end;
$$;

revoke all on function public.submit_lead(text, text, text, text, text, text, date, text) from public;
grant execute on function public.submit_lead(text, text, text, text, text, text, date, text) to anon, authenticated;

insert into public.leads (
  id, created_at, client_name, phone, email, service_type, urgency, location,
  preferred_date, message, status, notes, assigned_user
) values
  ('FL-1048', '2026-07-22T08:42:00Z', 'Anna Novak', '+420 731 204 118', 'anna.novak@example.com', 'Plumbing repair', 'Urgent', 'Prague 6 — Dejvice', '2026-07-22', 'Water is leaking under the kitchen sink and needs attention today.', 'new', '', 'Unassigned'),
  ('FL-1047', '2026-07-22T07:18:00Z', 'Peter Svoboda', '+420 777 310 882', 'peter.s@example.com', 'Appliance installation', 'Standard', 'Prague 3 — Žižkov', '2026-07-25', 'New integrated dishwasher needs to be connected and checked.', 'contacted', 'Called at 09:30. Photos received by email.', 'Jakub M.'),
  ('FL-1046', '2026-07-21T14:25:00Z', 'Iryna Melnyk', '+420 608 195 447', 'iryna.m@example.com', 'Furniture assembly', 'Soon', 'Prague 7 — Holešovice', '2026-07-24', 'Assembly of two wardrobes and one desk from IKEA.', 'booked', 'Booked for Friday, 14:00.', 'Tomáš K.'),
  ('FL-1045', '2026-07-21T09:06:00Z', 'Martin Dvořák', '+420 602 883 741', 'martin.d@example.com', 'Electrical issue', 'Urgent', 'Prague 2 — Vinohrady', '2026-07-21', 'Several wall sockets stopped working after the breaker tripped.', 'in progress', 'Technician on site.', 'Jakub M.'),
  ('FL-1044', '2026-07-19T11:30:00Z', 'Olena Shevchenko', '+420 725 009 331', 'olena.s@example.com', 'Small renovation', 'Standard', 'Prague 4 — Nusle', '2026-07-20', 'Patch and repaint one bedroom wall after shelves were removed.', 'completed', 'Completed. Invoice sent and paid.', 'Tomáš K.'),
  ('FL-1043', '2026-07-18T13:40:00Z', 'David Brown', '+420 739 212 009', 'david.b@example.com', 'Emergency repair', 'Urgent', 'Prague 1 — Nové Město', '2026-07-18', 'Front door lock is jammed and cannot be secured.', 'lost', 'Client found an emergency locksmith.', 'Jakub M.')
on conflict (id) do nothing;

select setval('public.lead_reference_seq', greatest(1048, (select count(*) + 1042 from public.leads)));
