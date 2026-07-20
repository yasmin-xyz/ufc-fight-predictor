// app/terms/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import HomeLogoLink from "../components/HomeLogoLink";

export const metadata: Metadata = {
  title: "Terms of Service — Pick'em Labs",
  description: "The terms that apply to using Pick'em Labs.",
};

export default function TermsPage() {
  return (
    <main className="meth-page">
      <nav className="nav reveal-nav">
        <HomeLogoLink />
      </nav>

      <article className="meth-article reveal-meth-article">
        <header className="meth-hero">
          <div className="meth-eyebrow">Legal</div>
          <h1 className="meth-title">Terms of Service</h1>
          <p className="meth-lead">
            These are the terms for using Pick&apos;em Labs. We&apos;ve kept
            them plain and short rather than filling this page with legal
            boilerplate.
          </p>
        </header>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">What this service is</h2>
          <p className="meth-body">
            Pick&apos;em Labs is a free sports analytics tool operated
            under PickMeLabs, a sole proprietorship. It combines publicly
            available fighter statistics, live sportsbook odds, and
            independent analysis from multiple AI models to help you think
            through upcoming UFC fights. It&apos;s a research and analysis
            tool, not a service that takes bets or handles money.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">No guarantee of accuracy</h2>
          <p className="meth-body">
            Fight predictions are generated from statistical data and AI
            model output, both of which can be incomplete, outdated, or
            simply wrong. Model confidence scores reflect a model&apos;s
            own self-assessed certainty, not a verified probability of an
            outcome. We make no guarantee that any prediction, statistic,
            or piece of analysis on this site is accurate or complete.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Not betting advice</h2>
          <p className="meth-body">
            Nothing on Pick&apos;em Labs is betting, financial, or
            professional advice. Odds and value-edge figures are shown for
            informational and analytical purposes only, to illustrate
            where AI analysis agrees or disagrees with the betting market
            — not to recommend any wager. Any decisions you make based on
            this site are entirely your own responsibility.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Acceptable use</h2>
          <p className="meth-body">
            You&apos;re welcome to use Pick&apos;em Labs for personal,
            non-commercial purposes. Please don&apos;t attempt to scrape,
            reverse-engineer, or overload the service, resell or
            redistribute its predictions as your own product, or use it in
            any way that violates applicable law.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Changes and availability</h2>
          <p className="meth-body">
            Pick&apos;em Labs is an early-stage, independently run project.
            Features may change, data sources may be swapped out, and the
            service may be modified, paused, or discontinued at any time
            without notice. These terms may also be updated as the product
            evolves.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Contact</h2>
          <p className="meth-body">
            Questions about these terms can be sent to{" "}
            <a href="mailto:hello@pickmelabs.com" className="meth-inline-link">
              hello@pickmelabs.com
            </a>{" "}
            or through our{" "}
            <Link href="/feedback" className="meth-inline-link">
              feedback page
            </Link>
            .
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