// app/responsible-gambling/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import HomeLogoLink from "../components/HomeLogoLink";

export const metadata: Metadata = {
  title: "Responsible Gambling — Pick'em Labs",
  description:
    "Information about responsible sports betting and support resources from Pick'em Labs.",
};

export default function ResponsibleGamblingPage() {
  return (
    <main className="meth-page">
      <nav className="nav reveal-nav">
        <HomeLogoLink />
      </nav>

      <article className="meth-article reveal-meth-article">
        <header className="meth-hero">
          <div className="meth-eyebrow">Product responsibility</div>

          <h1 className="meth-title">Responsible Gambling</h1>

          <p className="meth-lead">
            Pick&apos;em Labs is a sports analytics platform—not a sportsbook.
            We don&apos;t accept wagers or encourage gambling. This page
            explains that distinction and provides support resources if
            gambling has become a problem for you or someone you know.
          </p>
        </header>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">We don&apos;t facilitate gambling</h2>

          <p className="meth-body">
            Pick&apos;em Labs doesn&apos;t take bets, hold funds, or allow you
            to place a wager through our site. Sportsbook odds are displayed as
            one input into our analysis and to illustrate how AI predictions
            compare with market expectations.
          </p>

          <p className="meth-body">
            Pick&apos;em Labs is independent. We are not affiliated with,
            endorsed by, or sponsored by the UFC, any sportsbook, bookmaker,
            athletic commission, or sports league.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">
            Keep analysis and gambling separate
          </h2>

          <p className="meth-body">
            It&apos;s easy to treat a confident-sounding AI prediction as more
            certain than it actually is. Model confidence scores reflect a
            model&apos;s own assessment, not a verified probability, and every
            model can be wrong.
          </p>

          <p className="meth-body">
            Even thoughtful analysis can&apos;t reliably predict injuries,
            judging decisions, last-minute game-plan changes, or other
            unexpected events that may influence the outcome of a fight. Use
            Pick&apos;em Labs to think more critically about a matchup—not as a
            signal to increase the size or frequency of a bet.
          </p>

          <p className="meth-body">
            If you choose to participate in sports betting, set a budget before
            reviewing any analysis and only use money you can afford to lose.
            Stick to that limit regardless of how confident a prediction
            sounds, and never treat gambling as a way to make money or recover
            previous losses.
          </p>

          <p className="meth-body">
            Avoid betting when you&apos;re stressed, upset, or under the
            influence of alcohol or drugs. Taking a break, using deposit limits,
            or activating self-exclusion tools can also help you stay in
            control.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">
            If gambling has become a problem
          </h2>

          <p className="meth-body">
            If gambling is affecting your finances, relationships, work, or
            wellbeing, support is available. You don&apos;t need to wait for the
            situation to become severe before asking for help. These services
            can also support family members and others affected by someone
            else&apos;s gambling.
          </p>

          <div className="meth-source-list">
            <div className="meth-source">
              <div className="meth-source-label">
                ConnexOntario — Ontario, Canada
              </div>

              <p className="meth-source-body">
                Free, confidential, 24/7 information and referrals for people in
                Ontario affected by problem gambling. Call{" "}
                <a
                  href="tel:1-866-531-2600"
                  className="meth-inline-link"
                >
                  1-866-531-2600
                </a>{" "}
                or visit{" "}
                <a
                  href="https://connexontario.ca/our-services/gambling-treatment/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="meth-inline-link"
                >
                  connexontario.ca
                </a>
                .
              </p>
            </div>

            <div className="meth-source">
              <div className="meth-source-label">
                Responsible Gambling Council — Canada
              </div>

              <p className="meth-source-body">
                Information, self-help guidance, and a directory of gambling
                support services across Canada. Visit{" "}
                <a
                  href="https://responsiblegambling.org/for-the-public/problem-gambling-help/help-for-canadians/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="meth-inline-link"
                >
                  responsiblegambling.org
                </a>
                .
              </p>
            </div>

            <div className="meth-source">
              <div className="meth-source-label">
                National Problem Gambling Helpline — United States
              </div>

              <p className="meth-source-body">
                Free and confidential support and referrals across the United
                States. Call or text{" "}
                <a
                  href="tel:1-800-697-3738"
                  className="meth-inline-link"
                >
                  1-800-MY-RESET
                </a>{" "}
                or visit{" "}
                <a
                  href="https://www.ncpgambling.org/help-treatment/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="meth-inline-link"
                >
                  ncpgambling.org
                </a>
                .
              </p>
            </div>

            <div className="meth-source">
              <div className="meth-source-label">
                GamCare — Great Britain
              </div>

              <p className="meth-source-body">
                Free, confidential, 24/7 support for anyone affected by gambling
                harm in Great Britain. Call{" "}
                <a
                  href="tel:08088020133"
                  className="meth-inline-link"
                >
                  0808 8020 133
                </a>{" "}
                or visit{" "}
                <a
                  href="https://www.gamcare.org.uk/get-support/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="meth-inline-link"
                >
                  gamcare.org.uk
                </a>
                .
              </p>
            </div>
          </div>

          <p className="meth-body">
            If you live elsewhere, look for a licensed gambling-support or
            addiction-support service in your country or region.
          </p>
        </section>

        <div className="meth-divider" />

        <section className="meth-section">
          <h2 className="meth-heading">Contact</h2>

          <p className="meth-body">
            Questions about this page can be sent to{" "}
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

          <p className="meth-body">Last updated: July 20, 2026.</p>
        </section>

        <div className="meth-divider" />

        <Link href="/" className="meth-back-link">
          ← Back to home
        </Link>
      </article>
    </main>
  );
}
