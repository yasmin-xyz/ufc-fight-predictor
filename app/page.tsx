"use client";

import { useEffect, useState } from "react";

const mainCardFights = [
  "Manel Kape vs. Kyoji Horiguchi",
  "Ion Cutelaba vs. Navajo Stirling",
];

const prelimFights = [
  "Andre Fili vs. Vinicius Oliveira",
  "Hyder Amil vs. Christian Rodriguez",
  "Andre Lima vs. Kevin Borjas",
];

function fightName(fight: any) {
  return `${fight.home_team} vs. ${fight.away_team}`;
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

  useEffect(() => {
    async function fetchOdds() {
      try {
        const res = await fetch("/api/odds");
        const data = await res.json();
        setOdds(data);
        const firstMainCardFight = data.find((fight: any) =>
          mainCardFights.includes(fightName(fight))
        );
        setSelectedFight(firstMainCardFight || data[0]);
      } catch (error) {
        console.error("Failed to load odds:", error);
      } finally {
        setLoadingOdds(false);
      }
    }
    fetchOdds();
  }, []);

  const mainCardOdds = odds.filter((fight) =>
    mainCardFights.includes(fightName(fight))
  );

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
                onClick={() => setSelectedFight(fight)}
                className={`fight-item${selectedFight?.id === fight.id ? " active" : ""}`}
              >
                  <div className="fight-names">
  {fight.home_team} vs. {fight.away_team}
</div>
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
              <span className="weight-pill">Lightweight · 155 lbs</span>
            </div>
            <div className="card-body">
              <div className="tot">
                <div className="fighter-a">
                <div className="fighter-name">{selectedFight?.home_team || "Loading..."}</div>
                  <div className="fighter-record">26–1–0</div>
                  <div className="fighter-meta">
                    <span>Age 32</span>
                    <span>70.5" reach</span>
                    <span>Orthodox</span>
                    <span>Dagestan, Russia</span>
                  </div>
                </div>
                <div className="vs-col">
                  <div className="vs-text">vs</div>
                </div>
                <div className="fighter-b">
                <div className="fighter-name">{selectedFight?.away_team || "Loading..."}</div>
                  <div className="fighter-record">30–8–0</div>
                  <div className="fighter-meta" style={{ alignItems: "flex-end" }}>
                    <span>Age 35</span>
                    <span>72" reach</span>
                    <span>Southpaw</span>
                    <span>Lafayette, USA</span>
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
              <div className="ai-section">
                <div className="ai-block">
                  <div className="ai-block-label">Key Advantages — Makhachev</div>
                  <div className="ai-block-text">Elite grappling with <strong>82% takedown accuracy</strong> gives Makhachev control of where this fight happens. His submission rate from top position is unmatched at lightweight, and Poirier has historically been vulnerable once taken down.</div>
                </div>
                <div className="ai-block">
                  <div className="ai-block-label">Biggest Risk</div>
                  <div className="ai-block-text">Poirier&apos;s <strong>left hand on the counter</strong> is the most dangerous weapon in this fight. If Makhachev shoots without setting up combinations first, he risks walking into fight-ending power.</div>
                </div>
                <div className="ai-block">
                  <div className="ai-block-label">Likely Fight Script</div>
                  <div className="ai-block-text">Makhachev pressures early using leg kicks to set up takedowns. Poirier looks to land the left hand on the way in. If Dustin survives the first two rounds standing, his cardio gives him a real path. Most likely outcome: <strong>Makhachev by submission, round 3</strong>.</div>
                </div>
                <div className="ai-block">
                  <div className="ai-block-label">Prediction</div>
                  <div className="pred-row">
                    <div className="pred-name">Islam Makhachev</div>
                    <div className="pred-conf">72% confidence</div>
                  </div>
                  <div className="conf-track">
                    <div className="conf-fill" style={{ width: "72%" }}></div>
                  </div>
                </div>
                <div className="ai-block ai-block-wrong">
                  <div className="ai-block-label ai-block-label-wrong">Why the AI could be wrong</div>
                  <div className="wrong-list">
                    <div className="wrong-item"><span className="wrong-dot">–</span><span>Poirier&apos;s takedown defense has improved significantly over his last 4 fights, now sitting at 71%</span></div>
                    <div className="wrong-item"><span className="wrong-dot">–</span><span>Makhachev has never faced a pure striker with Dustin&apos;s combination of power and volume at 155</span></div>
                    <div className="wrong-item"><span className="wrong-dot">–</span><span>Small sample size against elite southpaw opponents</span></div>
                  </div>
                </div>
              </div>
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
  {selectedFight?.home_team?.split(" ").pop() || "Fighter A"}
</span>
<span className="odds-col-label">
  {selectedFight?.away_team?.split(" ").pop() || "Fighter B"}
</span>
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

          {/* Value Edge */}
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
                  <span className="value-num">Pending AI</span>
                </div>
                <div className="value-row">
                  <span className="value-label">Value Edge</span>
                  <span className="value-num">Pending AI</span>
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
                { model: "Claude", color: "#CF9B60", pick: "Makhachev", conf: "72%" },
                { model: "GPT-4", color: "#5DC98A", pick: "Makhachev", conf: "68%" },
                { model: "Gemini", color: "#5B9EE8", pick: "Poirier", conf: "54%" },
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
                  <div className="cons-pick">Makhachev</div>
                </div>
                <div className="cons-pct">67%</div>
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
                <div className="toggle-btn toggle-active">Makhachev</div>
                <div className="toggle-btn">Poirier</div>
              </div>
              {[
                { opp: "vs. Charles Oliveira", result: "W · Sub R2", resultClass: "result-w", date: "Oct 2022 · UFC 280 · Abu Dhabi", acc: "61%", td: "3", def: "100%" },
                { opp: "vs. Alexander Volkanovski", result: "W · Dec", resultClass: "result-w", date: "Feb 2023 · UFC 284 · Perth", acc: "54%", td: "5", def: "80%" },
                { opp: "vs. Dustin Poirier", result: "W · Sub R1", resultClass: "result-w", date: "Jun 2024 · UFC 302 · Newark", acc: "58%", td: "4", def: "100%" },
              ].map((h, i) => (
                <div key={i} className="history-fight">
                  <div className="history-header">
                    <span className="history-opponent">{h.opp}</span>
                    <span className={`history-result ${h.resultClass}`}>{h.result}</span>
                  </div>
                  <div className="history-meta">{h.date}</div>
                  <div className="history-stats">
                    <div className="hstat"><div className="hstat-label">Str. Acc.</div><div className="hstat-val">{h.acc}</div></div>
                    <div className="hstat"><div className="hstat-label">TDs Landed</div><div className="hstat-val">{h.td}</div></div>
                    <div className="hstat"><div className="hstat-label">TD Def.</div><div className="hstat-val">{h.def}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
