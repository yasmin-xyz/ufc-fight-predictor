import { NextResponse } from "next/server";
import { syncFighter, type MappedMetrics, type HistoryEntry } from "../../lib/fighterSync";
import { fighterMetrics as staticFighterMetrics } from "../../data/fighterMetrics";

type MetricsSource = "supabase" | "static-fallback" | "unavailable";

function toDisplayHistory(entries: HistoryEntry[]): HistoryEntry[] {
  const todayStr = new Date().toISOString().slice(0, 10);

  return entries
    .filter((entry) => !!entry.date && !!entry.result && entry.date < todayStr)
    .sort((a, b) => ((a.date as string) < (b.date as string) ? 1 : -1))
    .slice(0, 5);
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

    const results = await Promise.allSettled(uniqueNames.map((name) => syncFighter(name)));

    const metrics: Record<string, MappedMetrics | null> = {};
    const metricsSource: Record<string, MetricsSource> = {};
    const history: Record<string, HistoryEntry[]> = {};

    results.forEach((result, index) => {
      const name = uniqueNames[index];

      if (result.status === "rejected") {
        console.error(`[fighter-metrics] sync failed for "${name}":`, result.reason);
        const fallback = staticFighterMetrics[name] || null;
        metrics[name] = fallback;
        metricsSource[name] = fallback ? "static-fallback" : "unavailable";
        history[name] = [];
        return;
      }

      const synced = result.value;

      if (synced.metrics.metrics) {
        metrics[name] = synced.metrics.metrics;
        metricsSource[name] = "supabase";
      } else {
        const fallback = staticFighterMetrics[name] || null;
        metrics[name] = fallback;
        metricsSource[name] = fallback ? "static-fallback" : "unavailable";

        if (!fallback) {
          console.warn(`[fighter-metrics] no Supabase or static data available for "${name}"`);
        }
      }

      history[name] = toDisplayHistory(synced.history.history);
    });

    return NextResponse.json({ metrics, metricsSource, history });
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
