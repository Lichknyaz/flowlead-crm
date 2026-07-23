drop function if exists public.submit_lead(text, text, text, text, text, text, date, text);

create function public.submit_lead(
  full_name text,
  contact_phone text,
  contact_email text,
  requested_service text,
  request_urgency text,
  service_location text,
  requested_date date,
  problem_message text,
  submission_source text default 'website'
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

  if submission_source not in ('website', 'crm') then
    raise exception 'Invalid submission source';
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
        'detail', case
          when submission_source = 'crm' then 'Created manually in CRM'
          else 'Website form submitted'
        end,
        'timestamp', 'Just now',
        'tone', 'blue'
      )
    )
  )
  returning *;
end;
$$;

revoke all on function public.submit_lead(text, text, text, text, text, text, date, text, text) from public;
grant execute on function public.submit_lead(text, text, text, text, text, text, date, text, text) to anon, authenticated;
