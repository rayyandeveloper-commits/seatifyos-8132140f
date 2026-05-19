
-- CABINS
create table public.cabins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  number int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, number)
);
alter table public.cabins enable row level security;
create policy "owner reads own cabins" on public.cabins for select to authenticated using (owner_id = auth.uid());
create policy "owner inserts own cabins" on public.cabins for insert to authenticated with check (owner_id = auth.uid());
create policy "owner updates own cabins" on public.cabins for update to authenticated using (owner_id = auth.uid());
create policy "owner deletes own cabins" on public.cabins for delete to authenticated using (owner_id = auth.uid());

-- STUDENTS
create table public.students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  cabin_id uuid references public.cabins(id) on delete set null,
  assigned_date date,
  due_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.students enable row level security;
create policy "owner reads own students" on public.students for select to authenticated using (owner_id = auth.uid());
create policy "owner inserts own students" on public.students for insert to authenticated with check (owner_id = auth.uid());
create policy "owner updates own students" on public.students for update to authenticated using (owner_id = auth.uid());
create policy "owner deletes own students" on public.students for delete to authenticated using (owner_id = auth.uid());
create index students_cabin_idx on public.students(cabin_id);
create index students_owner_idx on public.students(owner_id);

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null,         -- 'due_today' | 'overdue' | 'manual' | 'info'
  message text not null,
  student_id uuid references public.students(id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "owner reads own notifs" on public.notifications for select to authenticated using (owner_id = auth.uid());
create policy "owner inserts own notifs" on public.notifications for insert to authenticated with check (owner_id = auth.uid());
create policy "owner updates own notifs" on public.notifications for update to authenticated using (owner_id = auth.uid());
create policy "owner deletes own notifs" on public.notifications for delete to authenticated using (owner_id = auth.uid());
create index notifications_owner_idx on public.notifications(owner_id, created_at desc);

-- SETTINGS (one row per owner)
create table public.app_settings (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  library_name text not null default 'The Reading Lodge',
  whatsapp_number text,
  reminder_template text not null default 'Hello {name}, your seat subscription at The Reading Lodge is due {when}. Please renew to continue uninterrupted access.',
  opening_time text default '06:00',
  closing_time text default '23:00',
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
create policy "owner reads own settings" on public.app_settings for select to authenticated using (owner_id = auth.uid());
create policy "owner inserts own settings" on public.app_settings for insert to authenticated with check (owner_id = auth.uid());
create policy "owner updates own settings" on public.app_settings for update to authenticated using (owner_id = auth.uid());

-- updated_at trigger
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger trg_cabins_touch before update on public.cabins for each row execute function public.touch_updated_at();
create trigger trg_students_touch before update on public.students for each row execute function public.touch_updated_at();
create trigger trg_settings_touch before update on public.app_settings for each row execute function public.touch_updated_at();

-- Daily job: generate due notifications. Inserts a notification per (student, day, type).
create extension if not exists pg_cron;

create or replace function public.generate_due_notifications()
returns void language plpgsql security definer set search_path = public as $$
begin
  -- due today
  insert into public.notifications (owner_id, type, message, student_id)
  select s.owner_id,
         'due_today',
         'Renewal due today for ' || s.name || ' (Cabin ' || coalesce(c.number::text,'—') || ')',
         s.id
  from public.students s
  left join public.cabins c on c.id = s.cabin_id
  where s.due_date = current_date
    and not exists (
      select 1 from public.notifications n
      where n.student_id = s.id and n.type = 'due_today'
        and n.created_at::date = current_date
    );

  -- overdue (yesterday and earlier, log once per day)
  insert into public.notifications (owner_id, type, message, student_id)
  select s.owner_id,
         'overdue',
         'OVERDUE: ' || s.name || ' (Cabin ' || coalesce(c.number::text,'—') || ') — due ' || s.due_date,
         s.id
  from public.students s
  left join public.cabins c on c.id = s.cabin_id
  where s.due_date < current_date
    and not exists (
      select 1 from public.notifications n
      where n.student_id = s.id and n.type = 'overdue'
        and n.created_at::date = current_date
    );
end;
$$;

select cron.schedule(
  'reading-lodge-daily-due-check',
  '0 8 * * *',
  $$ select public.generate_due_notifications(); $$
);
