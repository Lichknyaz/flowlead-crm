alter table public.automation_events
add column if not exists attempt_count integer not null default 0 check (attempt_count >= 0),
add column if not exists last_attempt_at timestamptz,
add column if not exists provider_message_id text;

create or replace function public.queue_telegram_automation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_rule public.automation_rules;
begin
  for selected_rule in
    select * from public.automation_rules
    where key = 'new-lead-telegram' and enabled
  loop
    insert into public.automation_events (
      owner_id, rule_id, lead_id, status, title, detail, dedupe_key
    )
    values (
      selected_rule.owner_id,
      selected_rule.id,
      new.id,
      'pending',
      selected_rule.title || ' queued',
      new.id,
      selected_rule.key || ':' || new.id
    )
    on conflict (owner_id, dedupe_key) do nothing;
  end loop;

  return new;
end;
$$;

drop trigger if exists leads_queue_telegram_automation on public.leads;
create trigger leads_queue_telegram_automation
after insert on public.leads
for each row execute function public.queue_telegram_automation();
