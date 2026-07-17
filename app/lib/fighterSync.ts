import { normalizeFighterName } from "./fighterName";
import {
  searchCitoFighter,
  fetchCitoFighterFights,
  type CitoFighterStats,
} from "./citoProvider";
import {
  getCachedMetrics,
  upsertMetrics,
  getCachedHistory,
  upsertHistoryRows,
  isFresh,
  type FighterMetricsRow,
  type FighterHistoryRow,
} from "./fighterMetricsRepo";

export type MappedMetrics = {
  slpm: string | null;
  strAcc: string | null;
  sapm: string | null;
  strDef: string | null;
  tdAvg: string | null;
  tdAcc: string | null;
  tdDef: string | null;
  subAvg: string | null;
};

const REQUIRED_METRIC_KEYS: (keyof MappedMetrics)[] = [
  "slpm",
  "strAcc",
  "sapm",
  "strDef",
  "tdAvg",
  "tdAcc",
  "tdDef",
  "subAvg",
];

function toPercent(value: string | null | undefined): string | null {
  if (value == null) return null;
  const num = parseFloat(value);
  if (Number.isNaN(num)) return null;
  return `${Math.round(num * 100)}%`;
}

function mapCitoStats(stats: CitoFighterStats): MappedMetrics {
  return {
    slpm: stats.sigStrikesLandedPerMin ?? null,
    strAcc: toPercent(stats.strikingAccuracy),
    sapm: stats.sigStrikesAbsorbedPerMin ?? null,
    strDef: toPercent(stats.sigStrikeDefense),
    tdAvg: stats.takedownAvgPer15Min ?? null,
    tdAcc: toPercent(stats.takedownAccuracy),
    tdDef: toPercent(stats.takedownDefense),
    subAvg: stats.submissionAvgPer15Min ?? null,
  };
}

function rowToMapped(row: FighterMetricsRow): MappedMetrics {
  return {
    slpm: row.slpm,
    strAcc: row.str_acc,
    sapm: row.sapm,
    strDef: row.str_def,
    tdAvg: row.td_avg,
    tdAcc: row.td_acc,
    tdDef: row.td_def,
    subAvg: row.sub_avg,
  };
}

export type MetricsPeekResult = {
  normalizedName: string;
  providerSlug: string | null;
  status: "cached" | "missing";
  needsRefresh: boolean;
  metrics: MappedMetrics | null;
};

// Supabase-only read, no Cito calls. Used by the read-first fighter-metrics
// route so a request never blocks on the throttled provider.
export async function peekFighterMetrics(fighterName: string): Promise<MetricsPeekResult> {
  const normalizedName = normalizeFighterName(fighterName);
  const cached = await getCachedMetrics(normalizedName);

  if (!cached) {
    return { normalizedName, providerSlug: null, status: "missing", needsRefresh: true, metrics: null };
  }

  return {
    normalizedName,
    providerSlug: cached.provider_slug,
    status: "cached",
    needsRefresh: !isFresh(cached.last_synced_at),
    metrics: rowToMapped(cached),
  };
}

export type HistoryPeekResult = {
  status: "cached" | "missing";
  needsRefresh: boolean;
  history: HistoryEntry[];
};

// Supabase-only read, no Cito calls.
export async function peekFighterHistory(providerSlug: string | null): Promise<HistoryPeekResult> {
  if (!providerSlug) {
    return { status: "missing", needsRefresh: false, history: [] };
  }

  const cachedRows = await getCachedHistory(providerSlug);

  if (!cachedRows || cachedRows.length === 0) {
    return { status: "missing", needsRefresh: true, history: [] };
  }

  const newestUpdatedAt = cachedRows.reduce(
    (max, r) => (r.updated_at > max ? r.updated_at : max),
    cachedRows[0].updated_at
  );

  return {
    status: "cached",
    needsRefresh: !isFresh(newestUpdatedAt),
    history: cachedRows.map(rowToHistoryEntry),
  };
}

export type MetricsCacheStatus = "hit" | "miss_refreshed" | "stale_fallback" | "unavailable";

export type MetricsSyncResult = {
  normalizedName: string;
  cacheStatus: MetricsCacheStatus;
  providerSlug: string | null;
  metrics: MappedMetrics | null;
};

export async function syncFighterMetrics(fighterName: string): Promise<MetricsSyncResult> {
  const normalizedName = normalizeFighterName(fighterName);
  const cached = await getCachedMetrics(normalizedName);

  if (cached && isFresh(cached.last_synced_at)) {
    console.log(`[fighterSync] cache hit (metrics): "${fighterName}"`);
    return {
      normalizedName,
      cacheStatus: "hit",
      providerSlug: cached.provider_slug,
      metrics: rowToMapped(cached),
    };
  }

  console.log(`[fighterSync] cache miss (metrics): "${fighterName}" — querying Cito`);
  const searchResult = await searchCitoFighter(fighterName);

  if (searchResult.status !== "matched") {
    console.warn(
      `[fighterSync] provider match failure (${searchResult.status}): "${fighterName}"`
    );

    if (cached) {
      console.warn(`[fighterSync] falling back to stale cached metrics: "${fighterName}"`);
      return {
        normalizedName,
        cacheStatus: "stale_fallback",
        providerSlug: cached.provider_slug,
        metrics: rowToMapped(cached),
      };
    }

    return { normalizedName, cacheStatus: "unavailable", providerSlug: null, metrics: null };
  }

  const fighter = searchResult.fighter;

  if (!fighter.stats) {
    console.error(`[fighterSync] provider response missing stats field: "${fighterName}"`);

    if (cached) {
      return {
        normalizedName,
        cacheStatus: "stale_fallback",
        providerSlug: cached.provider_slug,
        metrics: rowToMapped(cached),
      };
    }

    return { normalizedName, cacheStatus: "unavailable", providerSlug: fighter.slug, metrics: null };
  }

  const mapped = mapCitoStats(fighter.stats);
  const missingKeys = REQUIRED_METRIC_KEYS.filter((key) => mapped[key] == null);

  if (missingKeys.length > 0) {
    console.warn(
      `[fighterSync] provider response missing required fields (${missingKeys.join(", ")}): "${fighterName}"`
    );
  }

  const now = new Date().toISOString();

  const row: FighterMetricsRow = {
    fighter_name: fighterName,
    normalized_name: normalizedName,
    provider_slug: fighter.slug,
    source: "cito",
    source_url: fighter.stats.sourceUrl,
    slpm: mapped.slpm,
    str_acc: mapped.strAcc,
    sapm: mapped.sapm,
    str_def: mapped.strDef,
    td_avg: mapped.tdAvg,
    td_acc: mapped.tdAcc,
    td_def: mapped.tdDef,
    sub_avg: mapped.subAvg,
    source_updated_at: fighter.stats.lastSyncedAt,
    last_synced_at: now,
    updated_at: now,
  };

  const saved = await upsertMetrics(row);
  if (!saved) {
    console.error(`[fighterSync] Supabase save failure (metrics): "${fighterName}"`);
  }

  return { normalizedName, cacheStatus: "miss_refreshed", providerSlug: fighter.slug, metrics: mapped };
}

export type HistoryEntry = {
  opponent: string | null;
  opponentSlug: string | null;
  result: string | null;
  event: string | null;
  date: string | null;
  location: string | null;
  method: string | null;
  round: number | null;
  time: string | null;
};

export type HistoryCacheStatus =
  | "hit"
  | "miss_refreshed"
  | "stale_fallback"
  | "unavailable"
  | "no_slug";

export type HistorySyncResult = {
  providerSlug: string | null;
  cacheStatus: HistoryCacheStatus;
  history: HistoryEntry[];
};

function rowToHistoryEntry(row: FighterHistoryRow): HistoryEntry {
  return {
    opponent: row.opponent_name,
    opponentSlug: row.opponent_slug,
    result: row.result,
    event: row.event_name,
    date: row.event_date,
    location: row.location,
    method: row.method,
    round: row.round,
    time: row.fight_time,
  };
}

export async function syncFighterHistory(
  fighterName: string,
  providerSlug: string | null
): Promise<HistorySyncResult> {
  if (!providerSlug) {
    console.warn(`[fighterSync] no provider slug available for history: "${fighterName}"`);
    return { providerSlug: null, cacheStatus: "no_slug", history: [] };
  }

  const cachedRows = await getCachedHistory(providerSlug);
  const newestUpdatedAt =
    cachedRows && cachedRows.length > 0
      ? cachedRows.reduce((max, r) => (r.updated_at > max ? r.updated_at : max), cachedRows[0].updated_at)
      : null;

  if (cachedRows && cachedRows.length > 0 && isFresh(newestUpdatedAt)) {
    console.log(`[fighterSync] cache hit (history): "${fighterName}"`);
    return { providerSlug, cacheStatus: "hit", history: cachedRows.map(rowToHistoryEntry) };
  }

  console.log(`[fighterSync] cache miss (history): "${fighterName}" — querying Cito`);
  const fightsResult = await fetchCitoFighterFights(providerSlug);

  if (fightsResult.status !== "ok") {
    console.error(`[fighterSync] provider error (history): "${fighterName}": ${fightsResult.error}`);

    if (cachedRows && cachedRows.length > 0) {
      console.warn(`[fighterSync] falling back to stale cached history: "${fighterName}"`);
      return { providerSlug, cacheStatus: "stale_fallback", history: cachedRows.map(rowToHistoryEntry) };
    }

    return { providerSlug, cacheStatus: "unavailable", history: [] };
  }

  const now = new Date().toISOString();

  const rows: FighterHistoryRow[] = fightsResult.fights.map((fight) => ({
    fighter_slug: providerSlug,
    fighter_name: fighterName,
    opponent_slug: fight.opponent?.slug ?? null,
    opponent_name: fight.opponent?.name ?? null,
    result: fight.outcome,
    event_name: fight.event?.title ?? null,
    event_date: fight.event?.eventDate ?? null,
    location: fight.event?.locationText ?? null,
    method: fight.bout?.method ?? null,
    round: fight.bout?.resultRound ?? null,
    fight_time: fight.bout?.resultTime ?? null,
    source: "cito",
    updated_at: now,
  }));

  const saved = await upsertHistoryRows(rows);
  if (!saved) {
    console.error(`[fighterSync] Supabase save failure (history): "${fighterName}"`);
  }

  return {
    providerSlug,
    cacheStatus: "miss_refreshed",
    history: rows.map(rowToHistoryEntry),
  };
}

export type FighterSyncResult = {
  fighterName: string;
  metrics: MetricsSyncResult;
  history: HistorySyncResult;
};

export async function syncFighter(fighterName: string): Promise<FighterSyncResult> {
  const metrics = await syncFighterMetrics(fighterName);
  const history = await syncFighterHistory(fighterName, metrics.providerSlug);

  return { fighterName, metrics, history };
}
