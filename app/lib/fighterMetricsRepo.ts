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

export async function upsertHistoryRows(rows: FighterHistoryRow[]) {
  if (rows.length === 0) return true;

  const { error } = await supabaseAdmin
    .from("fighter_history")
    .upsert(rows, { onConflict: "fighter_slug,opponent_slug,event_date,event_name" });

  if (error) {
    console.error(
      `[fighterMetricsRepo] history save failure for ${rows[0].fighter_slug}:`,
      error.message
    );
    return false;
  }

  return true;
}
