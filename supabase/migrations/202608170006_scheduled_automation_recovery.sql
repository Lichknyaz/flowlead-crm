create extension if not exists pg_cron;

create or replace function public.initialize_scheduled_automation_rules()
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
  values (
    auth.uid(), 'appointment-reminder', 'Appointment reminder',
    'Remind the workspace before a scheduled service visit.',
    'appointment_upcoming', '24 hours before a visit', 'owner_reminder', 'Owner reminder', 1440, false, false
  )
  on conflict (owner_id, key) do nothing;
end;
$$;

revoke all on function public.initialize_scheduled_automation_rules() from public;
grant execute on function public.initialize_scheduled_automation_rules() to authenticated;

insert into public.automation_rules (
  owner_id, key, title, description, trigger_type, trigger_label, action_type,
  action_label, delay_minutes, enabled, requires_integration
)
select distinct
  owner_id, 'appointment-reminder', 'Appointment reminder',
  'Remind the workspace before a scheduled service visit.',
  'appointment_upcoming', '24 hours before a visit', 'owner_reminder', 'Owner reminder', 1440, false, false
from public.automation_rules
on conflict (owner_id, key) do nothing;

create or replace function public.run_scheduled_automations()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  selected_rule public.automation_rules;
  lead_record public.leads;
  appointment_record public.appointments;
  telegram_event record;
  project_url text;
  webhook_secret text;
  processed_count integer := 0;
begin
  for selected_rule in
    select * from public.automation_rules
    where key = 'response-reminder' and enabled
  loop
    for lead_record in
      select lead.*
      from public.leads as lead
      where lead.status = 'new'
        and lead.created_at <= now() - make_interval(mins => selected_rule.delay_minutes)
        and not exists (
          select 1
          from public.automation_events as event
          where event.owner_id = selected_rule.owner_id
            and event.rule_id = selected_rule.id
            and event.dedupe_key = selected_rule.key || ':' || lead.id
        )
    loop
      insert into public.notifications (lead_id, title, message, tone, recipient_id)
      values (
        lead_record.id,
        'Response reminder',
        lead_record.id || ' has not been updated for ' || selected_rule.delay_minutes || ' minutes.',
        'amber',
        selected_rule.owner_id
      );

      insert into public.automation_events (
        owner_id, rule_id, lead_id, status, title, detail, dedupe_key
      )
      values (
        selected_rule.owner_id, selected_rule.id, lead_record.id, 'success',
        selected_rule.title || ' completed', lead_record.id,
        selected_rule.key || ':' || lead_record.id
      );

      processed_count := processed_count + 1;
    end loop;
  end loop;

  for selected_rule in
    select * from public.automation_rules
    where key = 'appointment-reminder' and enabled
  loop
    for appointment_record in
      select appointment.*
      from public.appointments as appointment
      where appointment.created_by = selected_rule.owner_id
        and appointment.status = 'scheduled'
        and appointment.starts_at > now()
        and appointment.starts_at <= now() + make_interval(mins => selected_rule.delay_minutes)
        and not exists (
          select 1
          from public.automation_events as event
          where event.owner_id = selected_rule.owner_id
            and event.rule_id = selected_rule.id
            and event.dedupe_key = selected_rule.key || ':' || appointment.id || ':' ||
              floor(extract(epoch from appointment.starts_at))::text
        )
    loop
      insert into public.notifications (lead_id, title, message, tone, recipient_id)
      values (
        appointment_record.lead_id,
        'Appointment reminder',
        appointment_record.title || ' · ' || appointment_record.lead_id || ' is due within 24 hours.',
        'blue',
        selected_rule.owner_id
      );

      insert into public.automation_events (
        owner_id, rule_id, lead_id, status, title, detail, dedupe_key
      )
      values (
        selected_rule.owner_id, selected_rule.id, appointment_record.lead_id, 'success',
        selected_rule.title || ' completed', appointment_record.lead_id,
        selected_rule.key || ':' || appointment_record.id || ':' ||
          floor(extract(epoch from appointment_record.starts_at))::text
      );

      processed_count := processed_count + 1;
    end loop;
  end loop;

  begin
    select decrypted_secret into project_url
    from vault.decrypted_secrets
    where name = 'flowlead_project_url';

    select decrypted_secret into webhook_secret
    from vault.decrypted_secrets
    where name = 'flowlead_webhook_secret';

    if coalesce(project_url, '') <> '' and coalesce(webhook_secret, '') <> '' then
      for telegram_event in
        select event.id, event.lead_id, lead.service_type, lead.urgency
        from public.automation_events as event
        join public.automation_rules as rule on rule.id = event.rule_id
        join public.leads as lead on lead.id = event.lead_id
        where event.status = 'pending'
          and event.is_test = false
          and event.attempt_count = 0
          and event.created_at <= now() - interval '10 minutes'
          and rule.key = 'new-lead-telegram'
          and rule.enabled
        order by event.created_at
        limit 25
      loop
        update public.automation_events
        set
          attempt_count = 1,
          last_attempt_at = now(),
          title = 'Telegram delivery recovery started',
          detail = telegram_event.lead_id
        where id = telegram_event.id and status = 'pending' and attempt_count = 0;

        if found then
          perform net.http_post(
            url := rtrim(project_url, '/') || '/functions/v1/notify-new-lead',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'x-flowlead-webhook-secret', webhook_secret
            ),
            body := jsonb_build_object(
              'type', 'INSERT',
              'table', 'leads',
              'schema', 'public',
              'record', jsonb_build_object(
                'id', telegram_event.lead_id,
                'service_type', telegram_event.service_type,
                'urgency', telegram_event.urgency
              )
            ),
            timeout_milliseconds := 10000
          );
          processed_count := processed_count + 1;
        end if;
      end loop;
    end if;
  exception
    when others then
      raise warning 'Scheduled Telegram recovery could not dispatch: %', sqlerrm;
  end;

  update public.automation_events as event
  set
    status = 'failed',
    title = 'Telegram delivery timed out',
    error_message = 'No delivery completion was received. Use Retry from the CRM event log.',
    last_attempt_at = now()
  from public.automation_rules as rule
  where event.rule_id = rule.id
    and event.status = 'pending'
    and event.is_test = false
    and event.attempt_count > 0
    and event.last_attempt_at <= now() - interval '15 minutes'
    and rule.key = 'new-lead-telegram';

  return processed_count;
end;
$$;

revoke all on function public.run_scheduled_automations() from public;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname = 'flowlead-scheduled-automations';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'flowlead-scheduled-automations',
    '*/5 * * * *',
    'select public.run_scheduled_automations();'
  );
end;
$$;
