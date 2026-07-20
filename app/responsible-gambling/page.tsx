// app/responsible-gambling/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import HomeLogoLink from "../components/HomeLogoLink";

export const metadata: Metadata = {
  title: "Responsible Gambling — Pick'em Labs",
  description:
    "Pick'em Labs does not facilitate gambling. Resources and guidance for keeping sports analysis separate from gambling decisions.",
};

export default function ResponsibleGamblingPage() {
  return (
    <main className="meth-page">
      <nav className="nav reveal-nav">
        <HomeLogoLink />
      </nav>

      <article className="meth-article reveal-meth-article">
        <header className="meth-hero">
          <div className="meth-eyebrow">Legal</div>
          <h1 className="meth-title">Responsible Gambling</h1>
          <p className="meth-lead">
            Pick&apos;em Labs is an analytics tool, not a gambling
            platform. This page explains that distinction and points to
            real resources if gambling has become a problem for you or
            someone you know.
          </p>
        </header>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">We don&apos;t facilitate gambling</h2>
          <p className="meth-body">
            Pick&apos;em Labs doesn&apos;t take bets, hold funds, or
            partner with sportsbooks in any way that lets you place a
            wager through our site. Sportsbook odds are shown purely for
            comparison against AI model analysis — so you can see where
            they agree and where they diverge — not as an invitation or
            mechanism to bet.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Keep analysis and gambling separate</h2>
          <p className="meth-body">
            It&apos;s easy to treat a confident-sounding AI prediction as
            more certain than it actually is. Model confidence scores
            reflect the model&apos;s own self-assessed certainty, not a
            verified probability, and every model can be wrong. Use
            Pick&apos;em Labs to think more clearly about a matchup — not
            as a signal to increase the size or frequency of any bet.
          </p>
          <p className="meth-body">
            If you do choose to bet, set a budget before you look at any
            analysis, stick to it regardless of how a prediction reads,
            and treat gambling as entertainment you can afford to lose —
            never as a way to recover previous losses.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">If gambling has become a problem</h2>
          <p className="meth-body">
            If gambling is affecting your finances, relationships, or
            wellbeing, support is available and confidential. The
            organizations below offer free help, regardless of where
            you&apos;re located.
          </p>
          <div className="meth-source-list">
            <div className="meth-source">
              <div className="meth-source-label">GamCare</div>
              <p className="meth-source-body">
                UK-based support, information, and free counselling for
                anyone affected by gambling harm.{" "}
                <a href="https://www.gamcare.org.uk" target="_blank" rel="noopener noreferrer" className="meth-inline-link">gamcare.org.uk</a>
              </p>
            </div>
            <div className="meth-source">
              <div className="meth-source-label">BeGambleAware</div>
              <p className="meth-source-body">
                Independent information and advice on gambling, plus a
                free National Gambling Helpline.{" "}
                <a href="https://www.begambleaware.org" target="_blank" rel="noopener noreferrer" className="meth-inline-link">begambleaware.org</a>
              </p>
            </div>
            <div className="meth-source">
              <div className="meth-source-label">
                National Problem Gambling Helpline
              </div>
              <p className="meth-source-body">
                Confidential, 24/7 support in the US at{" "}
                <a href="tel:1-800-522-4700" className="meth-inline-link">1-800-522-4700</a>{" "}
                or via{" "}
                <a href="https://www.ncpgambling.org" target="_blank" rel="noopener noreferrer" className="meth-inline-link">ncpgambling.org</a>.
              </p>
            </div>
          </div>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Contact</h2>
          <p className="meth-body">
            Questions about this page can be sent to{" "}
            <a href="mailto:hello@pickmelabs.com" className="meth-inline-link">hello@pickmelabs.com</a>{" "}
            or through our{" "}
            <Link href="/feedback" className="meth-inline-link">feedback page</Link>.
          </p>
          <p className="meth-body">Last updated: July 2026.</p>
        </section>

        <div className="meth-divider" />

        <Link href="/" className="meth-back-link">
          ← Back to home
        </Link>
      </article>
    </main>
  );
}