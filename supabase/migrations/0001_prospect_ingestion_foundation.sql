create extension if not exists pgcrypto;

create table if not exists prospects (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  slug text not null,
  position text not null,
  college text not null,
  height_inches numeric,
  weight_pounds numeric,
  age numeric,
  hometown text,
  bio text,
  draft_year integer not null,
  status text not null check (status in ('active', 'declared', 'archived')),
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, draft_year)
);

create table if not exists prospect_external_ids (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  provider text not null,
  external_id text not null,
  external_type text not null,
  created_at timestamptz not null default now(),
  unique (provider, external_id)
);

create table if not exists prospect_measurements (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  metric_type text not null,
  metric_value numeric not null,
  metric_unit text not null,
  event_type text not null check (event_type in ('combine', 'pro_day', 'school', 'reported', 'unknown')),
  source_type text not null check (source_type in ('official', 'licensed', 'reported', 'manual', 'derived')),
  source_name text not null,
  confidence text not null check (confidence in ('official', 'high', 'medium', 'low', 'manual_review')),
  recorded_at timestamptz,
  draft_year integer not null,
  created_at timestamptz not null default now(),
  unique (prospect_id, metric_type, metric_unit, event_type, source_name, recorded_at)
);

create table if not exists prospect_college_stats (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  season integer not null,
  team_name text not null,
  stat_category text not null,
  stat_name text not null,
  stat_value numeric not null,
  source_name text not null,
  confidence text not null check (confidence in ('official', 'high', 'medium', 'low', 'manual_review')),
  created_at timestamptz not null default now(),
  unique (prospect_id, season, team_name, stat_category, stat_name, source_name)
);

create table if not exists prospect_rankings (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  source_name text not null,
  ranking_type text not null check (ranking_type in ('overall', 'position', 'consensus', 'grade')),
  ranking_value numeric,
  grade_value numeric,
  draft_year integer not null,
  created_at timestamptz not null default now(),
  unique (prospect_id, source_name, ranking_type, draft_year)
);

create table if not exists prospect_reports (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references prospects(id) on delete cascade,
  source_name text not null,
  summary text,
  strengths text[] not null default '{}',
  weaknesses text[] not null default '{}',
  projection text,
  created_at timestamptz not null default now(),
  unique (prospect_id, source_name)
);

create table if not exists staging_prospects_raw (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  entity_type text not null check (entity_type in ('prospect', 'measurement', 'college_stat', 'ranking', 'report')),
  external_id text not null,
  payload jsonb not null,
  fetched_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_name text not null,
  entity_type text not null check (entity_type in ('prospect', 'measurement', 'college_stat', 'ranking', 'report')),
  started_at timestamptz not null,
  finished_at timestamptz,
  status text not null check (status in ('pending', 'running', 'completed', 'failed')),
  fetched_rows integer not null default 0,
  staged_rows integer not null default 0,
  inserted_rows integer not null default 0,
  updated_rows integer not null default 0,
  skipped_rows integer not null default 0,
  conflicts integer not null default 0,
  error_output text,
  created_at timestamptz not null default now()
);

create table if not exists data_review_queue (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  entity_type text not null check (entity_type in ('prospect', 'measurement', 'college_stat', 'ranking', 'report')),
  external_id text not null,
  reason text not null,
  payload jsonb not null,
  status text not null check (status in ('open', 'reviewing', 'resolved')) default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_prospect_external_ids_prospect_id
  on prospect_external_ids (prospect_id);

create index if not exists idx_prospect_measurements_prospect_id
  on prospect_measurements (prospect_id);

create index if not exists idx_prospect_college_stats_prospect_id
  on prospect_college_stats (prospect_id);

create index if not exists idx_prospect_rankings_prospect_id
  on prospect_rankings (prospect_id);

create index if not exists idx_staging_prospects_raw_provider
  on staging_prospects_raw (provider, entity_type);

create index if not exists idx_sync_runs_source_name
  on sync_runs (source_name, started_at desc);

create index if not exists idx_data_review_queue_status
  on data_review_queue (status, created_at desc);
