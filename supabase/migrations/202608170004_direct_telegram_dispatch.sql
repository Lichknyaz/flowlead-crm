create or replace function public.dispatch_telegram_automation()
returns trigger
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  project_url text;
  webhook_secret text;
begin
  if not exists (
    select 1
    from public.automation_events
    where lead_id = new.id
      and status = 'pending'
      and dedupe_key like 'new-lead-telegram:%'
  ) then
    return new;
  end if;

  if to_regclass('vault.decrypted_secrets') is null then
    update public.automation_events
    set
      status = 'failed',
      title = 'Telegram delivery failed',
      error_message = 'Supabase Vault is not configured for Telegram delivery',
      attempt_count = attempt_count + 1,
      last_attempt_at = now()
    where lead_id = new.id
      and status = 'pending'
      and dedupe_key like 'new-lead-telegram:%';
    return new;
  end if;

  select decrypted_secret into project_url
  from vault.decrypted_secrets
  where name = 'flowlead_project_url';

  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'flowlead_webhook_secret';

  if coalesce(project_url, '') = '' or coalesce(webhook_secret, '') = '' then
    update public.automation_events
    set
      status = 'failed',
      title = 'Telegram delivery failed',
      error_message = 'Telegram dispatch secrets are missing from Supabase Vault',
      attempt_count = attempt_count + 1,
      last_attempt_at = now()
    where lead_id = new.id
      and status = 'pending'
      and dedupe_key like 'new-lead-telegram:%';
    return new;
  end if;

  perform net.http_post(
    url := rtrim(project_url, '/') || '/functions/v1/notify-new-lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-flowlead-webhook-secret', webhook_secret
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', tg_table_name,
      'schema', tg_table_schema,
      'record', jsonb_build_object(
        'id', new.id,
        'service_type', new.service_type,
        'urgency', new.urgency
      )
    ),
    timeout_milliseconds := 10000
  );

  return new;
exception
  when others then
    update public.automation_events
    set
      status = 'failed',
      title = 'Telegram delivery failed',
      error_message = left(sqlerrm, 500),
      attempt_count = attempt_count + 1,
      last_attempt_at = now()
    where lead_id = new.id
      and status = 'pending'
      and dedupe_key like 'new-lead-telegram:%';
    return new;
end;
$$;

revoke all on function public.dispatch_telegram_automation() from public;

drop trigger if exists leads_z_dispatch_telegram_automation on public.leads;
create trigger leads_z_dispatch_telegram_automation
after insert on public.leads
for each row execute function public.dispatch_telegram_automation();
