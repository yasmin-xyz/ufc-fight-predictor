# UFC Fight Predictor — Pick'em Labs

An AI-powered UFC fight analysis and betting insights tool. Built to learn React, PostHog instrumentation, and multi-model AI integration.

---

## What It Does

Pick'em Labs pulls live UFC fight cards, real fighter stats, and current betting odds to generate structured AI fight breakdowns — not just a winner pick, but a full analyst-style breakdown of each matchup.

**For every fight, the app surfaces:**

- Tale of the Tape — side-by-side record, age, reach, stance, weight class
- Statistical Edge — striking accuracy, takedown %, finish rate, submission average, visualised as comparative bars
- AI Fight Breakdown — key advantages, biggest risks, likely fight script, path to victory, confidence score
- Why the AI Could Be Wrong — risks and counter-narratives to the prediction
- Betting Market Analysis — moneyline odds across bookmakers, implied probability, AI win probability, and value edge calculation
- Multi-Model Consensus — the same fight run through Claude, GPT-4, and Gemini, with a consensus pick

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js (React) |
| Styling | Tailwind CSS |
| Fight Odds | The Odds API |
| Fighter Stats | UFC Stats (ufcstats.com) |
| AI Predictions | Anthropic Claude, OpenAI GPT-4, Google Gemini |
| Product Analytics | PostHog |
| Auth | Google OAuth via NextAuth.js |
| Deployment | Vercel |

---

## Why I'm Building This

I'm using this project to learn React and Next.js in a real context — not through tutorials, but by building something with live data, real APIs, and production-level decisions to make.

Specifically, I want to:

- Get hands-on with React component architecture and state management
- Understand how to integrate multiple third-party APIs in one product
- Learn how to instrument a product properly using PostHog — designing the tracking plan *before* writing the first line of code, not as an afterthought

---

## PostHog Instrumentation

One of the core learning goals of this project was to think like a product analyst — designing event tracking around the questions I want the data to answer, not just dropping in a snippet.

The full tracking plan is documented here: [`TRACKING_PLAN.md`](./TRACKING_PLAN.md)

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
- [ ] Static UI shell — Next.js, Tailwind, design system
- [ ] The Odds API integration — live UFC fight cards
- [ ] Fighter stats integration — UFC Stats scraper
- [ ] AI prediction layer — Claude, GPT-4, Gemini
- [ ] Betting value analysis — AI vs market probability
- [ ] Multi-model consensus feature
- [ ] PostHog instrumentation
- [ ] Google OAuth login
- [ ] Vercel deployment

---

## Local Development

*Setup instructions will be added once the initial build is complete.*
