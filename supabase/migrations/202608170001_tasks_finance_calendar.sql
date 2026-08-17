alter table public.leads
add column if not exists estimated_value numeric(12, 2) not null default 0
check (estimated_value >= 0);

alter table public.leads
add column if not exists final_value numeric(12, 2) not null default 0
check (final_value >= 0);

update public.leads set estimated_value = case id
  when 'FL-1048' then 4200
  when 'FL-1047' then 3500
  when 'FL-1046' then 6200
  when 'FL-1045' then 4800
  when 'FL-1044' then 14500
  when 'FL-1043' then 2800
  else estimated_value
end
where estimated_value = 0;

update public.leads set final_value = 15200
where id = 'FL-1044' and final_value = 0;

create table if not exists public.lead_tasks (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id text not null references public.leads(id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 3),
  due_at timestamptz not null,
  kind text not null default 'other' check (kind in ('call', 'follow-up', 'quote', 'other')),
  notes text not null default '',
  completed boolean not null default false,
  completed_at timestamptz,
  created_by uuid not null references auth.users(id) on delete cascade default auth.uid()
);

create index if not exists lead_tasks_due_at_idx on public.lead_tasks(due_at);
create index if not exists lead_tasks_lead_id_idx on public.lead_tasks(lead_id);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  lead_id text not null references public.leads(id) on delete cascade,
  title text not null check (char_length(trim(title)) >= 3),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  assigned_user text not null default 'Unassigned',
  notes text not null default '',
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_by uuid not null references auth.users(id) on delete cascade default auth.uid(),
  constraint appointment_time_valid check (ends_at > starts_at)
);

create index if not exists appointments_starts_at_idx on public.appointments(starts_at);
create index if not exists appointments_lead_id_idx on public.appointments(lead_id);

alter table public.lead_tasks enable row level security;
alter table public.appointments enable row level security;

grant select, insert, update, delete on table public.lead_tasks to authenticated;
grant select, insert, update, delete on table public.appointments to authenticated;

drop policy if exists "Users can read their lead tasks" on public.lead_tasks;
create policy "Users can read their lead tasks"
on public.lead_tasks for select
to authenticated
using (created_by = auth.uid());

drop policy if exists "Users can create their lead tasks" on public.lead_tasks;
create policy "Users can create their lead tasks"
on public.lead_tasks for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Users can update their lead tasks" on public.lead_tasks;
create policy "Users can update their lead tasks"
on public.lead_tasks for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "Users can delete their lead tasks" on public.lead_tasks;
create policy "Users can delete their lead tasks"
on public.lead_tasks for delete
to authenticated
using (created_by = auth.uid());

drop policy if exists "Users can read their appointments" on public.appointments;
create policy "Users can read their appointments"
on public.appointments for select
to authenticated
using (created_by = auth.uid());

drop policy if exists "Users can create their appointments" on public.appointments;
create policy "Users can create their appointments"
on public.appointments for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists "Users can update their appointments" on public.appointments;
create policy "Users can update their appointments"
on public.appointments for update
to authenticated
using (created_by = auth.uid())
with check (created_by = auth.uid());

drop policy if exists "Users can delete their appointments" on public.appointments;
create policy "Users can delete their appointments"
on public.appointments for delete
to authenticated
using (created_by = auth.uid());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lead_tasks'
  ) then
    alter publication supabase_realtime add table public.lead_tasks;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;
end;
$$;
