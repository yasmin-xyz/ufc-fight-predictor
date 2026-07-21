-- Security audit: lock down the three tables exposed via Supabase's
-- public Data API (fighter_metrics, fighter_history, fight_predictions).
--
-- These are all internal cache/synchronization tables — fighter stats and
-- fight history synced from Cito, and AI predictions synced from
-- Claude/GPT/Gemini. The app has no authentication and the browser never
-- talks to Supabase directly: every read and write goes through a Next.js
-- API route using the service-role client (SUPABASE_SECRET_KEY), which
-- bypasses RLS entirely. So enabling RLS here cannot break any existing
-- app behavior — it only removes a direct public-Data-API path that the
-- app itself never uses.
--
-- Written idempotently (ALTER ... ENABLE and DROP POLICY IF EXISTS) since
-- current RLS/policy state could not be directly queried with the
-- credentials available (service-role key bypasses RLS, so it can't be
-- used to determine whether RLS is already on) — safe to run regardless
-- of current state.

alter table public.fighter_metrics enable row level security;
alter table public.fighter_history enable row level security;
alter table public.fight_predictions enable row level security;

-- No SELECT/INSERT/UPDATE/DELETE policies are created for anon or
-- authenticated roles on any of these tables, intentionally. With RLS
-- enabled and no policies, only the service role (which bypasses RLS) can
-- read or write — the correct posture for private cache tables with no
-- legitimate direct-browser use case today.
--
-- If a future feature needs the browser to read one of these tables
-- directly via the anon key, add a narrowly-scoped SELECT policy at that
-- time (e.g. `using (true)` for select only, never for write) — don't
-- default to broad access.

drop policy if exists "public read" on public.fighter_metrics;
drop policy if exists "public read" on public.fighter_history;
drop policy if exists "public read" on public.fight_predictions;
