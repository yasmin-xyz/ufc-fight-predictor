"use client";

import { useEffect, useRef, useState } from "react";
import { mergeFightData } from "./lib/mergeFightData";

function fightName(fight: any) {
  return `${fight.home_team} vs. ${fight.away_team}`;
}

function getNextEventFights(fights: any[]) {
  if (!fights.length) return [];
  
  // Find the earliest upcoming fight date
  const now = new Date();
  const upcoming = fights
    .filter((f) => new Date(f.commence_time) > now)
    .sort((a, b) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime());
  
  if (!upcoming.length) return [];
  
  // Get the date of the first upcoming fight
  const firstDate = new Date(upcoming[0].commence_time);
  
  // Group all fights within 24 hours of the first fight — same event
  const eventStart = new Date(firstDate);
  eventStart.setHours(0, 0, 0, 0);
  const eventEnd = new Date(eventStart);
  eventEnd.setDate(eventEnd.getDate() + 2); // 48hr window covers UTC date shifts
  
  return upcoming.filter((f) => {
    const fightDate = new Date(f.commence_time);
    return fightDate >= eventStart && fightDate <= eventEnd;
  });
}

function impliedProbability(americanOdds: number) {
  if (!americanOdds) return null;
  if (americanOdds < 0) {
    return Math.round((-americanOdds / (-americanOdds + 100)) * 100);
  }
  return Math.round((100 / (americanOdds + 100)) * 100);
}
function formatAmericanOdds(odds: number | null | undefined) {
  if (odds === null || odds === undefined) return "—";
  return odds > 0 ? `+${odds}` : `${odds}`;
}
function metricNumber(value: string | number | undefined) {
  if (value === undefined || value === null || value === "—") return 0;
  return Number(String(value).replace("%", "")) || 0;
}

function metricWidth(value: string | number | undefined, max: number) {
  const num = metricNumber(value);
  if (!num) return 0;
  return Math.min(Math.round((num / max) * 100), 100);
}
function formatPredictedRound(
  method: string | undefined,
  round: string | number | undefined
) {
  if (!method) return "—";

  if (method.toLowerCase().includes("decision")) {
    return "To go the distance";
  }

  return round || "—";
}

const NAME_SUFFIXES = new Set(["jr.", "jr", "sr.", "sr", "ii", "iii", "iv", "v"]);

function shortName(fullName: string | undefined, fallback = "Fighter") {
  if (!fullName) return fallback;

  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return fallback;

  let last = parts[parts.length - 1];
  if (parts.length > 1 && NAME_SUFFIXES.has(last.toLowerCase())) {
    last = parts[parts.length - 2];
  }

  return last;
}

export default function Home() {
  const [odds, setOdds] = useState<any[]>([]);
  const [loadingOdds, setLoadingOdds] = useState(true);
  const [selectedFight, setSelectedFight] = useState<any>(null);
  const [fighterAStats, setFighterAStats] = useState<any>(null);
const [fighterBStats, setFighterBStats] = useState<any>(null);
  const [ufcEvent, setUfcEvent] = useState<any>(null);
const [mergedFights, setMergedFights] = useState<any[]>([]);
  const [prediction, setPrediction] = useState<any>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [predictionError, setPredictionError] = useState(false);
  const [activeTab, setActiveTab] = useState("main");

  const [fighterAMetrics, setFighterAMetrics] = useState<any>({});
  const [fighterBMetrics, setFighterBMetrics] = useState<any>({});
  const [metricsStatus, setMetricsStatus] = useState<"idle" | "loading" | "polling" | "ready" | "timeout" | "error">("idle");
  const [fighterAMetricsState, setFighterAMetricsState] = useState<string>("");
  const [fighterBMetricsState, setFighterBMetricsState] = useState<string>("");

  const [fighterAHistory, setFighterAHistory] = useState<any[]>([]);
  const [fighterBHistory, setFighterBHistory] = useState<any[]>([]);
  const [historyStatus, setHistoryStatus] = useState<"idle" | "loading" | "polling" | "ready" | "timeout" | "error">("idle");
  const [fighterAHistoryState, setFighterAHistoryState] = useState<string>("");
  const [fighterBHistoryState, setFighterBHistoryState] = useState<string>("");
  const [historyToggle, setHistoryToggle] = useState<"A" | "B">("A");

  const requestIdRef = useRef(0);
  const metricsRequestIdRef = useRef(0);
  const metricsPollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchPrediction(fight: any) {
    if (!fight) return;
  
    const requestId = ++requestIdRef.current;

    setLoadingPrediction(true);
    setPrediction(null);
    setPredictionError(false);

    const bookmaker = fight.odds?.bookmakers?.[0];
    const outcomes = bookmaker?.markets?.[0]?.outcomes || [];
    const homeOdds = outcomes.find((o: any) => o.name === fight.fighterA);
    const awayOdds = outcomes.find((o: any) => o.name === fight.fighterB);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fighterA: fight.fighterA,
          fighterB: fight.fighterB,
          oddsA: homeOdds?.price || 0,
          oddsB: awayOdds?.price || 0,

          fighterAStats,
          fighterBStats,

          fighterAMetrics,
          fighterBMetrics,
        }),
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const data = await res.json();

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!data || (!data.claude && !data.gpt && !data.gemini)) {
        throw new Error("Prediction response was empty");
      }

      setPrediction(data);
    } catch (error) {
      console.error("Failed to fetch prediction:", error);

      if (requestId === requestIdRef.current) {
        setPredictionError(true);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingPrediction(false);
      }
    }
  }

  useEffect(() => {
    async function fetchOdds() {
      try {
        const oddsRes = await fetch("/api/odds");
        const oddsData = await oddsRes.json();
        
        const eventRes = await fetch("/api/ufc-event");
        const eventData = await eventRes.json();
        
        const merged = mergeFightData(eventData.fights, oddsData);
        
        setOdds(oddsData);
        setUfcEvent(eventData);
        setMergedFights(merged);
        
        const mainCardFights = merged.slice(-5).reverse();
const defaultFight = mainCardFights[0] || merged[0];

setSelectedFight(defaultFight);
fetchPrediction(defaultFight);
      } catch (error) {
        console.error("Failed to load odds:", error);
      } finally {
        setLoadingOdds(false);
      }
    }
    fetchOdds();
  }, []);
  useEffect(() => {
    if (!selectedFight?.fighterAId || !selectedFight?.fighterBId) return;
  
    async function loadFighters() {
      try {
        const [fighterARes, fighterBRes] = await Promise.all([
          fetch(`/api/fighter-stats?id=${selectedFight.fighterAId}`),
          fetch(`/api/fighter-stats?id=${selectedFight.fighterBId}`)
        ]);
  
        const fighterA = await fighterARes.json();
        const fighterB = await fighterBRes.json();
  
        setFighterAStats(fighterA);
        setFighterBStats(fighterB);
      } catch (err) {
        console.error("Failed loading fighter stats", err);
      }
    }
  
    loadFighters();
  }, [selectedFight]);

  const METRICS_POLL_INTERVAL_MS = 2000;
  const METRICS_POLL_MAX_MS = 30000;

  async function fetchFighterMetricsAndHistory(
    fight: any,
    requestId: number,
    startedAt: number,
    isPoll: boolean
  ) {
    if (requestId !== metricsRequestIdRef.current) return;

    try {
      const res = await fetch("/api/fighter-metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          names: [fight.fighterA, fight.fighterB],
        }),
      });

      if (!res.ok) throw new Error(`Request failed (${res.status})`);

      const data = await res.json();

      if (requestId !== metricsRequestIdRef.current) return;

      const aMetricsState = data.metricsStatus?.[fight.fighterA] || "";
      const bMetricsState = data.metricsStatus?.[fight.fighterB] || "";
      const aHistoryState = data.historyStatus?.[fight.fighterA] || "";
      const bHistoryState = data.historyStatus?.[fight.fighterB] || "";

      setFighterAMetrics(data.metrics?.[fight.fighterA] || {});
      setFighterBMetrics(data.metrics?.[fight.fighterB] || {});
      setFighterAMetricsState(aMetricsState);
      setFighterBMetricsState(bMetricsState);

      setFighterAHistory(data.history?.[fight.fighterA] || []);
      setFighterBHistory(data.history?.[fight.fighterB] || []);
      setFighterAHistoryState(aHistoryState);
      setFighterBHistoryState(bHistoryState);

      const metricsStillSyncing = aMetricsState === "syncing" || bMetricsState === "syncing";
      const historyStillSyncing = aHistoryState === "syncing" || bHistoryState === "syncing";
      const elapsed = Date.now() - startedAt;
      const timedOut = elapsed >= METRICS_POLL_MAX_MS;

      setMetricsStatus(metricsStillSyncing ? (timedOut ? "timeout" : "polling") : "ready");
      setHistoryStatus(historyStillSyncing ? (timedOut ? "timeout" : "polling") : "ready");

      if ((metricsStillSyncing || historyStillSyncing) && !timedOut) {
        metricsPollTimerRef.current = setTimeout(() => {
          fetchFighterMetricsAndHistory(fight, requestId, startedAt, true);
        }, METRICS_POLL_INTERVAL_MS);
      }
    } catch (error) {
      console.error("Failed loading fighter metrics/history", error);

      if (requestId !== metricsRequestIdRef.current) return;

      if (!isPoll) {
        setFighterAMetrics({});
        setFighterBMetrics({});
        setFighterAMetricsState("");
        setFighterBMetricsState("");
        setMetricsStatus("error");

        setFighterAHistory([]);
        setFighterBHistory([]);
        setFighterAHistoryState("");
        setFighterBHistoryState("");
        setHistoryStatus("error");
        return;
      }

      // A poll attempt failing transiently shouldn't wipe out data we
      // already have — just try again if we're still inside the window.
      const elapsed = Date.now() - startedAt;
      if (elapsed < METRICS_POLL_MAX_MS) {
        metricsPollTimerRef.current = setTimeout(() => {
          fetchFighterMetricsAndHistory(fight, requestId, startedAt, true);
        }, METRICS_POLL_INTERVAL_MS);
      }
    }
  }

  function startMetricsHistoryFetch(fight: any) {
    if (!fight?.fighterA || !fight?.fighterB) return;

    const requestId = ++metricsRequestIdRef.current;
    const startedAt = Date.now();

    if (metricsPollTimerRef.current) {
      clearTimeout(metricsPollTimerRef.current);
      metricsPollTimerRef.current = null;
    }

    setMetricsStatus("loading");
    setHistoryStatus("loading");

    fetchFighterMetricsAndHistory(fight, requestId, startedAt, false);
  }

  useEffect(() => {
    if (!selectedFight?.fighterA || !selectedFight?.fighterB) return;

    setHistoryToggle("A");
    startMetricsHistoryFetch(selectedFight);

    return () => {
      if (metricsPollTimerRef.current) {
        clearTimeout(metricsPollTimerRef.current);
        metricsPollTimerRef.current = null;
      }
    };
  }, [selectedFight]);

  const ufc329Fights = [
    "Conor McGregor vs. Max Holloway",
  ];
  
  const ufc329Odds = odds.filter((fight) =>
    ufc329Fights.includes(`${fight.home_team} vs. ${fight.away_team}`) ||
    ufc329Fights.includes(`${fight.away_team} vs. ${fight.home_team}`)
  );

  const mainCardOdds = mergedFights;
  const mainCardFights = mergedFights.slice(-5).reverse();

  const prelimFights = mergedFights.slice(-9, -5).reverse();
  
  const earlyPrelimFights = mergedFights.slice(0, -9).reverse();
  
  const visibleFights =
    activeTab === "main"
      ? mainCardFights
      : activeTab === "prelims"
      ? prelimFights
      : earlyPrelimFights;

      function handleTabChange(tab: "main" | "prelims" | "early") {
        setActiveTab(tab);
      
        const nextFights =
          tab === "main"
            ? mainCardFights
            : tab === "prelims"
            ? prelimFights
            : earlyPrelimFights;
      
        const firstFight = nextFights[0];
      
        if (!firstFight) {
          setSelectedFight(null);
          setPrediction(null);
          return;
        }
      
        setSelectedFight(firstFight);
        setPrediction(null);
        fetchPrediction(firstFight);
      }

  const firstBookmaker = selectedFight?.odds?.bookmakers?.[0];  
  const outcomes = firstBookmaker?.markets?.[0]?.outcomes || [];
  const homeOdds = outcomes.find((o: any) => o.name === selectedFight?.fighterA);
  const awayOdds = outcomes.find((o: any) => o.name === selectedFight?.fighterB);
  const homeImplied = impliedProbability(homeOdds?.price);
  const awayImplied = impliedProbability(awayOdds?.price);

  const hasMetrics =
  metricsStatus === "ready" &&
  !!fighterAMetrics?.slpm &&
  !!fighterBMetrics?.slpm;
const statRows = [
  {
    name: "Significant Strikes / min",
    a: fighterAMetrics.slpm || "—",
    b: fighterBMetrics.slpm || "—",
    aWidth: metricWidth(fighterAMetrics.slpm, 8),
    bWidth: metricWidth(fighterBMetrics.slpm, 8),
    aAdv: metricNumber(fighterAMetrics.slpm) >= metricNumber(fighterBMetrics.slpm),
  },
  {
    name: "Strike Accuracy",
    a: fighterAMetrics.strAcc || "—",
    b: fighterBMetrics.strAcc || "—",
    aWidth: metricWidth(fighterAMetrics.strAcc, 100),
    bWidth: metricWidth(fighterBMetrics.strAcc, 100),
    aAdv: metricNumber(fighterAMetrics.strAcc) >= metricNumber(fighterBMetrics.strAcc),
  },
  {
    name: "Strikes Absorbed / min",
    a: fighterAMetrics.sapm || "—",
    b: fighterBMetrics.sapm || "—",
    aWidth: metricWidth(fighterAMetrics.sapm, 8),
    bWidth: metricWidth(fighterBMetrics.sapm, 8),
  
    // LOWER is better
    aAdv: metricNumber(fighterAMetrics.sapm) <= metricNumber(fighterBMetrics.sapm),
  },
  {
    name: "Strike Defense",
    a: fighterAMetrics.strDef || "—",
    b: fighterBMetrics.strDef || "—",
    aWidth: metricWidth(fighterAMetrics.strDef, 100),
    bWidth: metricWidth(fighterBMetrics.strDef, 100),
    aAdv: metricNumber(fighterAMetrics.strDef) >= metricNumber(fighterBMetrics.strDef),
  },
  {
    name: "Takedowns / 15min",
    a: fighterAMetrics.tdAvg || "—",
    b: fighterBMetrics.tdAvg || "—",
    aWidth: metricWidth(fighterAMetrics.tdAvg, 6),
    bWidth: metricWidth(fighterBMetrics.tdAvg, 6),
    aAdv: metricNumber(fighterAMetrics.tdAvg) >= metricNumber(fighterBMetrics.tdAvg),
  },
  {
    name: "Takedown Accuracy",
    a: fighterAMetrics.tdAcc || "—",
    b: fighterBMetrics.tdAcc || "—",
    aWidth: metricWidth(fighterAMetrics.tdAcc, 100),
    bWidth: metricWidth(fighterBMetrics.tdAcc, 100),
    aAdv: metricNumber(fighterAMetrics.tdAcc) >= metricNumber(fighterBMetrics.tdAcc),
  },
  {
    name: "Takedown Defense",
    a: fighterAMetrics.tdDef || "—",
    b: fighterBMetrics.tdDef || "—",
    aWidth: metricWidth(fighterAMetrics.tdDef, 100),
    bWidth: metricWidth(fighterBMetrics.tdDef, 100),
    aAdv: metricNumber(fighterAMetrics.tdDef) >= metricNumber(fighterBMetrics.tdDef),
  },
  {
    name: "Submission Attempts / 15min",
    a: fighterAMetrics.subAvg || "—",
    b: fighterBMetrics.subAvg || "—",
    aWidth: metricWidth(fighterAMetrics.subAvg, 3),
    bWidth: metricWidth(fighterBMetrics.subAvg, 3),
    aAdv: metricNumber(fighterAMetrics.subAvg) >= metricNumber(fighterBMetrics.subAvg),
  },
];
  return (
    <main>
     <nav className="nav">
  <div className="nav-logo">
    <span className="nav-logo-pickem">PICK'EM</span>
    <span className="nav-logo-labs">LABS</span>
  </div>
  <div className="nav-links">
    <span className="nav-link" aria-disabled="true">EVENTS</span>
    <span className="nav-link" aria-disabled="true">FIGHTERS</span>
    <span className="nav-link" aria-disabled="true">MY PICKS</span>
    {ufcEvent?.shortName && (
      <span className="nav-badge">{ufcEvent.shortName}</span>
    )}
  </div>
</nav>

<div className="event-bar">
  <div className="event-dot"></div>
  {ufcEvent ? (
    <>
      <span className="event-eyebrow">Next Event</span>
      <span className="event-name">{ufcEvent.eventName}</span>
      <span className="event-date">
        {ufcEvent.date ? new Date(ufcEvent.date).toLocaleDateString() : "—"} · {ufcEvent.venue}
      </span>
    </>
  ) : (
    <span className="event-eyebrow">Loading next event…</span>
  )}
</div>

      <div className="page-header">
        <h1 className="page-title">Fight Analysis</h1>
        <div className="page-sub">
  <span className="page-sub-kicker">AI-powered breakdowns</span>
  <span className="page-sub-event">
    {ufcEvent?.eventName || "Loading…"}
  </span>
</div>
      </div>

      <div className="tabs">
  <button
    type="button"
    className={`tab ${activeTab === "main" ? "active" : ""}`}
    onClick={() => handleTabChange("main")}
  >
    MAIN CARD
  </button>

  <button
    type="button"
    className={`tab ${activeTab === "prelims" ? "active" : ""}`}
    onClick={() => handleTabChange("prelims")}
  >
    PRELIMS
  </button>

  <button
    type="button"
    className={`tab ${activeTab === "early" ? "active" : ""}`}
    onClick={() => handleTabChange("early")}
  >
    EARLY PRELIMS
  </button>
</div>
<div className="fight-selector">
  <div className="fight-selector-inner">
    <label htmlFor="fight-select">
      {activeTab === "main"
        ? "Main Card"
        : activeTab === "prelims"
        ? "Prelims"
        : "Early Prelims"}
    </label>

    <div className="fight-select-wrap">
      <select
        id="fight-select"
        value={selectedFight?.id ? String(selectedFight.id) : ""}
        onChange={(event) => {
          const nextFight = visibleFights.find(
            (fight) => String(fight.id) === event.target.value
          );

          if (!nextFight) return;

          setSelectedFight(nextFight);
          setPrediction(null);
          fetchPrediction(nextFight);
        }}
      >
        {visibleFights.map((fight) => (
          <option key={fight.id} value={String(fight.id)}>
            {fight.fighterA} vs. {fight.fighterB}
          </option>
        ))}
      </select>
    </div>
  </div>
</div>

      <div className="layout">

        
        {/* CENTER — Analysis */}
        <div className="center">

          {/* Tale of the Tape */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-label">Tale of the Tape</h2>
              <span className="weight-pill">MMA</span>
            </div>
            <div className="card-body">
              <div className="tot">
              <div className="fighter-a">
  {fighterAStats?.headshot && (
    <img src={fighterAStats.headshot} alt={selectedFight?.fighterA} className="fighter-headshot" />
  )}
  <div className="fighter-name">{selectedFight?.fighterA || "Loading..."}</div>
                  <div className="fighter-record">{fighterAStats?.record || selectedFight?.recordA || "—"}</div>
                </div>
                <div className="vs-col">
                  <div className="vs-text">vs</div>
                </div>
                <div className="fighter-b">
  {fighterBStats?.headshot && (
    <img src={fighterBStats.headshot} alt={selectedFight?.fighterB} className="fighter-headshot" />
  )}
  <div className="fighter-name">{selectedFight?.fighterB || "Loading..."}</div>
                  <div className="fighter-record">{fighterBStats?.record || selectedFight?.recordB || "—"}</div>
                </div>
              </div>

              <div className="tot-compare">
                {[
                  { label: "Age", a: fighterAStats?.age, b: fighterBStats?.age },
                  { label: "Height", a: fighterAStats?.height, b: fighterBStats?.height },
                  { label: "Reach", a: fighterAStats?.reach, b: fighterBStats?.reach },
                  { label: "Stance", a: fighterAStats?.stance, b: fighterBStats?.stance },
                  { label: "Style", a: fighterAStats?.style, b: fighterBStats?.style },
                ].map((row) => (
                  <div key={row.label} className="tot-compare-row">
                    <span className="tot-compare-val">{row.a || "—"}</span>
                    <span className="tot-compare-label">{row.label}</span>
                    <span className="tot-compare-val">{row.b || "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Statistical Edge */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-label">Statistical Edge</h2>
              <div className="stat-legend">
                <span className="stat-legend-item">
                  <span className="stat-legend-swatch stat-legend-swatch-adv" />Advantage
                </span>
                <span className="stat-legend-item">
                  <span className="stat-legend-swatch stat-legend-swatch-dis" />Disadvantage
                </span>
              </div>
            </div>
            <div className="card-body" aria-live="polite">
  {metricsStatus === "loading" || metricsStatus === "polling" ? (
    <>
      <div className="stat-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton-stat-row">
            <div className="skeleton-shimmer skeleton-val" />
            <div className="skeleton-center">
              <div className="skeleton-shimmer skeleton-label" />
              <div className="skeleton-shimmer skeleton-bar" />
            </div>
            <div className="skeleton-shimmer skeleton-val right" />
          </div>
        ))}
      </div>
      {metricsStatus === "polling" && (
        <div className="skeleton-caption">Updating fighter data…</div>
      )}
    </>
  ) : hasMetrics ? (
    <div className="stat-grid">
      {statRows.map((stat, i) => (
        <div key={i} className="stat-row">
          <div className={`stat-val ${stat.aAdv ? "stat-val-a" : "stat-val-b"}`} style={{ textAlign: "left" }}>
            {stat.a}
          </div>

          <div className="stat-center">
            <div className="stat-name">{stat.name}</div>
            <div className="bar-track">
              <div className="bar-left">
                <div className={`bar-fill-a ${!stat.aAdv ? "dis" : ""}`} style={{ width: `${stat.aWidth}%` }}></div>
              </div>
              <div className="bar-right">
                <div className={`bar-fill-b ${!stat.aAdv ? "adv" : ""}`} style={{ width: `${stat.bWidth}%` }}></div>
              </div>
            </div>
          </div>

          <div className={`stat-val ${!stat.aAdv ? "stat-val-a" : "stat-val-b"}`} style={{ textAlign: "right" }}>
            {stat.b}
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className={`ai-loading ${metricsStatus === "timeout" || metricsStatus === "error" ? "ai-loading-error" : ""}`}>
      {metricsStatus === "timeout"
        ? "Still fetching stats for this matchup — this is taking longer than usual"
        : fighterAMetricsState === "syncing" || fighterBMetricsState === "syncing"
        ? "Fetching fresh stats for this matchup — check back in a moment"
        : "Advanced metrics not loaded for this matchup yet"}
      {metricsStatus === "timeout" && (
        <div>
          <button type="button" className="retry-btn" onClick={() => startMetricsHistoryFetch(selectedFight)}>
            Retry
          </button>
        </div>
      )}
    </div>
  )}
</div>
          </div>

         {/* AI Fight Breakdown */}
<div className="card">
  <div className="card-header">
    <h2 className="card-label">AI Fight Breakdown</h2>
    <span className="ai-models-label">Claude · GPT-4 · Gemini</span>
  </div>

  <div className="card-body" aria-live="polite">
    {loadingPrediction ? (
      <div className="skeleton-ai-breakdown">
        <div className="skeleton-ai-summary">
          <div className="skeleton-shimmer skeleton-ai-summary-label" />
          <div className="skeleton-ai-summary-row">
            <div className="skeleton-shimmer skeleton-ai-summary-val" />
            <div className="skeleton-shimmer skeleton-ai-summary-val" />
          </div>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton-ai-text-block">
            <div className="skeleton-shimmer skeleton-ai-text-label" />
            <div className="skeleton-shimmer skeleton-ai-text-line" />
            <div className="skeleton-shimmer skeleton-ai-text-line skeleton-ai-text-line-short" />
          </div>
        ))}
      </div>
    ) : predictionError ? (
      <div className="ai-loading ai-loading-error">
        Couldn't generate an AI breakdown for this matchup.
        <div>
          <button type="button" className="retry-btn" onClick={() => fetchPrediction(selectedFight)}>
            Retry
          </button>
        </div>
      </div>
    ) : prediction ? (
      <div className="ai-section">
        <div
          className="ai-block prediction-summary"
          style={{
            background: "linear-gradient(135deg, rgba(108,111,232,0.16), rgba(255,255,255,0.03))",
            border: "1px solid rgba(108,111,232,0.28)",
          }}
        >
          <div className="ai-block-label">Prediction Summary</div>

          <div className="prediction-headline">
            <div>
              <div className="cons-eyebrow">Winner</div>
              <div className="prediction-headline-val">
                {prediction.claude?.predictedWinner || "—"}
              </div>
            </div>

            <div className="prediction-headline-right">
              <div className="cons-eyebrow">Confidence</div>
              <div className="prediction-headline-val">
                {prediction.claude?.confidence || "—"}%
              </div>
            </div>
          </div>

          <div className="prediction-details-grid">
          <div className="value-card prediction-method">
              <div className="cons-eyebrow">Method</div>
              <div className="pred-name">{prediction.claude?.method || "—"}</div>
            </div>

            <div className="value-card prediction-round">
              <div className="cons-eyebrow">Round</div>
              <div className="pred-name">
  {formatPredictedRound(
    prediction?.claude?.method,
    prediction?.claude?.round
  )}
</div>
            </div>

            <div className="value-card prediction-lean">
              <div className="cons-eyebrow">Betting Lean</div>
              <div className="pred-name">{prediction.claude?.bettingLean || "—"}</div>
            </div>
          </div>
        </div>

        <div className="ai-block">
          <div className="ai-block-label">Key Advantages — {prediction.claude?.predictedWinner}</div>
          <div className="ai-block-text">{prediction.claude?.keyAdvantages}</div>
        </div>

        <div className="ai-block">
          <div className="ai-block-label">Biggest Risk</div>
          <div className="ai-block-text">{prediction.claude?.biggestRisk}</div>
        </div>

        <div className="ai-block">
          <div className="ai-block-label">Likely Fight Script</div>
          <div className="ai-block-text">{prediction.claude?.fightScript}</div>
        </div>

        <div className="ai-block ai-block-wrong">
          <div className="ai-block-label ai-block-label-wrong">Why the AI could be wrong</div>
          <div className="wrong-list">
            {prediction.claude?.whyWrong?.map((reason: string, i: number) => (
              <div key={i} className="wrong-item">
                <span className="wrong-dot">–</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : (
      <div className="ai-loading">Select a fight to generate analysis</div>
    )}
  </div>
</div>
</div>
        {/* RIGHT — Odds */}
        <div className="right-col">
          <div className="card">
            <div className="card-header">
              <h2 className="card-label">Betting Market</h2>
            </div>
            <div className="card-body" aria-live="polite">
              <div className="odds-col-labels">
                <span className="odds-col-label">Bookmaker</span>
                <div style={{ display: "flex", gap: "26px" }}>
                <span className="odds-col-label">
  {shortName(selectedFight?.fighterA, "Fighter A")}
</span>

<span className="odds-col-label">
  {shortName(selectedFight?.fighterB, "Fighter B")}
</span>
                </div>
              </div>
              {loadingOdds ? (
  Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="skeleton-odds-book">
      <div className="skeleton-shimmer skeleton-odds-name" />
      <div className="skeleton-shimmer skeleton-odds-pair" />
    </div>
  ))
) : selectedFight?.odds?.bookmakers?.length ? (
  selectedFight.odds.bookmakers.map((bookmaker: any, i: number) => {
    const outcomes = bookmaker.markets?.[0]?.outcomes || [];
    const homeOdds = outcomes.find((o: any) => o.name === selectedFight.fighterA);
    const awayOdds = outcomes.find((o: any) => o.name === selectedFight.fighterB);
    // Favorite/underdog by actual odds sign, not by column position.
    const homeIsFavorite = (homeOdds?.price ?? 0) < (awayOdds?.price ?? 0);

    return (
      <div key={i} className="odds-book">
        <span className="book-name">{bookmaker.title}</span>
        <div className="odds-pair">
          <span className={homeIsFavorite ? "odd-fav" : "odd-dog"}>{formatAmericanOdds(homeOdds?.price)}</span>
          <span className={homeIsFavorite ? "odd-dog" : "odd-fav"}>{formatAmericanOdds(awayOdds?.price)}</span>
        </div>
      </div>
    );
  })
) : (
  <div className="ai-loading">Odds not available for this matchup</div>
)}
            </div>
          </div>

          {/* Value Analysis */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-label">Value Analysis</h2>
            </div>
            <div className="card-body">
            <div className="value-analysis">
  <div className="value-section">
    <div className="value-section-title">Sportsbook Probability</div>

    <div className="value-analysis-row">
      <span className="value-fighter">
        {shortName(selectedFight?.fighterA, "Fighter A")}
      </span>
      <span className="value-percentage">
        {homeImplied ? `${homeImplied}%` : "—"}
      </span>
    </div>

    <div className="value-analysis-row">
      <span className="value-fighter">
        {shortName(selectedFight?.fighterB, "Fighter B")}
      </span>
      <span className="value-percentage">
        {awayImplied ? `${awayImplied}%` : "—"}
      </span>
    </div>
  </div>

  <div className="value-divider" />

  <div className="value-section">
    <div className="value-section-title">AI Estimated Win Probability</div>

    <div className="value-analysis-row value-ai-row">
      <span className="value-fighter">
        {prediction?.consensus?.winner || "Pending AI"}
      </span>
      <span className="value-percentage">
        {prediction?.consensus?.confidence
          ? `${prediction.consensus.confidence}%`
          : "—"}
      </span>
    </div>
  </div>

  <div className="value-analysis-row value-edge-row">
    <div>
      <div className="value-section-title">Value Edge</div>
      <div className="value-edge-label">
        {prediction?.consensus?.confidence && homeImplied
          ? (() => {
              const edge = prediction.consensus.confidence - homeImplied;

              if (edge >= 10) return "Strong Value";
              if (edge >= 6) return "Good Value";
              if (edge >= 3) return "Small Value";
              if (edge > 0) return "Tiny Edge";

              return "No Value";
            })()
          : "Pending AI"}
      </div>
    </div>

    {prediction?.consensus?.confidence && homeImplied ? (() => {
      const edge = prediction.consensus.confidence - homeImplied;

      return (
        <span className={edge > 0 ? "edge-pos" : "edge-neg"}>
          {edge > 0 ? `+${edge}%` : `${edge}%`}
        </span>
      );
    })() : (
      <span className="value-percentage">—</span>
    )}
  </div>
</div>
            </div>
          </div>

          {/* Multi-Model Consensus */}
<div className="card">
  <div className="card-header">
    <h2 className="card-label">AI Consensus</h2>
  </div>

  <div className="card-body">
    {(() => {
      const models = [
        { model: "Claude", color: "#CF9B60", prediction: prediction?.claude },
        { model: "GPT-4", color: "#5DC98A", prediction: prediction?.gpt },
        { model: "Gemini", color: "#5B9EE8", prediction: prediction?.gemini },
      ];

      const readyModels = models.filter((m) => m.prediction);
      const consensusWinner = prediction?.consensus?.winner;

      const agreeingModels = readyModels.filter(
        (m) => m.prediction?.predictedWinner === consensusWinner
      );

      return (
        <>
          <div className="consensus-result">
            <div>
              <div className="cons-eyebrow">Consensus pick</div>
              <div className="cons-pick">{consensusWinner || "Pending AI"}</div>
            </div>

            <div className="cons-pct-wrap">
              <div className="cons-pct">
                {prediction?.consensus?.confidence
                  ? `${prediction.consensus.confidence}%`
                  : "—"}
              </div>
              <div className="cons-pct-label">avg. confidence</div>
            </div>
          </div>

          <div
            className={`model-agreement ${
              readyModels.length > 0 && agreeingModels.length === readyModels.length
                ? "model-agreement-full"
                : ""
            }`}
          >
            <span className="model-agreement-label">Model Agreement</span>
            <span className="model-agreement-val">
              {readyModels.length ? `${agreeingModels.length} / ${readyModels.length}` : "Pending"}
            </span>
          </div>

          {models.map((m, i) => {
            const pick = m.prediction?.predictedWinner || "Pending";
            const agrees = pick === consensusWinner && pick !== "Pending";

            return (
              <div key={i} className="model-row">
                <div className="model-name">
                  <div className="model-dot" style={{ background: m.color }}></div>
                  {m.model}
                </div>

                <div className="model-right">
                  <div className="model-pick">
                    {m.prediction ? (agrees ? "✓ " : "✕ ") : ""}
                    {pick}
                  </div>
                  <div className="model-conf">
                    {m.prediction ? `${m.prediction.confidence}% confidence` : "— confidence"}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      );
    })()}
  </div>
</div>

          {/* Fight History */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-label">Fight History</h2>
            </div>
            <div className="card-body" aria-live="polite">
              <div className="fighter-toggle" role="group" aria-label="Show fight history for">
                <button
                  type="button"
                  className={`toggle-btn ${historyToggle === "A" ? "toggle-active" : ""}`}
                  aria-pressed={historyToggle === "A"}
                  onClick={() => setHistoryToggle("A")}
                >
                  {shortName(selectedFight?.fighterA, "Fighter A")}
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${historyToggle === "B" ? "toggle-active" : ""}`}
                  aria-pressed={historyToggle === "B"}
                  onClick={() => setHistoryToggle("B")}
                >
                  {shortName(selectedFight?.fighterB, "Fighter B")}
                </button>
              </div>

              {historyStatus === "loading" || historyStatus === "polling" ? (
                <>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton-history-row">
                      <div className="skeleton-history-header">
                        <div className="skeleton-shimmer skeleton-history-opponent" />
                        <div className="skeleton-shimmer skeleton-history-badge" />
                      </div>
                      <div className="skeleton-shimmer skeleton-history-meta" />
                      <div className="skeleton-shimmer skeleton-history-result-line" />
                    </div>
                  ))}
                  {historyStatus === "polling" && (
                    <div className="skeleton-caption">Updating fighter data…</div>
                  )}
                </>
              ) : historyStatus === "error" ? (
                <div className="ai-loading ai-loading-error">Fight history unavailable</div>
              ) : historyStatus === "timeout" ? (
                <div className="ai-loading ai-loading-error">
                  Recent fight history is still being prepared.
                  <div>
                    <button type="button" className="retry-btn" onClick={() => startMetricsHistoryFetch(selectedFight)}>
                      Retry
                    </button>
                  </div>
                </div>
              ) : (() => {
                // Show the 3 most recent — keeps this card's height in line
                // with the rest of the right column instead of running well
                // past the center column.
                const activeHistory = (historyToggle === "A" ? fighterAHistory : fighterBHistory).slice(0, 3);
                const activeHistoryState = historyToggle === "A" ? fighterAHistoryState : fighterBHistoryState;

                if (activeHistory.length === 0) {
                  return (
                    <div className="ai-loading">
                      {activeHistoryState === "syncing"
                        ? "Fetching fight history — check back in a moment"
                        : "No fight history available"}
                    </div>
                  );
                }

                return activeHistory.map((fight: any, i: number) => (
                  <div key={i} className="history-fight">
                    <div className="history-header">
                      <span className="history-opponent">{fight.opponent || "Unknown opponent"}</span>
                      <span className={`history-result ${fight.result === "win" ? "result-w" : "result-l"}`}>
                        {fight.result === "win" ? "W" : "L"}
                      </span>
                    </div>
                    <div className="history-meta">
                      {fight.event || "Unknown event"}
                      {fight.date ? ` · ${new Date(fight.date).toLocaleDateString()}` : ""}
                    </div>
                    <div className="history-result-line">
                      {fight.method || "—"}
                      {fight.round ? ` · Round ${fight.round}` : ""}
                      {fight.time ? ` · ${fight.time}` : ""}
                    </div>
                  </div>
                ));
              })()}

              <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.22)", textAlign: "center", marginTop: "12px" }}>
                Fighter statistics and history via Cito API.
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}