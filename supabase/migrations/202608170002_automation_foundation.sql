create table if not exists public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  owner_id uuid not null references auth.users(id) on delete cascade default auth.uid(),
  key text not null,
  title text not null,
  description text not null default '',
  trigger_type text not null check (
    trigger_type in ('lead_created', 'lead_status_changed', 'lead_unanswered', 'appointment_upcoming')
  ),
  trigger_label text not null,
  action_type text not null check (
    action_type in ('in_app', 'telegram', 'email', 'owner_reminder')
  ),
  action_label text not null,
  delay_minutes integer not null default 0 check (delay_minutes >= 0),
  enabled boolean not null default false,
  requires_integration boolean not null default false,
  unique (owner_id, key)
);

create table if not exists public.automation_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  rule_id uuid not null references public.automation_rules(id) on delete cascade,
  lead_id text references public.leads(id) on delete cascade,
  status text not null check (status in ('success', 'pending', 'failed', 'skipped')),
  title text not null,
  detail text not null default '',
  error_message text not null default '',
  is_test boolean not null default false,
  dedupe_key text,
  unique (owner_id, dedupe_key)
);

create index if not exists automation_events_created_at_idx
on public.automation_events(owner_id, created_at desc);

create index if not exists automation_events_rule_id_idx
on public.automation_events(rule_id, created_at desc);

alter table public.automation_rules enable row level security;
alter table public.automation_events enable row level security;

grant select, insert, update on table public.automation_rules to authenticated;
grant select on table public.automation_events to authenticated;

drop policy if exists "Owners can read automation rules" on public.automation_rules;
create policy "Owners can read automation rules"
on public.automation_rules for select
to authenticated
using (owner_id = auth.uid());

drop policy if exists "Owners can create automation rules" on public.automation_rules;
create policy "Owners can create automation rules"
on public.automation_rules for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "Owners can update automation rules" on public.automation_rules;
create policy "Owners can update automation rules"
on public.automation_rules for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Owners can read automation events" on public.automation_events;
create policy "Owners can read automation events"
on public.automation_events for select
to authenticated
using (owner_id = auth.uid());

create or replace function public.initialize_automation_rules()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  insert into public.automation_rules (
    owner_id, key, title, description, trigger_type, trigger_label, action_type,
    action_label, delay_minutes, enabled, requires_integration
  )
  values
    (
      auth.uid(), 'lead-created-notification', 'New lead alert',
      'Notify the workspace as soon as a website request arrives.',
      'lead_created', 'Lead created', 'in_app', 'In-app notification', 0, true, false
    ),
    (
      auth.uid(), 'status-change-notification', 'Status change alert',
      'Keep the activity feed synchronized with pipeline changes.',
      'lead_status_changed', 'Status changes', 'in_app', 'In-app notification', 0, true, false
    ),
    (
      auth.uid(), 'new-lead-telegram', 'Telegram notification',
      'Send the request details to the service team in Telegram.',
      'lead_created', 'Lead created', 'telegram', 'Telegram message', 0, false, true
    ),
    (
      auth.uid(), 'client-confirmation-email', 'Client confirmation',
      'Email the client a confirmation with the request reference.',
      'lead_created', 'Lead created', 'email', 'Confirmation email', 0, false, true
    ),
    (
      auth.uid(), 'response-reminder', 'Response reminder',
      'Flag new leads that have not been contacted within 30 minutes.',
      'lead_unanswered', '30 min without update', 'owner_reminder', 'Owner reminder', 30, false, false
    )
  on conflict (owner_id, key) do nothing;
end;
$$;

revoke all on function public.initialize_automation_rules() from public;
grant execute on function public.initialize_automation_rules() to authenticated;

create or replace function public.test_automation_rule(target_rule_id uuid)
returns public.automation_events
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_rule public.automation_rules;
  created_event public.automation_events;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  select * into selected_rule
  from public.automation_rules
  where id = target_rule_id and owner_id = auth.uid();

  if not found then
    raise exception 'Automation rule was not found';
  end if;

  if not selected_rule.enabled then
    raise exception 'Enable the automation rule before testing it';
  end if;

  insert into public.automation_events (
    owner_id, rule_id, status, title, detail, is_test
  )
  values (
    auth.uid(),
    selected_rule.id,
    case when selected_rule.requires_integration then 'skipped' else 'success' end,
    selected_rule.title || ' test ' ||
      case when selected_rule.requires_integration then 'skipped' else 'completed' end,
    case
      when selected_rule.requires_integration
        then 'A real request and configured integration are required for delivery.'
      else 'The rule condition and action are ready.'
    end,
    true
  )
  returning * into created_event;

  return created_event;
end;
$$;

revoke all on function public.test_automation_rule(uuid) from public;
grant execute on function public.test_automation_rule(uuid) to authenticated;

create or replace function public.process_due_automations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_rule public.automation_rules;
  lead_record public.leads;
  processed_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  select * into selected_rule
  from public.automation_rules
  where owner_id = auth.uid() and key = 'response-reminder' and enabled;

  if not found then
    return 0;
  end if;

  for lead_record in
    select lead.*
    from public.leads as lead
    where lead.status = 'new'
      and lead.created_at <= now() - make_interval(mins => selected_rule.delay_minutes)
      and not exists (
        select 1
        from public.automation_events as event
        where event.owner_id = auth.uid()
          and event.rule_id = selected_rule.id
          and event.lead_id = lead.id
          and not event.is_test
      )
  loop
    insert into public.notifications (lead_id, title, message, tone, recipient_id)
    values (
      lead_record.id,
      'Response reminder',
      lead_record.client_name || ' · ' || selected_rule.delay_minutes || ' min without response',
      'amber',
      auth.uid()
    );

    insert into public.automation_events (
      owner_id, rule_id, lead_id, status, title, detail, dedupe_key
    )
    values (
      auth.uid(), selected_rule.id, lead_record.id, 'success',
      selected_rule.title || ' completed',
      lead_record.client_name || ' · ' || lead_record.id,
      selected_rule.key || ':' || lead_record.id
    );

    processed_count := processed_count + 1;
  end loop;

  return processed_count;
end;
$$;

revoke all on function public.process_due_automations() from public;
grant execute on function public.process_due_automations() to authenticated;

create or replace function public.create_lead_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_rule public.automation_rules;
begin
  if tg_op = 'INSERT' then
    for selected_rule in
      select * from public.automation_rules
      where key = 'lead-created-notification' and enabled
    loop
      insert into public.notifications (lead_id, title, message, tone, recipient_id)
      values (
        new.id,
        case when new.urgency = 'Urgent' then 'Urgent lead received' else 'New lead received' end,
        new.client_name || ' · ' || new.service_type,
        case when new.urgency = 'Urgent' then 'amber' else 'blue' end,
        selected_rule.owner_id
      );

      insert into public.automation_events (
        owner_id, rule_id, lead_id, status, title, detail, dedupe_key
      )
      values (
        selected_rule.owner_id, selected_rule.id, new.id, 'success',
        selected_rule.title || ' completed', new.client_name || ' · ' || new.id,
        selected_rule.key || ':' || new.id
      )
      on conflict (owner_id, dedupe_key) do nothing;
    end loop;
    return new;
  end if;

  if new.status is distinct from old.status then
    for selected_rule in
      select * from public.automation_rules
      where key = 'status-change-notification' and enabled
    loop
      insert into public.notifications (lead_id, title, message, tone, recipient_id)
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
        end,
        selected_rule.owner_id
      );

      insert into public.automation_events (
        owner_id, rule_id, lead_id, status, title, detail, dedupe_key
      )
      values (
        selected_rule.owner_id, selected_rule.id, new.id, 'success',
        selected_rule.title || ' completed', new.client_name || ' · ' || new.status,
        selected_rule.key || ':' || new.id || ':' || new.status || ':' ||
          floor(extract(epoch from now()))::text
      )
      on conflict (owner_id, dedupe_key) do nothing;
    end loop;
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

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'automation_rules'
  ) then
    alter publication supabase_realtime add table public.automation_rules;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'automation_events'
  ) then
    alter publication supabase_realtime add table public.automation_events;
  end if;
end;
$$;
