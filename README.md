# UFC Fight Predictor — Pick'em Labs

An AI-powered UFC fight analysis and betting insights tool. Built to learn React, production-grade Next.js engineering, and multi-model AI integration — and, as the project grew, real API resilience, caching, and security work.

---

## What It Does

Pick'em Labs pulls live UFC fight cards, real fighter stats and history, and current betting odds to generate structured AI fight breakdowns — not just a winner pick, but a full analyst-style breakdown of each matchup.

**For every fight, the app surfaces:**

- **Tale of the Tape** — side-by-side record, age, height, reach, stance, nickname, country, and weight class
- **Statistical Edge** — striking accuracy, takedown %, strike defense, submission average, visualised as comparative bars
- **Recent Fight History** — each fighter's last several results, pulled from official UFC data with an automatic fallback (see below) for fighters early in their UFC run
- **AI Fight Breakdown** — key advantages, biggest risks, likely fight script, path to victory, confidence score
- **Why the AI Could Be Wrong** — risks and counter-narratives to the prediction
- **Betting Market Analysis** — moneyline odds across bookmakers, implied probability, AI win probability, and value edge calculation
- **Multi-Model Consensus** — the same fight run independently through Claude, GPT-4, and Gemini, with a consensus pick and model-agreement breakdown

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack), React 19 |
| Styling | Hand-authored CSS (`app/globals.css`) — no UI framework |
| Fight Cards & Bios | ESPN (unofficial API), cached |
| Fighter Stats & History | [Cito API](https://citoapi.com), with a Sherdog fallback for pre-UFC/regional fight history |
| Fight Odds | [The Odds API](https://the-odds-api.com), cached hourly |
| AI Predictions | Anthropic Claude, OpenAI GPT-4, Google Gemini |
| Data / Caching | Supabase (Postgres), service-role access with RLS enabled |
| Testing | Vitest — all external providers mocked, no real paid API calls |
| Deployment | Vercel |

---

## Data Sources & Resilience

Rather than trusting a single provider, the app layers multiple sources and degrades gracefully when one is incomplete:

- **Fighter stats & fight history** come from Cito, which tracks UFC (Octagon) results. A fighter who's new to the UFC often has little or no resolved history there — the app automatically tops that up with fight history scraped from Sherdog (regional promotions, pre-UFC bouts), deduped against whatever Cito already has, so every fighter shows at least a few recent fights where the data exists.
- **Odds matching** between ESPN's fight-card names and the-odds-api's market names handles real-world mismatches (nicknames, transliteration differences, suffixes) via a safe surname-pair fallback, rather than silently showing no odds.
- **Caching**: odds are cached for an hour (a paid, quota-limited API), fighter stats/history are cached in Supabase with a background-refresh pattern so a page load never blocks on a slow provider, and even a "fighter not found" answer is cached — with a much shorter freshness window than real data, so it self-corrects quickly once a new provider actually adds the fighter, instead of staying wrong for weeks.
- **Predictions** are cached per fight matchup so re-viewing the same fight never re-triggers a paid AI call.

---

## Security

This started as a learning project but is written with production-level care:

- Rate limiting on every route by cost/risk (strictest on the AI prediction endpoint), backed by Postgres — not an in-memory store, since that doesn't survive across serverless instances.
- Row Level Security enabled on every exposed Supabase table; the browser never talks to Supabase directly.
- Strict server-side input validation on every POST endpoint (size limits, schema checks, no arbitrary fields reaching an LLM prompt).
- Timing-safe auth on the admin sync route, security headers + CSP, and no secrets or provider errors ever leaked to the client.

---

## Why I'm Building This

I'm using this project to learn React and Next.js in a real context — not through tutorials, but by building something with live data, real APIs, and production-level decisions to make.

Specifically, I want to:

- Get hands-on with React component architecture and state management
- Understand how to integrate multiple third-party APIs in one product, including what happens when they disagree, rate-limit, or don't have the data at all
- Learn how to instrument a product properly using PostHog — designing the tracking plan *before* writing the first line of code, not as an afterthought
- Get comfortable with the security side of shipping something publicly — rate limiting, RLS, input validation — not just the feature work

---

## Product Analytics

One of the core learning goals of this project was to think like a product analyst — designing event tracking around the questions I want the data to answer, not just dropping in a snippet.

The tracking plan is documented here: [`TRACKING_PLAN.md`](./TRACKING_PLAN.md). It's written, but **not yet wired into the app** — see Status below.

It covers:
- Core PostHog concepts (events, properties, persons, funnels, feature flags) — definitions sourced from PostHog's official docs
- Full event schema with names, triggers, properties, and reasoning
- Three funnels mapped to specific product questions
- Feature flag candidates including the multi-model consensus rollout strategy
- Eight product questions this implementation should be able to answer

---

## Status

🚧 In progress

- [x] Project scoped and designed
- [x] PostHog tracking plan written
- [x] Static UI shell — Next.js, custom design system
- [x] The Odds API integration — live UFC fight cards
- [x] Fighter stats & history integration — Cito API + Sherdog fallback
- [x] AI prediction layer — Claude, GPT-4, Gemini
- [x] Betting value analysis — AI vs market probability
- [x] Multi-model consensus feature
- [x] Security hardening — rate limiting, RLS, input validation, security headers
- [x] Automated test suite
- [ ] PostHog instrumentation
- [ ] Google OAuth login
- [ ] Vercel deployment

---

## Local Development

See [`.env.example`](.env.example) and `supabase/migrations/` for required setup.
