import { NextResponse } from "next/server";
import { fetchCurrentUfcEvent } from "../../../lib/ufcEvent";
import { peekFighterMetrics, peekFighterHistory, syncFighter } from "../../../lib/fighterSync";
import { resetCitoCallCount, getCitoCallCount } from "../../../lib/citoProvider";

// Manual preload workflow: run this whenever ESPN publishes/changes the next
// event, so ordinary page views never wait on Cito. Not a recurring cron —
// intentionally a manually-triggered, secret-protected endpoint (see #7 of
// the request that created this file).
//
// Vercel execution time headroom for a cold run across a full card.
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const configuredSecret = process.env.FIGHTER_SYNC_SECRET;

  if (!configuredSecret) {
    console.error("[admin/fighter-sync] FIGHTER_SYNC_SECRET is not configured — refusing all requests");
    return false;
  }

  const providedSecret = request.headers.get("x-fighter-sync-secret");
  return providedSecret === configuredSecret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const event = await fetchCurrentUfcEvent();

    if (!event) {
      return NextResponse.json({ error: "No current UFC event found" }, { status: 404 });
    }

    const names = new Set<string>();
    for (const fight of event.fights) {
      if (fight.fighterA) names.add(fight.fighterA);
      if (fight.fighterB) names.add(fight.fighterB);
    }

    const uniqueNames = [...names];
    console.log(
      `[admin/fighter-sync] event "${event.eventName}" — ${uniqueNames.length} unique fighters found`
    );

    resetCitoCallCount();

    let cacheHits = 0;
    let fightersSynced = 0;
    let failures = 0;
    const results: {
      name: string;
      status: "cache_hit" | "synced" | "failed";
      metricsStatus: string;
      historyStatus: string;
    }[] = [];

    const startedAt = Date.now();

    for (const name of uniqueNames) {
      const metricsPeek = await peekFighterMetrics(name);
      const historyPeek = await peekFighterHistory(metricsPeek.providerSlug);

      const bothFresh =
        metricsPeek.status === "cached" &&
        !metricsPeek.needsRefresh &&
        historyPeek.status === "cached" &&
        !historyPeek.needsRefresh;

      if (bothFresh) {
        cacheHits += 1;
        console.log(`[admin/fighter-sync] cache hit, skipping: "${name}"`);
        results.push({ name, status: "cache_hit", metricsStatus: "cached", historyStatus: "cached" });
        continue;
      }

      console.log(`[admin/fighter-sync] syncing: "${name}"`);

      try {
        const synced = await syncFighter(name);

        if (synced.metrics.cacheStatus === "unavailable") {
          failures += 1;
          results.push({
            name,
            status: "failed",
            metricsStatus: synced.metrics.cacheStatus,
            historyStatus: synced.history.cacheStatus,
          });
        } else {
          fightersSynced += 1;
          results.push({
            name,
            status: "synced",
            metricsStatus: synced.metrics.cacheStatus,
            historyStatus: synced.history.cacheStatus,
          });
        }
      } catch (error) {
        failures += 1;
        console.error(
          `[admin/fighter-sync] sync threw for "${name}":`,
          error instanceof Error ? error.message : error
        );
        results.push({ name, status: "failed", metricsStatus: "error", historyStatus: "error" });
      }
    }

    const durationMs = Date.now() - startedAt;
    const citoCallsMade = getCitoCallCount();

    console.log(
      `[admin/fighter-sync] done in ${durationMs}ms — total=${uniqueNames.length} cacheHits=${cacheHits} synced=${fightersSynced} failures=${failures} citoCalls=${citoCallsMade}`
    );

    return NextResponse.json({
      eventName: event.eventName,
      totalFighters: uniqueNames.length,
      cacheHits,
      fightersSynced,
      failures,
      citoCallsMade,
      durationMs,
      results,
    });
  } catch (error) {
    console.error(
      "[admin/fighter-sync] request error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fighter sync failed" },
      { status: 500 }
    );
  }
}
