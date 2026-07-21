// Smaller-scale rebuild of the nav's hand-tuned block-letter wordmark
// (app/page.tsx's .nav-logo), for use in the footer only. Kept as a
// separate component/class set rather than sharing the nav's markup
// directly, so resizing this one can't risk the already-tuned nav mark.
export default function FooterWordmark() {
  return (
    <div className="footer-logo">
      <img
        src="/android-chrome-192x192.png"
        alt="Pick'em Labs"
        className="footer-logo-img"
      />
      <div className="footer-logo-text">
        <div className="footer-logo-letters">
          <span className="footer-ltr" style={{ transform: "rotate(-2deg) translateY(0.5px)" }}>P</span>
          <span className="footer-ltr" style={{ transform: "rotate(1.5deg) translateY(-0.5px)" }}>I</span>
          <span className="footer-ltr" style={{ transform: "rotate(-1deg) translateY(0.5px)" }}>C</span>
          <span className="footer-ltr" style={{ transform: "rotate(2deg) translateY(-0.5px)" }}>K</span>
          <span className="footer-ltr" style={{ transform: "rotate(-1.5deg) translateY(0px)", margin: "0 0.5px" }}>'</span>
          <span className="footer-ltr" style={{ transform: "rotate(1deg) translateY(0.5px)" }}>E</span>
          <span className="footer-ltr" style={{ transform: "rotate(-2deg) translateY(-0.5px)" }}>M</span>
        </div>
        <span className="footer-logo-labs">LABS</span>
      </div>
    </div>
  );
}
