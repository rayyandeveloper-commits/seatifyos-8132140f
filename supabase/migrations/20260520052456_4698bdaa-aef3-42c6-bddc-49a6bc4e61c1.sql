
-- 1. cabins.name (alphanumeric)
alter table public.cabins add column if not exists name text;
update public.cabins set name = number::text where name is null;
alter table public.cabins alter column name set not null;
create unique index if not exists cabins_owner_name_uq on public.cabins(owner_id, name);
alter table public.cabins alter column number drop not null;

-- 2. students.whatsapp
alter table public.students add column if not exists whatsapp text;

-- 3. app_settings extras
alter table public.app_settings add column if not exists twilio_from text;
alter table public.app_settings add column if not exists reminder_hour integer not null default 9;
alter table public.app_settings alter column library_name set default 'Study Lounge OS';

-- 4. cabin_history (permanent)
create table if not exists public.cabin_history (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  cabin_id uuid,
  cabin_name text not null,
  student_id uuid,
  student_name text not null,
  phone text,
  whatsapp text,
  assigned_date date,
  due_date date,
  vacated_date date,
  status text not null default 'active', -- active | completed | transferred | expired
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists cabin_history_owner_idx on public.cabin_history(owner_id);
create index if not exists cabin_history_cabin_idx on public.cabin_history(cabin_id);
create index if not exists cabin_history_student_idx on public.cabin_history(student_id);
create index if not exists cabin_history_open_idx on public.cabin_history(cabin_id, status) where status = 'active';

alter table public.cabin_history enable row level security;

drop policy if exists "owner reads own history" on public.cabin_history;
create policy "owner reads own history" on public.cabin_history
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "owner inserts own history" on public.cabin_history;
create policy "owner inserts own history" on public.cabin_history
  for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "owner updates own history" on public.cabin_history;
create policy "owner updates own history" on public.cabin_history
  for update to authenticated using (owner_id = auth.uid());
-- NOTE: intentionally no DELETE policy — history is permanent.

create trigger cabin_history_touch
  before update on public.cabin_history
  for each row execute function public.touch_updated_at();

-- 5. reminder_logs
create table if not exists public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  student_id uuid,
  cabin_history_id uuid,
  channel text not null default 'whatsapp',
  status text not null, -- sent | failed | queued
  provider_sid text,
  error text,
  message text,
  sent_at timestamptz not null default now()
);
create index if not exists reminder_logs_owner_idx on public.reminder_logs(owner_id, sent_at desc);

alter table public.reminder_logs enable row level security;

drop policy if exists "owner reads own reminder logs" on public.reminder_logs;
create policy "owner reads own reminder logs" on public.reminder_logs
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "owner inserts own reminder logs" on public.reminder_logs;
create policy "owner inserts own reminder logs" on public.reminder_logs
  for insert to authenticated with check (owner_id = auth.uid());

-- 6. Cabin history sync trigger
create or replace function public.sync_cabin_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cabin_name text;
  v_prev_cabin_name text;
begin
  if tg_op = 'INSERT' then
    if new.cabin_id is not null then
      select name into v_cabin_name from public.cabins where id = new.cabin_id;
      insert into public.cabin_history(owner_id, cabin_id, cabin_name, student_id, student_name, phone, whatsapp, assigned_date, due_date, status)
      values (new.owner_id, new.cabin_id, coalesce(v_cabin_name, '?'), new.id, new.name, new.phone, new.whatsapp, new.assigned_date, new.due_date, 'active');
    end if;
    return new;

  elsif tg_op = 'UPDATE' then
    -- cabin transfer
    if coalesce(new.cabin_id::text,'') <> coalesce(old.cabin_id::text,'') then
      if old.cabin_id is not null then
        update public.cabin_history
          set vacated_date = current_date, status = 'transferred', updated_at = now()
          where student_id = old.id and cabin_id = old.cabin_id and status = 'active';
      end if;
      if new.cabin_id is not null then
        select name into v_cabin_name from public.cabins where id = new.cabin_id;
        insert into public.cabin_history(owner_id, cabin_id, cabin_name, student_id, student_name, phone, whatsapp, assigned_date, due_date, status)
        values (new.owner_id, new.cabin_id, coalesce(v_cabin_name,'?'), new.id, new.name, new.phone, new.whatsapp, new.assigned_date, new.due_date, 'active');
      end if;
    else
      -- renewal / detail change on the same cabin
      update public.cabin_history
        set due_date = new.due_date,
            assigned_date = coalesce(assigned_date, new.assigned_date),
            student_name = new.name,
            phone = new.phone,
            whatsapp = new.whatsapp,
            updated_at = now()
        where student_id = new.id and cabin_id = new.cabin_id and status = 'active';
    end if;
    return new;

  elsif tg_op = 'DELETE' then
    update public.cabin_history
      set vacated_date = current_date, status = 'completed', updated_at = now()
      where student_id = old.id and status = 'active';
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists students_history_sync on public.students;
create trigger students_history_sync
  after insert or update or delete on public.students
  for each row execute function public.sync_cabin_history();

-- Backfill: any current student with cabin_id but no open history → create one
insert into public.cabin_history(owner_id, cabin_id, cabin_name, student_id, student_name, phone, whatsapp, assigned_date, due_date, status)
select s.owner_id, s.cabin_id, c.name, s.id, s.name, s.phone, s.whatsapp, s.assigned_date, s.due_date, 'active'
from public.students s
join public.cabins c on c.id = s.cabin_id
where s.cabin_id is not null
  and not exists (
    select 1 from public.cabin_history h
    where h.student_id = s.id and h.cabin_id = s.cabin_id and h.status = 'active'
  );

-- 7. Mark long-overdue history as expired (helper run by cron)
create or replace function public.expire_overdue_history()
returns void
language sql
security definer
set search_path = public
as $$
  update public.cabin_history
    set status = 'expired', updated_at = now()
    where status = 'active' and due_date is not null and due_date < current_date - interval '30 days';
$$;

-- 8. pg_cron schedules
do $$ begin perform cron.unschedule('expire-overdue-history'); exception when others then null; end $$;
select cron.schedule(
  'expire-overdue-history',
  '5 0 * * *',
  $$ select public.expire_overdue_history(); $$
);

do $$ begin perform cron.unschedule('send-whatsapp-reminders'); exception when others then null; end $$;
select cron.schedule(
  'send-whatsapp-reminders',
  '0 9 * * *',
  $$
  select net.http_post(
    url := 'https://project--edc452a3-9465-4864-912a-79b65e6b63e9.lovable.app/api/public/hooks/send-reminders',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'apikey','eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuaHloenBya2Zldnl3bHhtZmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjYwNzgsImV4cCI6MjA5NDc0MjA3OH0.ptDCCO8tPLj6D2YI-wCRpIrO3vlX5techDG-lamuuBc'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 9. Enable realtime on notifications + cabin_history
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.cabin_history;
