"use client";

import { useEffect, useState } from "react";
import { mergeFightData } from "./lib/mergeFightData";
import { fighterMetrics } from "./data/fighterMetrics";

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

  async function fetchPrediction(fight: any) {
    if (!fight) return;
    setLoadingPrediction(true);
    setPrediction(null);

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
        }),
      });
      const data = await res.json();
      setPrediction(data);
    } catch (error) {
      console.error("Failed to fetch prediction:", error);
    } finally {
      setLoadingPrediction(false);
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
        
        const defaultFight = merged[0];
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
  const ufc329Fights = [
    "Conor McGregor vs. Max Holloway",
  ];
  
  const ufc329Odds = odds.filter((fight) =>
    ufc329Fights.includes(`${fight.home_team} vs. ${fight.away_team}`) ||
    ufc329Fights.includes(`${fight.away_team} vs. ${fight.home_team}`)
  );

  const mainCardOdds = mergedFights;

  const firstBookmaker = selectedFight?.odds?.bookmakers?.[0];  
  const outcomes = firstBookmaker?.markets?.[0]?.outcomes || [];
  const homeOdds = outcomes.find((o: any) => o.name === selectedFight?.fighterA);
  const awayOdds = outcomes.find((o: any) => o.name === selectedFight?.fighterB);
  const homeImplied = impliedProbability(homeOdds?.price);
  const awayImplied = impliedProbability(awayOdds?.price);

  const fighterAMetrics = fighterMetrics[selectedFight?.fighterA] || {};
const fighterBMetrics = fighterMetrics[selectedFight?.fighterB] || {};

const statRows = [
  { name: "Significant Strikes / min", a: fighterAMetrics.slpm || "—", b: fighterBMetrics.slpm || "—", aWidth: 92, bWidth: 72, aAdv: true },
  { name: "Strike Accuracy", a: fighterAMetrics.strAcc || "—", b: fighterBMetrics.strAcc || "—", aWidth: 96, bWidth: 76, aAdv: true },
  { name: "Strike Defense", a: fighterAMetrics.strDef || "—", b: fighterBMetrics.strDef || "—", aWidth: 80, bWidth: 88, aAdv: false },
  { name: "Takedown Accuracy", a: fighterAMetrics.tdAcc || "—", b: fighterBMetrics.tdAcc || "—", aWidth: 98, bWidth: 44, aAdv: true },
  { name: "Takedown Defense", a: fighterAMetrics.tdDef || "—", b: fighterBMetrics.tdDef || "—", aWidth: 84, bWidth: 92, aAdv: false },
  { name: "Submission Attempts / 15min", a: fighterAMetrics.subAvg || "—", b: fighterBMetrics.subAvg || "—", aWidth: 94, bWidth: 20, aAdv: true },
];
  return (
    <main>
     <nav className="nav">
  <div className="nav-logo">
    <span className="nav-logo-pickem">PICK'EM</span>
    <span className="nav-logo-labs">LABS</span>
  </div>
  <div className="nav-links">
    <span className="nav-link">EVENTS</span>
    <span className="nav-link">FIGHTERS</span>
    <span className="nav-link">MY PICKS</span>
    <span className="nav-badge">
      {ufcEvent?.shortName || "Loading event..."}
    </span>
  </div>
</nav>

<div className="event-bar">
  <div className="event-dot"></div>
  <span className="event-eyebrow">Next Event</span>
  <span className="event-name">{ufcEvent?.eventName || "Loading event..."}</span>
  <span className="event-date">
    {ufcEvent?.date ? new Date(ufcEvent.date).toLocaleDateString() : "Loading date..."} · {ufcEvent?.venue || "Loading venue..."}
  </span>
</div>

      <div className="page-header">
        <div className="page-title">Fight Analysis</div>
        <div className="page-sub">AI-powered breakdowns · {ufcEvent?.eventName || "Loading event..."} main card</div>
      </div>

      <div className="tabs">
        <div className="tab active">MAIN CARD</div>
        <div className="tab">PRELIMS</div>
        <div className="tab">EARLY PRELIMS</div>
      </div>

      <div className="layout">

        {/* LEFT — Fight List */}
        <div>
          <div className="card">
            <div className="card-header">
              <span className="card-label">Main Card</span>
              <span className="card-meta">{mainCardOdds.length} fights</span>
            </div>
            <div className="fight-list">
              {mainCardOdds.map((fight, i) => (
                <div
                  key={fight.id || i}
                  onClick={() => {
                    setSelectedFight(fight);
                    setPrediction(null);
                    fetchPrediction(fight);
                  }}
                  className={`fight-item${selectedFight?.id === fight.id ? " active" : ""}`}
                >
                  <div className="fight-names">{fight.fighterA} vs. {fight.fighterB}</div>
                  <div className="fight-meta">
                    <span className="fight-wc">MMA</span>
                  </div>
                  <div className="fight-pick-row">
                  <span className="fight-pick-name">
  {fight.odds?.bookmakers?.length ? "Odds available" : "No odds yet"}
</span> 
                    <span className="fight-pick-pct">
  {fight.odds?.bookmakers?.length ? `${fight.odds.bookmakers.length} books` : "No odds yet"}
</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER — Analysis */}
        <div className="center">

          {/* Tale of the Tape */}
          <div className="card">
            <div className="card-header">
              <span className="card-label">Tale of the Tape</span>
              <span className="weight-pill">MMA</span>
            </div>
            <div className="card-body">
              <div className="tot">
                <div className="fighter-a">
                  <div className="fighter-name">{selectedFight?.fighterA || "Loading..."}</div>
                  <div className="fighter-record">{fighterAStats?.record || selectedFight?.recordA || "—"}</div>
<div className="fighter-meta">
  <span>Age {fighterAStats?.age || "—"}</span>
  <span>{fighterAStats?.height || "Height —"}</span>
  <span>{fighterAStats?.reach || "Reach —"}</span>
  <span>{fighterAStats?.stance || "Stance —"}</span>
  <span>{fighterAStats?.style || "Style —"}</span>
</div>
                </div>
                <div className="vs-col">
                  <div className="vs-text">vs</div>
                </div>
                <div className="fighter-b">
                  <div className="fighter-name">{selectedFight?.fighterB || "Loading..."}</div>
                  <div className="fighter-record">{fighterBStats?.record || selectedFight?.recordB || "—"}</div>
<div className="fighter-meta">
  <span>Age {fighterBStats?.age || "—"}</span>
  <span>{fighterBStats?.height || "Height —"}</span>
  <span>{fighterBStats?.reach || "Reach —"}</span>
  <span>{fighterBStats?.stance || "Stance —"}</span>
  <span>{fighterBStats?.style || "Style —"}</span>
</div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistical Edge */}
          <div className="card">
            <div className="card-header">
              <span className="card-label">Statistical Edge</span>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", color: "rgba(255,255,255,0.28)" }}>
                  <div style={{ width: "10px", height: "3px", borderRadius: "2px", background: "#6C6FE8" }}></div>Advantage
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px", color: "rgba(255,255,255,0.28)" }}>
                  <div style={{ width: "10px", height: "3px", borderRadius: "2px", background: "rgba(108,111,232,0.22)" }}></div>Disadvantage
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="stat-grid">
                {[
                  { name: "Significant Strikes / min", a: "4.12", b: "3.54", aWidth: 92, bWidth: 72, aAdv: true },
                  { name: "Strike Accuracy", a: "58%", b: "48%", aWidth: 96, bWidth: 76, aAdv: true },
                  { name: "Strike Defense", a: "67%", b: "71%", aWidth: 80, bWidth: 88, aAdv: false },
                  { name: "Takedown Accuracy", a: "82%", b: "38%", aWidth: 98, bWidth: 44, aAdv: true },
                  { name: "Takedown Defense", a: "74%", b: "78%", aWidth: 84, bWidth: 92, aAdv: false },
                  { name: "Submission Attempts / 15min", a: "1.4", b: "0.4", aWidth: 94, bWidth: 20, aAdv: true },
                ].map((stat, i) => (
                  <div key={i} className="stat-row">
                    <div className={`stat-val ${stat.aAdv ? "stat-val-a" : "stat-val-b"}`} style={{ textAlign: "left" }}>{stat.a}</div>
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
                    <div className={`stat-val ${!stat.aAdv ? "stat-val-a" : "stat-val-b"}`} style={{ textAlign: "right" }}>{stat.b}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

         {/* AI Fight Breakdown */}
<div className="card">
  <div className="card-header">
    <span className="card-label">AI Fight Breakdown</span>
    <span className="ai-models-label">Claude · GPT-4 · Gemini</span>
  </div>

  <div className="card-body">
    {loadingPrediction ? (
      <div className="ai-loading">Generating analysis...</div>
    ) : prediction ? (
      <div className="ai-section">
        <div
          className="ai-block"
          style={{
            background: "linear-gradient(135deg, rgba(108,111,232,0.16), rgba(255,255,255,0.03))",
            border: "1px solid rgba(108,111,232,0.28)",
          }}
        >
          <div className="ai-block-label">Prediction Summary</div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "24px" }}>
            <div>
              <div className="cons-eyebrow">Winner</div>
              <div className="pred-name" style={{ fontSize: "22px" }}>
                {prediction.claude?.predictedWinner || "—"}
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div className="cons-eyebrow">Confidence</div>
              <div className="pred-name" style={{ fontSize: "22px" }}>
                {prediction.claude?.confidence || "—"}%
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginTop: "18px" }}>
            <div className="value-card">
              <div className="cons-eyebrow">Method</div>
              <div className="pred-name">{prediction.claude?.method || "—"}</div>
            </div>

            <div className="value-card">
              <div className="cons-eyebrow">Round</div>
              <div className="pred-name">{prediction.claude?.round || "—"}</div>
            </div>

            <div className="value-card">
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
              <span className="card-label">Betting Market</span>
            </div>
            <div className="card-body">
              <div className="odds-col-labels">
                <span className="odds-col-label">Bookmaker</span>
                <div style={{ display: "flex", gap: "26px" }}>
                <span className="odds-col-label">
  {selectedFight?.fighterA?.split(" ").pop() || "Fighter A"}
</span>

<span className="odds-col-label">
  {selectedFight?.fighterB?.split(" ").pop() || "Fighter B"}
</span>
                </div>
              </div>
              {selectedFight?.odds?.bookmakers?.length ? (
  selectedFight.odds.bookmakers.map((bookmaker: any, i: number) => {
    const outcomes = bookmaker.markets?.[0]?.outcomes || [];
    const homeOdds = outcomes.find((o: any) => o.name === selectedFight.fighterA);
    const awayOdds = outcomes.find((o: any) => o.name === selectedFight.fighterB);

    return (
      <div key={i} className="odds-book">
        <span className="book-name">{bookmaker.title}</span>
        <div className="odds-pair">
          <span className="odd-fav">{formatAmericanOdds(homeOdds?.price)}</span>
          <span className="odd-dog">{formatAmericanOdds(awayOdds?.price)}</span>
        </div>
      </div>
    );
  })
) : (
  <div className="ai-loading">Odds not available yet</div>
)}
            </div>
          </div>

          {/* Value Analysis */}
          <div className="card">
            <div className="card-header">
              <span className="card-label">Value Analysis</span>
            </div>
            <div className="card-body">
              <div className="value-card">
                <div className="value-row">
                  <span className="value-label">{selectedFight?.fighterA?.split(" ").pop() || "Fighter A"} — Market Implied</span>
                  <span className="value-num">{homeImplied !== null ? `${homeImplied}%` : "—"}</span>
                </div>
                <div className="value-row">
                  <span className="value-label">{selectedFight?.fighterB?.split(" ").pop() || "Fighter B"} — Market Implied</span>
                  <span className="value-num">{awayImplied !== null ? `${awayImplied}%` : "—"}</span>
                </div>
                <hr className="edge-divider" />
                <div className="value-row">
                  <span className="value-label">AI Win Probability</span>
                  <span className="value-num">{prediction?.consensus?.confidence ? `${prediction.consensus.confidence}%` : "Pending AI"}</span>
                </div>
                <div className="value-row">
                  <span className="value-label">Value Edge</span>
                  {prediction?.consensus?.confidence && homeImplied ? (
  <span className={prediction.consensus.confidence > homeImplied ? "edge-pos" : "edge-neg"}>
    {prediction.consensus.confidence > homeImplied
      ? `+${prediction.consensus.confidence - homeImplied}% edge`
      : `–${homeImplied - prediction.consensus.confidence}% no edge`}
  </span>
                  ) : (
                    <span className="value-num">Pending AI</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Model Consensus */}
          <div className="card">
            <div className="card-header">
              <span className="card-label">Multi-Model Consensus</span>
            </div>
            <div className="card-body">
              {[
                { model: "Claude", color: "#CF9B60", pick: prediction?.claude?.predictedWinner || "Pending", conf: prediction?.claude ? `${prediction.claude.confidence}%` : "—" },
                { model: "GPT-4", color: "#5DC98A", pick: prediction?.gpt?.predictedWinner || "Pending", conf: prediction?.gpt ? `${prediction.gpt.confidence}%` : "—" },
                { model: "Gemini", color: "#5B9EE8", pick: prediction?.gemini?.predictedWinner || "Pending", conf: prediction?.gemini ? `${prediction.gemini.confidence}%` : "—" },
              ].map((m, i) => (
                <div key={i} className="model-row">
                  <div className="model-name">
                    <div className="model-dot" style={{ background: m.color }}></div>
                    {m.model}
                  </div>
                  <div className="model-right">
                    <div className="model-pick">{m.pick}</div>
                    <div className="model-conf">{m.conf} confidence</div>
                  </div>
                </div>
              ))}
              <div className="consensus-result">
                <div>
                  <div className="cons-eyebrow">Consensus pick</div>
                  <div className="cons-pick">{prediction?.consensus?.winner || "Pending AI"}</div>
                </div>
                <div className="cons-pct">
  {prediction?.consensus?.confidence ? `${prediction.consensus.confidence}%` : "—"}
</div>
              </div>
            </div>
          </div>

          {/* Fight History */}
          <div className="card">
            <div className="card-header">
              <span className="card-label">Fight History</span>
            </div>
            <div className="card-body">
              <div className="fighter-toggle">
                <div className="toggle-btn toggle-active">{selectedFight?.fighterA?.split(" ").pop() || "Fighter A"}</div>
                <div className="toggle-btn">{selectedFight?.fighterB?.split(" ").pop() || "Fighter B"}</div>
              </div>
              <div className="ai-loading">Fight history coming soon</div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}