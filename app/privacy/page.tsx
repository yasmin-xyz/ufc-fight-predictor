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
            We believe privacy policies should be understandable. This page
            explains what information Pick&apos;em Labs collects, why we collect
            it, and how it&apos;s used—without unnecessary legal jargon.
          </p>
        </header>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">What we collect</h2>

          <p className="meth-body">
            You can use Pick&apos;em Labs without creating an account or
            providing information like your name or email address.
          </p>

          <p className="meth-body">
            If you choose to use our feedback form, we collect whatever
            information you decide to submit. Name and email are optional, and
            the message field is the only required field.
          </p>

          <p className="meth-body">
            We also collect standard product analytics, such as pages viewed,
            general device and browser information, and how visitors interact
            with features throughout the site. Pick&apos;em Labs does not process
            payments, so we do not collect payment information.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">How we use your data</h2>

          <p className="meth-body">
            Analytics help us understand which features people use, identify
            areas where the product can be improved, and guide future
            development.
          </p>

          <p className="meth-body">
            Feedback submissions are used to investigate bugs, evaluate feature
            requests, and improve Pick&apos;em Labs. If you provide an email
            address, we may contact you regarding your submission.
          </p>

          <p className="meth-body">
            We do not sell personal information, and we do not use your data for
            advertising purposes.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Third-party services</h2>

          <p className="meth-body">
            Generating fight predictions requires sending matchup information,
            such as fighter statistics and sportsbook odds, to third-party AI
            providers including Anthropic, OpenAI, and Google. These requests
            are intended to contain only the information necessary to analyze a
            matchup and are not designed to include information that identifies
            you personally.
          </p>

          <p className="meth-body">
            Live betting odds are provided through The Odds API, and product
            analytics are handled by PostHog. Each provider processes data in
            accordance with its own privacy policy.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Cookies and analytics</h2>

          <p className="meth-body">
            We use PostHog to understand how people use Pick&apos;em Labs.
            PostHog may use cookies or similar technologies to distinguish
            visitor sessions and help us improve the product.
          </p>

          <p className="meth-body">
            These technologies are used solely for product analytics. They are
            not used for advertising or to track you across unrelated websites.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Data retention</h2>

          <p className="meth-body">
            We retain analytics data only for as long as necessary to understand
            product usage and improve Pick&apos;em Labs. Older analytics data is
            periodically reviewed and removed when it is no longer useful.
          </p>

          <p className="meth-body">
            Feedback submissions are kept until the associated bug, feature
            request, or support inquiry has been resolved or is no longer
            relevant.
          </p>

          <p className="meth-body">
            If Pick&apos;em Labs introduces user accounts or additional features
            in the future, this Privacy Policy will be updated to explain what
            additional information is collected and how it is used.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Security</h2>

          <p className="meth-body">
            We take reasonable measures to protect the information we collect.
            However, no website, internet transmission, or electronic storage
            system can be guaranteed to be completely secure.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Your rights</h2>

          <p className="meth-body">
            Depending on where you live, you may have the right to request
            access to, correction of, or deletion of personal information we
            hold about you. If you would like to make such a request, please
            contact us.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Changes to this policy</h2>

          <p className="meth-body">
            As Pick&apos;em Labs evolves, this Privacy Policy may change from
            time to time. When we make material updates, we&apos;ll revise the
            "Last updated" date below.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Contact</h2>

          <p className="meth-body">
            Questions about this Privacy Policy or your data can be submitted
            through our{" "}
            <Link href="/feedback" className="meth-inline-link">
              feedback page
            </Link>{" "}
            or by emailing{" "}
            <a
              href="mailto:hello@pickmelabs.com"
              className="meth-inline-link"
            >
              hello@pickmelabs.com
            </a>
            .
          </p>

          <p className="meth-body">
            Last updated: July 18, 2026.
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
