import { NextResponse } from "next/server";
import { after } from "next/server";
import {
  syncFighter,
  peekFighterMetrics,
  peekFighterHistory,
  type MappedMetrics,
  type HistoryEntry,
} from "../../lib/fighterSync";
import { isCitoConfigured } from "../../lib/citoProvider";
import { fighterMetrics as staticFighterMetrics } from "../../data/fighterMetrics";

type MetricsStatus = "cached" | "static-fallback" | "syncing" | "unavailable";
type HistoryStatus = "cached" | "syncing" | "unavailable";

function toDisplayHistory(entries: HistoryEntry[]): HistoryEntry[] {
  const todayStr = new Date().toISOString().slice(0, 10);

  return entries
    .filter((entry) => !!entry.date && !!entry.result && entry.date < todayStr)
    .sort((a, b) => ((a.date as string) < (b.date as string) ? 1 : -1))
    .slice(0, 5);
}

type FighterPayload = {
  name: string;
  metrics: MappedMetrics | null;
  metricsStatus: MetricsStatus;
  history: HistoryEntry[];
  historyStatus: HistoryStatus;
  needsBackgroundSync: boolean;
};

// Supabase-only — this never calls Cito. A cache miss returns immediately
// with a "syncing"/"static-fallback" status and flags itself for a
// background refresh instead of making the request wait on the throttled
// provider.
async function buildFighterPayload(name: string): Promise<FighterPayload> {
  const metricsPeek = await peekFighterMetrics(name);
  const historyPeek = await peekFighterHistory(metricsPeek.providerSlug);

  let metrics: MappedMetrics | null = metricsPeek.metrics;
  let metricsStatus: MetricsStatus;
  let needsBackgroundSync = false;

  if (metricsPeek.status === "cached") {
    metricsStatus = "cached";
    if (metricsPeek.needsRefresh) needsBackgroundSync = true;
  } else {
    const fallback = staticFighterMetrics[name] || null;

    if (fallback) {
      metrics = fallback;
      metricsStatus = "static-fallback";
      needsBackgroundSync = true;
    } else if (isCitoConfigured()) {
      metricsStatus = "syncing";
      needsBackgroundSync = true;
    } else {
      console.error(`[fighter-metrics] CITO_API_KEY not configured — cannot sync "${name}"`);
      metricsStatus = "unavailable";
    }
  }

  const history = toDisplayHistory(historyPeek.history);
  let historyStatus: HistoryStatus;

  if (!metricsPeek.providerSlug) {
    // Can't fetch fight history without a resolved Cito slug yet.
    historyStatus = metricsStatus === "unavailable" ? "unavailable" : "syncing";
  } else if (historyPeek.status === "cached") {
    historyStatus = "cached";
    if (historyPeek.needsRefresh) needsBackgroundSync = true;
  } else {
    historyStatus = "syncing";
    needsBackgroundSync = true;
  }

  return { name, metrics, metricsStatus, history, historyStatus, needsBackgroundSync };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const names = body?.names;

    if (
      !Array.isArray(names) ||
      names.length === 0 ||
      !names.every((name) => typeof name === "string")
    ) {
      return NextResponse.json(
        {
          error:
            'Send a JSON body like: { "names": ["Kamaru Usman", "Dricus Du Plessis"] }',
        },
        { status: 400 }
      );
    }

    const uniqueNames = [...new Set(names)]
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 10);

    // Concurrent Supabase reads only — no Cito calls happen on this path.
    const payloads = await Promise.all(uniqueNames.map((name) => buildFighterPayload(name)));

    const metrics: Record<string, MappedMetrics | null> = {};
    const metricsStatus: Record<string, MetricsStatus> = {};
    const history: Record<string, HistoryEntry[]> = {};
    const historyStatus: Record<string, HistoryStatus> = {};
    const namesToSync: string[] = [];

    for (const payload of payloads) {
      metrics[payload.name] = payload.metrics;
      metricsStatus[payload.name] = payload.metricsStatus;
      history[payload.name] = payload.history;
      historyStatus[payload.name] = payload.historyStatus;

      if (payload.needsBackgroundSync) namesToSync.push(payload.name);
    }

    if (namesToSync.length > 0) {
      console.log(
        `[fighter-metrics] response sent, scheduling background sync for: ${namesToSync.join(", ")}`
      );

      after(async () => {
        for (const name of namesToSync) {
          try {
            await syncFighter(name);
          } catch (error) {
            console.error(
              `[fighter-metrics] background sync failed for "${name}":`,
              error instanceof Error ? error.message : error
            );
          }
        }
      });
    }

    return NextResponse.json({ metrics, metricsStatus, history, historyStatus });
  } catch (error) {
    console.error(
      "[fighter-metrics] request error:",
      error instanceof Error ? error.message : error
    );

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load fighter metrics",
      },
      { status: 500 }
    );
  }
}
