-- =====================================================================
-- 0002_quickfill_context_thankyou.sql
-- =====================================================================

alter table public.profiles
  add column if not exists resume_text           text,
  add column if not exists context_summary       text,
  add column if not exists context_updated_at    timestamptz,
  add column if not exists thankyou_character    text,
  add column if not exists thankyou_content      jsonb,
  add column if not exists thankyou_generated_at timestamptz;

create table if not exists public.step_notes (
  id           bigint generated always as identity primary key,
  candidate_id text not null references public.profiles(candidate_id) on delete cascade,
  section      text not null check (section in
               ('personal','education','experience','skills','preferences','compensation','links','review')),
  note         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists step_notes_idx
  on public.step_notes (candidate_id, section, created_at desc);

create table if not exists public.assist_runs (
  id           bigint generated always as identity primary key,
  candidate_id text not null references public.profiles(candidate_id) on delete cascade,
  kind         text not null check (kind in ('fill','check','chat','summary','thankyou')),
  section      text,
  input_chars  int,
  created_at   timestamptz not null default now()
);
create index if not exists assist_runs_idx
  on public.assist_runs (candidate_id, kind, created_at desc);

create table if not exists public.login_attempts (
  id           bigint generated always as identity primary key,
  candidate_id text not null,
  succeeded    boolean not null,
  created_at   timestamptz not null default now()
);
create index if not exists login_attempts_idx
  on public.login_attempts (candidate_id, created_at desc);

alter table public.step_notes     enable row level security;
alter table public.assist_runs    enable row level security;
alter table public.login_attempts enable row level security;

revoke all on table public.step_notes, public.assist_runs, public.login_attempts
  from anon, authenticated;
