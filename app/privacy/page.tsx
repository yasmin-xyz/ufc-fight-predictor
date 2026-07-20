// app/privacy/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import HomeLogoLink from "../components/HomeLogoLink";

export const metadata: Metadata = {
  title: "Privacy Policy — Pick'em Labs",
  description:
    "How Pick'em Labs collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className="meth-page">
      <nav className="nav reveal-nav">
        <HomeLogoLink />
      </nav>

      <article className="meth-article reveal-meth-article">
        <header className="meth-hero">
          <div className="meth-eyebrow">Legal</div>
          <h1 className="meth-title">Privacy Policy</h1>
          <p className="meth-lead">
            This page explains what information Pick&apos;em Labs collects,
            how it&apos;s used, and what choices you have. We&apos;ve tried
            to keep it short and honest rather than burying anything in
            legal boilerplate.
          </p>
        </header>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">What we collect</h2>
          <p className="meth-body">
            Pick&apos;em Labs doesn&apos;t require an account to use the
            core product, so for most visitors we don&apos;t collect any
            personal information at all. If you use the feedback form, we
            collect whatever you choose to enter — name and email are
            optional, and the message field is the only required part.
          </p>
          <p className="meth-body">
            We also collect standard product analytics data automatically
            as you use the site: pages viewed, general device and browser
            information, and how you interact with features like the fight
            selector. We don&apos;t collect payment information, because
            Pick&apos;em Labs doesn&apos;t process payments.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">How we use your data</h2>
          <p className="meth-body">
            Analytics data helps us understand which features people
            actually use, where the product is confusing, and what to
            prioritize next. Feedback you submit is used to fix bugs,
            evaluate feature requests, and improve the product — if you
            leave an email, we may reply directly.
          </p>
          <p className="meth-body">
            We don&apos;t sell your data, and we don&apos;t use it for
            advertising, since Pick&apos;em Labs doesn&apos;t run ads.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Third-party services</h2>
          <p className="meth-body">
            Generating a fight prediction means sending fighter statistics
            and odds context to third-party AI providers — Anthropic,
            OpenAI, and Google — so their models can independently analyze
            the matchup. These requests don&apos;t include any personal
            information about you as a visitor.
          </p>
          <p className="meth-body">
            Live sportsbook odds are fetched from The Odds API, which
            aggregates data from multiple bookmakers. Product analytics
            are handled by PostHog. Each of these providers processes data
            under their own respective privacy policies.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Cookies and analytics</h2>
          <p className="meth-body">
            We use PostHog to understand product usage, which may set
            cookies or similar identifiers in your browser to distinguish
            one visitor session from another. This is used purely for
            product analytics — not for tracking you across other sites or
            for advertising purposes.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Data retention</h2>
          <p className="meth-body">
            Analytics data is retained for as long as it&apos;s useful for
            understanding product trends, and is periodically cleaned up.
            Feedback submissions are kept until the underlying bug or
            request has been resolved or is no longer relevant.
          </p>
          <p className="meth-body">
            If Pick&apos;em Labs introduces user accounts in the future
            (built on Supabase), this policy will be updated to describe
            what account data is stored and for how long.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Your rights</h2>
          <p className="meth-body">
            You can use Pick&apos;em Labs without providing any personal
            information. If you&apos;ve submitted feedback and want that
            data deleted, or have any other question about what we hold,
            just reach out — see the contact section below.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Contact</h2>
          <p className="meth-body">
            Questions about this policy or your data can be sent through
            our{" "}
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