-- LabLog — Supabase schema
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).
-- Safe to re-run: it uses IF NOT EXISTS / CREATE OR REPLACE where possible.

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- Helper: keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ===========================================================================
-- profiles
-- ===========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===========================================================================
-- daily_logs
-- ===========================================================================
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  focus text default '',
  tags text[] default '{}',
  worked_for text[] default '{}',
  images text[] default '{}',
  did text default '',
  progress text default '',
  files_touched text default '',
  blockers text default '',
  tried text default '',
  questions text default '',
  next_steps text default '',
  confidence text default 'steady',
  hours_on_task numeric default 0,
  manual_lab_hours_override numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists daily_logs_user_date_idx
  on public.daily_logs (user_id, date desc);

-- ===========================================================================
-- work_sessions
-- ===========================================================================
create table if not exists public.work_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  daily_log_id uuid not null references public.daily_logs (id) on delete cascade,
  time_in text default '',
  time_out text default '',
  break_minutes integer default 0,
  session_type text default 'lab',
  overnight boolean default false,
  notes text default '',
  calculated_hours numeric default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists work_sessions_log_idx
  on public.work_sessions (daily_log_id);

-- ===========================================================================
-- goals
-- ===========================================================================
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text default '',
  description text default '',
  status text default 'in_progress',
  priority text default 'medium',
  target_date date,
  current_milestone text default '',
  next_milestone text default '',
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists goals_user_idx on public.goals (user_id);

-- ===========================================================================
-- tasks
-- ===========================================================================
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text default '',
  description text default '',
  priority text default 'medium',
  status text default 'backlog',
  related_goal_id uuid references public.goals (id) on delete set null,
  due_date date,
  notes text default '',
  related_files text default '',
  question_for_cameron text default '',
  hours_spent numeric default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_user_idx on public.tasks (user_id);

-- ===========================================================================
-- blockers
-- ===========================================================================
create table if not exists public.blockers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text default '',
  context text default '',
  tried text default '',
  need_from_cameron text default '',
  urgency text default 'medium',
  related_task_id uuid references public.tasks (id) on delete set null,
  status text default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists blockers_user_idx on public.blockers (user_id);

-- ===========================================================================
-- file_issues
-- ===========================================================================
create table if not exists public.file_issues (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  project text default '',
  participant_id text default '',
  file_name text default '',
  issue_type text default 'needs_review',
  status text default 'open',
  notes text default '',
  fix_attempted text default '',
  resolved boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists file_issues_user_idx on public.file_issues (user_id);

-- ===========================================================================
-- weekly_reports (saved Cameron updates / meeting archive)
-- ===========================================================================
create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  slack_update text default '',
  meeting_notes text default '',
  email_update text default '',
  created_at timestamptz not null default now()
);
create index if not exists weekly_reports_user_idx
  on public.weekly_reports (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','daily_logs','work_sessions','goals','tasks','blockers','file_issues'
  ]
  loop
    execute format('drop trigger if exists set_updated_at on public.%I', t);
    execute format(
      'create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at()', t);
  end loop;
end$$;

-- ===========================================================================
-- Row Level Security — each user sees only their own rows
-- ===========================================================================
alter table public.profiles      enable row level security;
alter table public.daily_logs    enable row level security;
alter table public.work_sessions enable row level security;
alter table public.goals         enable row level security;
alter table public.tasks         enable row level security;
alter table public.blockers      enable row level security;
alter table public.file_issues   enable row level security;
alter table public.weekly_reports enable row level security;

-- profiles: only your own profile
drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Generic owner policy for the remaining tables (user_id = auth.uid()).
do $$
declare t text;
begin
  foreach t in array array[
    'daily_logs','work_sessions','goals','tasks','blockers','file_issues','weekly_reports'
  ]
  loop
    execute format('drop policy if exists "%s_owner" on public.%I', t, t);
    execute format(
      'create policy "%s_owner" on public.%I
         for all using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      t, t);
  end loop;
end$$;
