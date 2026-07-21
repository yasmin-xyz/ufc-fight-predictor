-- Persistent, cross-instance rate limiting. Vercel serverless functions do
-- not reliably share in-memory state across instances, so counters live in
-- Supabase (already used elsewhere in this app) instead of a process-local
-- Map. The check-and-increment happens inside a single SQL function with a
-- row lock so concurrent requests against the same key can't race past the
-- limit.

create table if not exists public.rate_limit_counters (
  key text primary key,
  count integer not null default 0,
  window_start timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rate_limit_counters_updated_at_idx
  on public.rate_limit_counters (updated_at);

alter table public.rate_limit_counters enable row level security;
-- No anon/authenticated policies: only the service-role client (used by
-- the API routes) touches this table.

create or replace function public.check_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_limit integer
) returns table(allowed boolean, current_count integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row rate_limit_counters%rowtype;
  v_now timestamptz := now();
begin
  insert into rate_limit_counters (key, count, window_start, updated_at)
  values (p_key, 0, v_now, v_now)
  on conflict (key) do nothing;

  select * into v_row from rate_limit_counters where key = p_key for update;

  if v_row.window_start <= v_now - make_interval(secs => p_window_seconds) then
    update rate_limit_counters
      set count = 1, window_start = v_now, updated_at = v_now
      where key = p_key;
    return query select true, 1, 0;
  end if;

  if v_row.count >= p_limit then
    return query select
      false,
      v_row.count,
      greatest(
        1,
        ceil(extract(epoch from (v_row.window_start + make_interval(secs => p_window_seconds) - v_now)))
      )::integer;
    return;
  end if;

  update rate_limit_counters
    set count = count + 1, updated_at = v_now
    where key = p_key;

  -- Opportunistic cleanup of stale rows so this table can't grow
  -- unbounded — cheap enough to run on a small fraction of calls rather
  -- than needing a separate scheduled job.
  if random() < 0.01 then
    delete from rate_limit_counters where updated_at < v_now - interval '2 days';
  end if;

  return query select true, v_row.count + 1, 0;
end;
$$;

revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

-- Cross-instance job lock for the admin bulk fighter-sync route, so two
-- overlapping invocations (e.g. a manual trigger during a scheduled run)
-- can't both run a 300s Cito sync job at once. The existing in-memory
-- inFlightSyncs Map in fighterSync.ts only coalesces concurrent syncs of
-- the *same fighter* within one serverless instance; this covers the
-- whole-job level across instances.

create table if not exists public.sync_locks (
  lock_name text primary key,
  locked_at timestamptz not null default now()
);

alter table public.sync_locks enable row level security;
-- No anon/authenticated policies: service-role only.

create or replace function public.acquire_sync_lock(
  p_lock_name text,
  p_max_age_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
begin
  delete from sync_locks
    where lock_name = p_lock_name
      and locked_at < v_now - make_interval(secs => p_max_age_seconds);

  insert into sync_locks (lock_name, locked_at)
  values (p_lock_name, v_now)
  on conflict (lock_name) do nothing;

  return exists (
    select 1 from sync_locks
    where lock_name = p_lock_name and locked_at = v_now
  );
end;
$$;

create or replace function public.release_sync_lock(p_lock_name text) returns void
language sql
security definer
set search_path = public
as $$
  delete from sync_locks where lock_name = p_lock_name;
$$;

revoke all on function public.acquire_sync_lock(text, integer) from public;
revoke all on function public.release_sync_lock(text) from public;
grant execute on function public.acquire_sync_lock(text, integer) to service_role;
grant execute on function public.release_sync_lock(text) to service_role;
