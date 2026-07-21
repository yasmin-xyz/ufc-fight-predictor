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
            These terms explain the rules for using Pick&apos;em Labs, along with your rights and responsibilities as a user.
          </p>
        </header>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">What this service is</h2>

          <p className="meth-body">
            Pick&apos;em Labs is operated by PickMeLabs, a sole proprietorship
            based in Ontario, Canada. It combines publicly available fighter
            statistics, live sportsbook odds, and independent analysis from
            multiple AI models to help you better understand upcoming UFC
            matchups. It is a research and analytics tool—not a sportsbook and
            not a service that accepts wagers or processes payments.
          </p>

          <p className="meth-body">
            Pick&apos;em Labs is an independent sports analytics platform. We
            are not affiliated with, endorsed by, or sponsored by the UFC, any
            sportsbook, bookmaker, athletic commission, or sports league. Any
            trademarks, names, or logos referenced on this site belong to their
            respective owners.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">No guarantee of accuracy</h2>

          <p className="meth-body">
            While we strive to provide accurate and useful analysis, fight
            predictions are generated using statistical data, betting odds, and
            AI model output—all of which may be incomplete, delayed, or
            incorrect. Confidence scores reflect a model&apos;s own assessment,
            not a verified probability of an outcome.
          </p>

          <p className="meth-body">
            We do not guarantee that any prediction, statistic, odds, or
            analysis provided by Pick&apos;em Labs is accurate, complete, or
            up to date.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Not betting advice</h2>

          <p className="meth-body">
            Nothing on Pick&apos;em Labs constitutes betting, financial, legal,
            or professional advice. Odds and value-edge calculations are
            provided for informational and analytical purposes only to help
            illustrate where AI analysis may agree or disagree with betting
            markets.
          </p>

          <p className="meth-body">
            You are solely responsible for any decisions you make based on
            information provided by Pick&apos;em Labs. If you participate in
            sports betting, we encourage you to do so responsibly. Please review
            our{" "}
            <Link
              href="/responsible-gambling"
              className="meth-inline-link"
            >
              Responsible Gambling
            </Link>{" "}
            page for additional information and support resources.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Intellectual property</h2>

          <p className="meth-body">
            Unless otherwise stated, the content, branding, design, original
            analysis, and software that make up Pick&apos;em Labs belong to
            PickMeLabs or are used with permission. You may use the service for
            personal, non-commercial purposes, but you may not copy,
            redistribute, or republish substantial portions of the site's
            content as your own without permission.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Acceptable use</h2>

          <p className="meth-body">
            You're welcome to use Pick&apos;em Labs for personal,
            non-commercial purposes. Please don't attempt to scrape the site at
            scale, reverse engineer the service, interfere with its
            availability, overload our infrastructure, redistribute its content
            as your own product, or use Pick&apos;em Labs in violation of
            applicable law.
          </p>
        </section>

        <div className="meth-divider" />

 <section className="meth-section">
  <h2 className="meth-heading">Limitation of liability</h2>

  <p className="meth-body">
    Pick&apos;em Labs is provided "as is." While we work hard to make the
    service reliable and useful, we can&apos;t guarantee that it will always be
    available, error-free, or suitable for every purpose.
  </p>

  <p className="meth-body">
    To the fullest extent permitted by law, PickMeLabs isn&apos;t liable for
    any losses or damages resulting from your use of, or reliance on,
    Pick&apos;em Labs or the information provided by the service.
  </p>
</section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Changes to these terms</h2>

          <p className="meth-body">
            Pick&apos;em Labs is an evolving product, and these Terms of Service
            may change from time to time. When we make material updates,
            we&apos;ll revise the "Last updated" date below. By continuing to
            use the service after changes take effect, you agree to the updated
            terms.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Governing law</h2>

          <p className="meth-body">
            These Terms of Service are governed by the laws of the Province of
            Ontario and the applicable laws of Canada, unless applicable law
            requires otherwise.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Contact</h2>

          <p className="meth-body">
            Questions about these Terms of Service can be sent to{" "}
            <a
              href="mailto:hello@pickmelabs.com"
              className="meth-inline-link"
            >
              hello@pickmelabs.com
            </a>{" "}
            or through our{" "}
            <Link href="/feedback" className="meth-inline-link">
              feedback page
            </Link>
            .
          </p>

          <p className="meth-body">
            Last updated: July 20, 2026.
          </p>
        </section>

        <div className="meth-divider" />

        <Link href="/" className="meth-back-link">
          ← Back to home
        </Link>
      </article>
    </main>
  );
}
