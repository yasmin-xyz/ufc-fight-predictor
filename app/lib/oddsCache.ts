import { unstable_cache } from "next/cache";
import { fetchOddsFromProvider } from "./oddsProvider";

// Orchestration layer: decides WHEN to call the provider and what to
// serve when it can't. app/api/odds/route.ts (HTTP glue) and page.tsx
// (UI) never talk to oddsProvider.ts directly — only through here.

// How long one provider response is shared across every visitor before
// the next request is allowed to hit the-odds-api.com again. Odds for a
// fight-analysis tool don't need minute-level freshness, and the free
// tier's monthly quota can't sustain that anyway — 60 minutes keeps
// usage well within a typical free-tier budget (~24 req/day worst case)
// while still refreshing several times a day. Raise or lower this one
// constant to retune the cost/freshness tradeoff.
const ODDS_REVALIDATE_SECONDS = 60 * 60;

// Next's Data Cache: shared across every visitor and every route-handler
// invocation (including across separate serverless instances on
// Vercel), unlike a plain module variable. This is the ONLY call site
// for fetchOddsFromProvider — while a cache entry is fresh, calling this
// never reaches the-odds-api.com at all.
const getRevalidatedOdds = unstable_cache(
  fetchOddsFromProvider,
  ["odds-api-response"],
  { revalidate: ODDS_REVALIDATE_SECONDS }
);

// --- Last-known-good fallback -------------------------------------
//
// unstable_cache does not serve a stale value if the wrapped function
// throws on revalidation — it propagates the error instead. So when the
// provider fails (quota exhausted, network error, etc.), we fall back to
// whatever the last successful response was, kept here.
//
// This is a plain in-memory value, which is a real limitation: on
// Vercel, a cold serverless instance won't have it. It's intentionally
// isolated behind get/set functions rather than inlined below so that
// swapping it for a persistent store (Supabase) later — for a fallback
// that survives cold starts — only means reimplementing these two
// functions; nothing in getOdds(), the route handler, or the UI needs
// to change.
interface LastGoodOdds {
  odds: any[];
  fetchedAt: string;
}

let lastGoodOddsMemory: LastGoodOdds | null = null;

function getLastGoodOdds(): LastGoodOdds | null {
  return lastGoodOddsMemory;
}

function setLastGoodOdds(value: LastGoodOdds): void {
  lastGoodOddsMemory = value;
}

export interface OddsResult {
  odds: any[];
  fetchedAt: string | null;
  // true when this response is not a fresh provider result — either a
  // last-known-good fallback, or (if none exists) empty.
  stale: boolean;
  // false when the provider call itself failed and we couldn't reach
  // the-odds-api.com at all for this request cycle.
  providerAvailable: boolean;
}

export async function getOdds(): Promise<OddsResult> {
  try {
    const result = await getRevalidatedOdds();
    setLastGoodOdds({ odds: result.odds, fetchedAt: result.fetchedAt });
    return {
      odds: result.odds,
      fetchedAt: result.fetchedAt,
      stale: false,
      providerAvailable: true,
    };
  } catch (error) {
    console.error(
      "[oddsCache] provider request failed:",
      error instanceof Error ? error.message : error
    );

    const fallback = getLastGoodOdds();
    if (fallback) {
      return {
        odds: fallback.odds,
        fetchedAt: fallback.fetchedAt,
        stale: true,
        providerAvailable: false,
      };
    }

    return { odds: [], fetchedAt: null, stale: true, providerAvailable: false };
  }
}
