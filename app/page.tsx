"use client";

import { useEffect, useState } from "react";

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

export default function Home() {
  const [odds, setOdds] = useState<any[]>([]);
  const [loadingOdds, setLoadingOdds] = useState(true);
  const [selectedFight, setSelectedFight] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  async function fetchPrediction(fight: any) {
    if (!fight) return;
    setLoadingPrediction(true);
    setPrediction(null);

    const bookmaker = fight.bookmakers?.[0];
    const outcomes = bookmaker?.markets?.[0]?.outcomes || [];
    const homeOdds = outcomes.find((o: any) => o.name === fight.home_team);
    const awayOdds = outcomes.find((o: any) => o.name === fight.away_team);
    const homeImpl = impliedProbability(homeOdds?.price);
    const awayImpl = impliedProbability(awayOdds?.price);

    try {
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fighterA: fight.home_team,
          fighterB: fight.away_team,
          oddsA: homeOdds?.price,
          oddsB: awayOdds?.price,
          impliedA: homeImpl,
          impliedB: awayImpl,
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
        const res = await fetch("/api/odds");
        const data = await res.json();
        setOdds(data);
        const nextEvent = getNextEventFights(data);
        const defaultFight = nextEvent[0] || data[0];
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

  const nextEventFights = getNextEventFights(odds);
  const mainCardOdds = nextEventFights;

  const firstBookmaker = selectedFight?.bookmakers?.[0];
  const outcomes = firstBookmaker?.markets?.[0]?.outcomes || [];
  const homeOdds = outcomes.find((o: any) => o.name === selectedFight?.home_team);
  const awayOdds = outcomes.find((o: any) => o.name === selectedFight?.away_team);
  const homeImplied = impliedProbability(homeOdds?.price);
  const awayImplied = impliedProbability(awayOdds?.price);

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
          <span className="nav-badge">UFC 316 · Jun 28</span>
        </div>
      </nav>

      <div className="event-bar">
        <div className="event-dot"></div>
        <span className="event-eyebrow">Next Event</span>
        <span className="event-name">UFC 316 — Makhachev vs. Poirier</span>
        <span className="event-date">Jun 28, 2026 · T-Mobile Arena, Las Vegas</span>
      </div>

      <div className="page-header">
        <div className="page-title">Fight Analysis</div>
        <div className="page-sub">AI-powered breakdowns · UFC 316 main card</div>
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
                  onClick={() => { setSelectedFight(fight); fetchPrediction(fight); }}
                  className={`fight-item${selectedFight?.id === fight.id ? " active" : ""}`}
                >
                  <div className="fight-names">{fight.home_team} vs. {fight.away_team}</div>
                  <div className="fight-meta">
                    <span className="fight-wc">MMA</span>
                    {i === 0 && <span className="fight-tag">Live Odds</span>}
                  </div>
                  <div className="fight-pick-row">
                    <span className="fight-pick-name">Odds available</span>
                    <span className="fight-pick-pct">{fight.bookmakers?.length || 0} books</span>
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
                  <div className="fighter-name">{selectedFight?.home_team || "Loading..."}</div>
                  <div className="fighter-meta">
                    <span>Stats loading soon</span>
                  </div>
                </div>
                <div className="vs-col">
                  <div className="vs-text">vs</div>
                </div>
                <div className="fighter-b">
                  <div className="fighter-name">{selectedFight?.away_team || "Loading..."}</div>
                  <div className="fighter-meta" style={{ alignItems: "flex-end" }}>
                    <span>Stats loading soon</span>
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
                  <div className="ai-block">
                    <div className="ai-block-label">Key Advantages — {prediction.predictedWinner}</div>
                    <div className="ai-block-text">{prediction.keyAdvantages}</div>
                  </div>
                  <div className="ai-block">
                    <div className="ai-block-label">Biggest Risk</div>
                    <div className="ai-block-text">{prediction.biggestRisk}</div>
                  </div>
                  <div className="ai-block">
                    <div className="ai-block-label">Likely Fight Script</div>
                    <div className="ai-block-text">{prediction.fightScript}</div>
                  </div>
                  <div className="ai-block">
                    <div className="ai-block-label">Prediction</div>
                    <div className="pred-row">
                      <div className="pred-name">{prediction.predictedWinner}</div>
                      <div className="pred-conf">{prediction.confidence}% confidence</div>
                    </div>
                    <div className="conf-track">
                      <div className="conf-fill" style={{ width: `${prediction.confidence}%` }}></div>
                    </div>
                  </div>
                  <div className="ai-block ai-block-wrong">
                    <div className="ai-block-label ai-block-label-wrong">Why the AI could be wrong</div>
                    <div className="wrong-list">
                      {prediction.whyWrong?.map((reason: string, i: number) => (
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
                  <span className="odds-col-label">{selectedFight?.home_team?.split(" ").pop() || "Fighter A"}</span>
                  <span className="odds-col-label">{selectedFight?.away_team?.split(" ").pop() || "Fighter B"}</span>
                </div>
              </div>
              {selectedFight?.bookmakers?.map((bookmaker: any, i: number) => {
                const outcomes = bookmaker.markets?.[0]?.outcomes || [];
                const homeOdds = outcomes.find((o: any) => o.name === selectedFight.home_team);
                const awayOdds = outcomes.find((o: any) => o.name === selectedFight.away_team);
                return (
                  <div key={i} className="odds-book">
                    <span className="book-name">{bookmaker.title}</span>
                    <div className="odds-pair">
                      <span className="odd-fav">{homeOdds?.price ?? "—"}</span>
                      <span className="odd-dog">{awayOdds?.price ?? "—"}</span>
                    </div>
                  </div>
                );
              })}
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
                  <span className="value-label">{selectedFight?.home_team?.split(" ").pop() || "Fighter A"} — Market Implied</span>
                  <span className="value-num">{homeImplied !== null ? `${homeImplied}%` : "—"}</span>
                </div>
                <div className="value-row">
                  <span className="value-label">{selectedFight?.away_team?.split(" ").pop() || "Fighter B"} — Market Implied</span>
                  <span className="value-num">{awayImplied !== null ? `${awayImplied}%` : "—"}</span>
                </div>
                <hr className="edge-divider" />
                <div className="value-row">
                  <span className="value-label">AI Win Probability</span>
                  <span className="value-num">{prediction ? `${prediction.confidence}%` : "Pending AI"}</span>
                </div>
                <div className="value-row">
                  <span className="value-label">Value Edge</span>
                  {prediction && homeImplied ? (
                    <span className={prediction.confidence > homeImplied ? "edge-pos" : "edge-neg"}>
                      {prediction.confidence > homeImplied
                        ? `+${prediction.confidence - homeImplied}% edge`
                        : `–${homeImplied - prediction.confidence}% no edge`}
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
                { model: "Claude", color: "#CF9B60", pick: prediction?.predictedWinner || "Pending", conf: prediction ? `${prediction.confidence}%` : "—" },
                { model: "GPT-4", color: "#5DC98A", pick: "Pending", conf: "—" },
                { model: "Gemini", color: "#5B9EE8", pick: "Pending", conf: "—" },
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
                  <div className="cons-pick">{prediction?.predictedWinner || "Pending AI"}</div>
                </div>
                <div className="cons-pct">{prediction ? `${prediction.confidence}%` : "—"}</div>
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
                <div className="toggle-btn toggle-active">{selectedFight?.home_team?.split(" ").pop() || "Fighter A"}</div>
                <div className="toggle-btn">{selectedFight?.away_team?.split(" ").pop() || "Fighter B"}</div>
              </div>
              <div className="ai-loading">Fight history coming soon</div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}