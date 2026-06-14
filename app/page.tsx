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
    </main>
  );
}