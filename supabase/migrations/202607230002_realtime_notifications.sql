create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id text not null references public.leads(id) on delete cascade,
  title text not null,
  message text not null,
  tone text not null default 'blue' check (tone in ('blue', 'green', 'amber', 'gray')),
  recipient_id uuid references auth.users(id) on delete cascade
);

create index if not exists notifications_created_at_idx
on public.notifications(created_at desc);

create index if not exists notifications_recipient_idx
on public.notifications(recipient_id, created_at desc);

create table if not exists public.notification_reads (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  read_at timestamptz not null default now(),
  primary key (notification_id, user_id)
);

alter table public.notifications enable row level security;
alter table public.notification_reads enable row level security;

grant select on table public.notifications to authenticated;
grant select, insert on table public.notification_reads to authenticated;

drop policy if exists "Users can read workspace notifications" on public.notifications;
create policy "Users can read workspace notifications"
on public.notifications for select
to authenticated
using (recipient_id is null or recipient_id = auth.uid());

drop policy if exists "Users can read their notification state" on public.notification_reads;
create policy "Users can read their notification state"
on public.notification_reads for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can mark notifications read" on public.notification_reads;
create policy "Users can mark notifications read"
on public.notification_reads for insert
to authenticated
with check (user_id = auth.uid());

create or replace function public.mark_notifications_read(notification_ids uuid[])
returns void
language sql
security invoker
set search_path = public
as $$
  insert into public.notification_reads (notification_id, user_id)
  select notification_id, auth.uid()
  from unnest(notification_ids) as ids(notification_id)
  on conflict (notification_id, user_id) do nothing;
$$;

revoke all on function public.mark_notifications_read(uuid[]) from public;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

create or replace function public.create_lead_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.notifications (lead_id, title, message, tone)
    values (
      new.id,
      case when new.urgency = 'Urgent' then 'Urgent lead received' else 'New lead received' end,
      new.client_name || ' · ' || new.service_type,
      case when new.urgency = 'Urgent' then 'amber' else 'blue' end
    );
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.notifications (lead_id, title, message, tone)
    values (
      new.id,
      case new.status
        when 'contacted' then 'Client contacted'
        when 'booked' then 'Visit booked'
        when 'in progress' then 'Work started'
        when 'completed' then 'Job completed'
        when 'lost' then 'Lead closed'
        else 'Lead status updated'
      end,
      new.client_name || ' · ' || new.id,
      case
        when new.status = 'completed' then 'green'
        when new.status = 'lost' then 'gray'
        when new.status = 'booked' then 'amber'
        else 'blue'
      end
    );
  end if;

  if new.assigned_user is distinct from old.assigned_user and new.assigned_user <> 'Unassigned' then
    insert into public.notifications (lead_id, title, message, tone)
    values (new.id, 'Lead assigned', new.client_name || ' · ' || new.assigned_user, 'blue');
  end if;

  return new;
end;
$$;

drop trigger if exists leads_create_notification on public.leads;
create trigger leads_create_notification
after insert or update on public.leads
for each row execute function public.create_lead_notification();

insert into public.notifications (created_at, lead_id, title, message, tone)
select
  lead.created_at,
  lead.id,
  case when lead.urgency = 'Urgent' then 'Urgent lead received' else 'Lead received' end,
  lead.client_name || ' · ' || lead.service_type,
  case when lead.urgency = 'Urgent' then 'amber' else 'blue' end
from public.leads as lead
where not exists (
  select 1 from public.notifications as notification where notification.lead_id = lead.id
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'leads'
  ) then
    alter publication supabase_realtime add table public.leads;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
