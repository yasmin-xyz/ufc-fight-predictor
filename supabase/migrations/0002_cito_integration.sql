-- Adds Cito-provider columns to the existing fighter_metrics table and
-- creates a new fighter_history table. Written defensively (IF NOT EXISTS /
-- ADD COLUMN IF NOT EXISTS) since this runs against a live table that
-- already has data in it.

alter table public.fighter_metrics
  add column if not exists provider_slug text,
  add column if not exists source text,
  add column if not exists source_updated_at timestamptz,
  add column if not exists last_synced_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.fighter_history (
  id bigint generated always as identity primary key,
  fighter_slug text not null,
  fighter_name text not null,
  opponent_slug text,
  opponent_name text,
  result text,
  event_name text,
  event_date date,
  location text,
  method text,
  round integer,
  fight_time text,
  source text default 'cito',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists fighter_history_unique_fight
  on public.fighter_history (fighter_slug, opponent_slug, event_date, event_name);

create index if not exists fighter_history_fighter_slug_idx
  on public.fighter_history (fighter_slug);
