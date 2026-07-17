import { namesMatchExactly } from "./fighterName";

// Server-only. Never import this from a client component — it reads
// CITO_API_KEY from process.env and that must never reach the browser.
const CITO_API_KEY = process.env.CITO_API_KEY;
const CITO_BASE_URL = "https://api.citoapi.com/api/v1/ufc";

export function isCitoConfigured(): boolean {
  return !!CITO_API_KEY;
}

// Lets callers (the admin bulk-sync endpoint) report exactly how many real
// Cito requests a run made, rather than inferring it from cache statuses.
let citoCallCount = 0;

export function getCitoCallCount(): number {
  return citoCallCount;
}

export function resetCitoCallCount(): void {
  citoCallCount = 0;
}

export type CitoFighterStats = {
  fighterSlug: string;
  sigStrikesLandedPerMin: string;
  strikingAccuracy: string;
  sigStrikesAbsorbedPerMin: string;
  sigStrikeDefense: string;
  takedownAvgPer15Min: string;
  takedownAccuracy: string;
  takedownDefense: string;
  submissionAvgPer15Min: string;
  sourceUrl: string | null;
  lastSyncedAt: string | null;
};

export type CitoSearchFighter = {
  slug: string;
  name: string;
  stats: CitoFighterStats | null;
};

export type CitoFightHistoryEntry = {
  outcome: string | null;
  opponent: { slug: string | null; name: string | null };
  event: { title: string | null; eventDate: string | null; locationText: string | null };
  bout: { method: string | null; resultRound: number | null; resultTime: string | null };
};

// Free tier allows 10 requests/min. Space calls out so a bulk sync never
// bursts past that, regardless of how many callers share this module.
const MIN_INTERVAL_MS = 6500;
let lastRequestAt = 0;
let throttleChain: Promise<void> = Promise.resolve();

function throttle(): Promise<void> {
  const next = throttleChain.then(async () => {
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
  });
  throttleChain = next.catch(() => {});
  return next;
}

type CitoFetchResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number | null; error: string };

async function citoFetch<T>(path: string): Promise<CitoFetchResult<T>> {
  if (!CITO_API_KEY) {
    return { ok: false, status: null, error: "CITO_API_KEY is not configured" };
  }

  await throttle();

  try {
    citoCallCount += 1;

    const res = await fetch(`${CITO_BASE_URL}${path}`, {
      headers: { "x-api-key": CITO_API_KEY },
    });

    if (!res.ok) {
      return { ok: false, status: res.status, error: `Cito request failed (${res.status})` };
    }

    const body = await res.json();
    return { ok: true, data: body.data as T };
  } catch (error) {
    return {
      ok: false,
      status: null,
      error: error instanceof Error ? error.message : "Unknown Cito request error",
    };
  }
}

export type FighterSearchResult =
  | { status: "matched"; fighter: CitoSearchFighter }
  | { status: "not_found" }
  | { status: "ambiguous"; candidateCount: number }
  | { status: "error"; error: string };

export async function searchCitoFighter(fighterName: string): Promise<FighterSearchResult> {
  const result = await citoFetch<{ fighters: CitoSearchFighter[] }>(
    `/search?q=${encodeURIComponent(fighterName)}`
  );

  if (!result.ok) {
    return { status: "error", error: result.error };
  }

  const candidates = (result.data.fighters || []).filter((f) =>
    namesMatchExactly(f.name, fighterName)
  );

  if (candidates.length === 0) return { status: "not_found" };
  if (candidates.length > 1) return { status: "ambiguous", candidateCount: candidates.length };

  return { status: "matched", fighter: candidates[0] };
}

export type FightHistoryResult =
  | { status: "ok"; fights: CitoFightHistoryEntry[] }
  | { status: "error"; error: string };

export async function fetchCitoFighterFights(slug: string): Promise<FightHistoryResult> {
  const result = await citoFetch<CitoFightHistoryEntry[]>(
    `/fighters/${encodeURIComponent(slug)}/fights`
  );

  if (!result.ok) {
    return { status: "error", error: result.error };
  }

  return { status: "ok", fights: result.data };
}
