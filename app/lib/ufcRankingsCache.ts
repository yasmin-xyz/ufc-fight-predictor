import { unstable_cache } from "next/cache";
import { fetchUfcRankingsFromSource, UfcRankings } from "./ufcRankingsProvider";

// Rankings move at most weekly (after a Sunday/Saturday event) — no need
// to hit ufc.com more than a few times a day. Mirrors oddsCache.ts's
// shape: a Next Data Cache layer plus a last-known-good in-memory
// fallback for when the scrape itself fails.
const RANKINGS_REVALIDATE_SECONDS = 6 * 60 * 60;

const getRevalidatedRankings = unstable_cache(
  fetchUfcRankingsFromSource,
  ["ufc-rankings-response"],
  { revalidate: RANKINGS_REVALIDATE_SECONDS }
);

let lastGoodRankings: UfcRankings | null = null;

export interface RankingsResult {
  rankings: UfcRankings;
  stale: boolean;
}

export async function getUfcRankings(): Promise<RankingsResult> {
  try {
    const rankings = await getRevalidatedRankings();
    lastGoodRankings = rankings;
    return { rankings, stale: false };
  } catch (error) {
    console.error(
      "[ufcRankingsCache] scrape failed:",
      error instanceof Error ? error.message : error
    );

    return { rankings: lastGoodRankings || {}, stale: true };
  }
}
