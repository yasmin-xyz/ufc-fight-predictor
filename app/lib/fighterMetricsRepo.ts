import { supabaseAdmin } from "./supabaseAdmin";

export const FRESHNESS_DAYS = 30;

export function isFresh(timestamp: string | null | undefined, days = FRESHNESS_DAYS): boolean {
  if (!timestamp) return false;
  const age = Date.now() - new Date(timestamp).getTime();
  return age < days * 24 * 60 * 60 * 1000;
}

export type FighterMetricsRow = {
  fighter_name: string;
  normalized_name: string;
  provider_slug: string | null;
  source: string | null;
  source_url: string | null;
  slpm: string | null;
  str_acc: string | null;
  sapm: string | null;
  str_def: string | null;
  td_avg: string | null;
  td_acc: string | null;
  td_def: string | null;
  sub_avg: string | null;
  source_updated_at: string | null;
  last_synced_at: string | null;
  updated_at: string;
};

export async function getCachedMetrics(normalizedName: string) {
  const { data, error } = await supabaseAdmin
    .from("fighter_metrics")
    .select("*")
    .eq("normalized_name", normalizedName)
    .maybeSingle();

  if (error) {
    console.error(`[fighterMetricsRepo] read failure for ${normalizedName}:`, error.message);
    return null;
  }

  return data as (FighterMetricsRow & { id: number }) | null;
}

export async function upsertMetrics(row: FighterMetricsRow) {
  const { error } = await supabaseAdmin
    .from("fighter_metrics")
    .upsert(row, { onConflict: "normalized_name" });

  if (error) {
    console.error(`[fighterMetricsRepo] save failure for ${row.normalized_name}:`, error.message);
    return false;
  }

  console.log(`[fighterMetricsRepo] Supabase upsert completed (metrics): "${row.fighter_name}"`);
  return true;
}

export type FighterHistoryRow = {
  fighter_slug: string;
  fighter_name: string;
  opponent_slug: string | null;
  opponent_name: string | null;
  result: string | null;
  event_name: string | null;
  event_date: string | null;
  location: string | null;
  method: string | null;
  round: number | null;
  fight_time: string | null;
  source: string;
  updated_at: string;
};

export async function getCachedHistory(fighterSlug: string) {
  const { data, error } = await supabaseAdmin
    .from("fighter_history")
    .select("*")
    .eq("fighter_slug", fighterSlug)
    .order("event_date", { ascending: false });

  if (error) {
    console.error(`[fighterMetricsRepo] history read failure for ${fighterSlug}:`, error.message);
    return null;
  }

  return data as (FighterHistoryRow & { id: number; updated_at: string })[];
}

// Postgres' ON CONFLICT DO UPDATE cannot touch the same conflict target
// twice within one statement. Cito's fight-history responses occasionally
// contain two entries that map to the same (fighter_slug, opponent_slug,
// event_date, event_name) key — without de-duping first, the whole batch
// upsert fails with "ON CONFLICT DO UPDATE command cannot affect row a
// second time" and nothing gets saved.
function dedupeHistoryRows(rows: FighterHistoryRow[]): FighterHistoryRow[] {
  const seen = new Map<string, FighterHistoryRow>();

  for (const row of rows) {
    const key = `${row.fighter_slug}|${row.opponent_slug}|${row.event_date}|${row.event_name}`;
    seen.set(key, row);
  }

  return [...seen.values()];
}

export async function upsertHistoryRows(rows: FighterHistoryRow[]) {
  if (rows.length === 0) return true;

  const deduped = dedupeHistoryRows(rows);

  if (deduped.length !== rows.length) {
    console.warn(
      `[fighterMetricsRepo] deduped ${rows.length - deduped.length} duplicate history row(s) for "${rows[0].fighter_slug}" before upsert`
    );
  }

  const { error } = await supabaseAdmin
    .from("fighter_history")
    .upsert(deduped, { onConflict: "fighter_slug,opponent_slug,event_date,event_name" });

  if (error) {
    console.error(
      `[fighterMetricsRepo] history save failure for ${rows[0].fighter_slug}:`,
      error.message
    );
    return false;
  }

  console.log(
    `[fighterMetricsRepo] Supabase upsert completed (history): "${rows[0].fighter_name}" — ${deduped.length} row(s)`
  );
  return true;
}
