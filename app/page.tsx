export default function Home() {
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
              <span className="card-meta">5 fights</span>
            </div>
            <div className="fight-list">
              {[
                { names: "Makhachev vs. Poirier", wc: "Lightweight", tag: "Main · Title", pick: "Makhachev", pct: "72%", active: true },
                { names: "Pantoja vs. Erceg", wc: "Flyweight", tag: "Co-Main · Title", pick: "Pantoja", pct: "61%", active: false },
                { names: "Moreno vs. Royval", wc: "Flyweight", tag: "", pick: "Moreno", pct: "58%", active: false },
                { names: "Lemos vs. Ribas", wc: "Women's Strawweight", tag: "", pick: "Lemos", pct: "55%", active: false },
                { names: "Tuivasa vs. Spivak", wc: "Heavyweight", tag: "", pick: "Spivak", pct: "54%", active: false },
              ].map((fight, i) => (
                <div key={i} className={`fight-item${fight.active ? " active" : ""}`}>
                  <div className="fight-names">{fight.names}</div>
                  <div className="fight-meta">
                    <span className="fight-wc">{fight.wc}</span>
                    {fight.tag && <span className="fight-tag">{fight.tag}</span>}
                  </div>
                  <div className="fight-pick-row">
                    <span className="fight-pick-name">{fight.pick}</span>
                    <span className="fight-pick-pct">{fight.pct}</span>
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
                  <div className="fighter-name">Islam Makhachev</div>
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
                  <div className="fighter-name">Dustin Poirier</div>
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
                  <span className="odds-col-label">Makh.</span>
                  <span className="odds-col-label">Poirier</span>
                </div>
              </div>
              {[
                { book: "DraftKings", fav: "-340", dog: "+265" },
                { book: "FanDuel", fav: "-330", dog: "+255" },
                { book: "BetMGM", fav: "-350", dog: "+270" },
                { book: "Caesars", fav: "-335", dog: "+260" },
              ].map((o, i) => (
                <div key={i} className="odds-book">
                  <span className="book-name">{o.book}</span>
                  <div className="odds-pair">
                    <span className="odd-fav">{o.fav}</span>
                    <span className="odd-dog">{o.dog}</span>
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