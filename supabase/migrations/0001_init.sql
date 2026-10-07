-- =====================================================================
-- 0001_init.sql  |  Candidate Profile Portal
-- =====================================================================

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create table public.profiles (
  candidate_id        text primary key
                      check (candidate_id in ('ayushi','gaurav','pawan')),
  status              text not null default 'draft'
                      check (status in ('draft','submitted')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  submitted_at        timestamptz,

  full_name           text,
  email               text,
  phone               text,
  alt_phone           text,
  date_of_birth       date,
  gender              text,
  nationality         text,
  current_city        text,
  current_state       text,
  current_country     text,
  permanent_address   text,
  willing_to_relocate text check (willing_to_relocate in ('Yes','No','Maybe')),
  notice_period       text,
  work_authorization  text,

  total_experience    text,
  skills              text[] not null default '{}',
  languages           text[] not null default '{}',
  certifications      text,

  preferred_profiles   text[] not null default '{}',
  preferred_job_titles text[] not null default '{}',
  preferred_industries text[] not null default '{}',
  preferred_work_mode  text[] not null default '{}',
  preferred_locations  text[] not null default '{}',
  employment_type_pref text[] not null default '{}',

  currency             text not null default 'INR',
  current_ctc_fixed    numeric(12,2),
  current_ctc_variable numeric(12,2),
  current_ctc_total    numeric(12,2),
  expected_ctc_min     numeric(12,2),
  expected_ctc_max     numeric(12,2),
  ctc_negotiable       text check (ctc_negotiable in ('Yes','No')),

  linkedin_url        text,
  github_url          text,
  portfolio_url       text,
  resume_path         text,
  resume_file_name    text,

  advisor_summary     text,
  additional_notes    text
);

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.education_entries (
  id               uuid primary key default gen_random_uuid(),
  candidate_id     text not null references public.profiles(candidate_id) on delete cascade,
  entry_no         int  not null,
  level            text,
  degree           text,
  field_of_study   text,
  institution      text,
  university_board text,
  start_year       int,
  end_year         int,
  status           text check (status in ('Completed','Pursuing','Discontinued')),
  grade_type       text,
  grade            text,
  location         text,
  unique (candidate_id, entry_no)
);

create table public.experience_entries (
  id                 uuid primary key default gen_random_uuid(),
  candidate_id       text not null references public.profiles(candidate_id) on delete cascade,
  entry_no           int  not null,
  company            text,
  job_title          text,
  employment_type    text,
  industry           text,
  location           text,
  work_mode          text check (work_mode in ('Onsite','Hybrid','Remote')),
  start_date         date,
  end_date           date,
  is_current         boolean not null default false,
  reporting_to       text,
  team_size          text,
  responsibilities   text,
  achievements       text,
  skills_used        text,
  ctc_at_role        numeric(12,2),
  reason_for_leaving text,
  unique (candidate_id, entry_no)
);

create table public.chat_messages (
  id           bigint generated always as identity primary key,
  candidate_id text not null references public.profiles(candidate_id) on delete cascade,
  role         text not null check (role in ('user','assistant')),
  content      text not null,
  created_at   timestamptz not null default now()
);
create index chat_messages_candidate_idx on public.chat_messages (candidate_id, created_at);

create or replace function public.replace_entries(
  p_candidate  text,
  p_education  jsonb,
  p_experience jsonb
) returns void
language plpgsql
as $$
begin
  delete from public.education_entries  where candidate_id = p_candidate;
  delete from public.experience_entries where candidate_id = p_candidate;

  insert into public.education_entries
    (candidate_id, entry_no, level, degree, field_of_study, institution,
     university_board, start_year, end_year, status, grade_type, grade, location)
  select p_candidate, t.ord::int,
         nullif(t.e->>'level',''), nullif(t.e->>'degree',''),
         nullif(t.e->>'field_of_study',''), nullif(t.e->>'institution',''),
         nullif(t.e->>'university_board',''),
         nullif(t.e->>'start_year','')::int, nullif(t.e->>'end_year','')::int,
         nullif(t.e->>'status',''), nullif(t.e->>'grade_type',''),
         nullif(t.e->>'grade',''), nullif(t.e->>'location','')
  from jsonb_array_elements(coalesce(p_education,'[]'::jsonb))
       with ordinality as t(e, ord);

  insert into public.experience_entries
    (candidate_id, entry_no, company, job_title, employment_type, industry,
     location, work_mode, start_date, end_date, is_current, reporting_to,
     team_size, responsibilities, achievements, skills_used, ctc_at_role,
     reason_for_leaving)
  select p_candidate, t.ord::int,
         nullif(t.e->>'company',''), nullif(t.e->>'job_title',''),
         nullif(t.e->>'employment_type',''), nullif(t.e->>'industry',''),
         nullif(t.e->>'location',''), nullif(t.e->>'work_mode',''),
         nullif(t.e->>'start_date','')::date, nullif(t.e->>'end_date','')::date,
         coalesce((t.e->>'is_current')::boolean, false),
         nullif(t.e->>'reporting_to',''), nullif(t.e->>'team_size',''),
         nullif(t.e->>'responsibilities',''), nullif(t.e->>'achievements',''),
         nullif(t.e->>'skills_used',''), nullif(t.e->>'ctc_at_role','')::numeric,
         nullif(t.e->>'reason_for_leaving','')
  from jsonb_array_elements(coalesce(p_experience,'[]'::jsonb))
       with ordinality as t(e, ord);
end $$;

insert into public.profiles (candidate_id) values ('ayushi'), ('gaurav'), ('pawan')
on conflict do nothing;

create view public.submissions_overview
with (security_invoker = true) as
select p.candidate_id, p.status, p.updated_at, p.submitted_at,
       p.full_name, p.email, p.phone, p.total_experience,
       p.preferred_profiles, p.preferred_job_titles,
       p.current_ctc_total, p.expected_ctc_min, p.expected_ctc_max, p.currency,
       p.linkedin_url, p.github_url,
       (select count(*) from public.education_entries  e where e.candidate_id = p.candidate_id) as education_count,
       (select count(*) from public.experience_entries x where x.candidate_id = p.candidate_id) as experience_count
from public.profiles p;

-- LOCK EVERYTHING DOWN
alter table public.profiles           enable row level security;
alter table public.education_entries  enable row level security;
alter table public.experience_entries enable row level security;
alter table public.chat_messages      enable row level security;

revoke all on all tables    in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes', 'resumes', false, 5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;
