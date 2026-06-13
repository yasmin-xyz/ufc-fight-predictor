# UFC Fight Predictor — PostHog Tracking Plan

**Project:** UFC AI Fight Predictor  
**Version:** 1.0  
**Last Updated:** June 2026

---

## 1. Core Concepts Glossary

Definitions sourced directly from [PostHog Documentation](https://posthog.com/docs).

### Event
> *"An event is the core unit of data in PostHog. It represents an interaction a user has with your app or website. Examples include button clicks, pageviews, query completions, and signups."*
> — [PostHog Docs: Events](https://posthog.com/docs/data/events)

An event consists of four things:
- **Event name** — what happened (e.g. `fight_card_viewed`, `prediction_generated`)
- **Distinct ID** — a unique identifier for the person who triggered it
- **Timestamp** — when it happened (ISO 8601 format)
- **Properties** — additional context attached to the event (e.g. `fighter_name`, `confidence_score`)

**Why it matters for this app:** Every meaningful user interaction — viewing a fight, reading an AI breakdown, checking odds — should be captured as a named event so we can understand how people actually use the product.

---

### Properties
> *"Person properties enable you to capture, manage, and analyze specific data about a user. You can use them to create filters or cohorts, which can then be used in insights, feature flags, surveys, and more."*
> — [PostHog Docs: Person Properties](https://posthog.com/docs/product-analytics/person-properties)

Properties are key-value pairs attached to either an **event** (what happened in that moment) or a **person** (what we know about the user over time).

- **Event property example:** `{ fighter_a: "Islam Makhachev", confidence_score: 74 }`
- **Person property example:** `{ favourite_weight_class: "Lightweight", total_predictions_viewed: 12 }`

**Why it matters:** Properties let us slice data. Instead of just knowing "someone viewed a prediction," we can ask "which fighters generate the most prediction views?" or "do users who check betting value stay longer?"

---

### Persons
> *"People in PostHog represent the users behind your events... When you capture your first identified event for a user, it creates a person profile for them. Then, any future events captured are attributed to this profile."*
> — [PostHog Docs: People](https://posthog.com/docs/data/persons)

A Person is a unified profile of a single user, built from all their events over time. PostHog stitches together anonymous sessions and identified users into one profile.

**Why it matters:** Even before we add login, PostHog tracks anonymous users. Once we add Google OAuth, we can call `posthog.identify()` to connect their anonymous history to their real identity — giving us a complete picture of their journey from first visit onward.

---

### Funnels
> *"For every flow in your product, more people will start it than complete it successfully. Funnels enable you to visualize your flows and understand where the friction points are so that you can improve them."*
> — [PostHog Docs: Funnels](https://posthog.com/docs/product-analytics/funnels)

A funnel is a defined sequence of events that represents a desired user journey. PostHog shows you how many users complete each step — and where they drop off.

**Why it matters:** This app has a natural funnel. If users land on the fight card but never click into a matchup, that's a design or content problem. If they read the AI breakdown but never check the betting value section, maybe that feature isn't discoverable enough. Funnels make these problems visible.

---

### Feature Flags
> *"Feature flags let you toggle features on or off for specific users, groups, or percentages of traffic without redeploying code. They're the foundation for safe rollouts, A/B testing, and remote configuration."*
> — [PostHog Docs: Feature Flags](https://posthog.com/docs/feature-flags)

Feature flags let you control who sees what — without pushing new code. You can roll out a feature to 10% of users, run an A/B test, or instantly disable something that's broken.

**Why it matters:** The multi-model consensus feature (Claude vs GPT vs Gemini) is a perfect candidate. We can flag-gate it, roll it out gradually, and measure whether users who see it engage more deeply with predictions than those who don't.

---

## 2. Event Tracking Plan

### Naming Convention
Following PostHog's recommendation: `[object]_[verb]` format.  
Example: `fight_card_viewed`, `prediction_generated`, `odds_section_expanded`

---

### 2.1 Navigation & Discovery Events

| Event Name | Trigger | Key Properties | Why We Track It |
|---|---|---|---|
| `page_viewed` | Any page load | `page_name`, `referrer`, `utm_source` | Understand traffic sources and most visited pages |
| `fight_card_viewed` | User lands on upcoming events page | `event_name`, `event_date`, `num_fights` | How many users reach the core content |
| `fight_clicked` | User clicks into a specific matchup | `fighter_a`, `fighter_b`, `weight_class`, `is_main_event` | Which fights generate the most curiosity |
| `fighter_profile_viewed` | User clicks a fighter's name/stats | `fighter_name`, `from_fight_id` | Interest in individual fighter data |

---

### 2.2 Analysis Engagement Events

| Event Name | Trigger | Key Properties | Why We Track It |
|---|---|---|---|
| `tale_of_tape_viewed` | Tale of the Tape section scrolled into view | `fighter_a`, `fighter_b` | Baseline engagement with the matchup page |
| `stats_section_expanded` | User expands / interacts with Statistical Edge section | `fighter_a`, `fighter_b`, `stat_highlighted` | Which stats users engage with most |
| `ai_breakdown_viewed` | AI Fight Breakdown section renders | `fighter_a`, `fighter_b`, `predicted_winner`, `confidence_score` | Core value prop usage |
| `ai_breakdown_section_read` | User scrolls through a specific sub-section | `section_name` (e.g. `key_advantages`, `fight_script`, `path_to_victory`, `why_wrong`) | Which parts of the AI analysis people actually read |
| `why_wrong_section_viewed` | "Why the AI Could Be Wrong" section viewed | `fighter_a`, `fighter_b`, `risk_factors` | Engagement with the trust-building feature |

---

### 2.3 AI & Prediction Events

| Event Name | Trigger | Key Properties | Why We Track It |
|---|---|---|---|
| `prediction_generated` | AI returns a prediction for a fight | `fighter_a`, `fighter_b`, `predicted_winner`, `confidence_score`, `model_used`, `response_time_ms` | Core product metric — how often predictions are generated |
| `multi_model_consensus_viewed` | User views the Claude/GPT/Gemini comparison panel | `fighter_a`, `fighter_b`, `claude_pick`, `gpt_pick`, `gemini_pick`, `consensus_pick` | Engagement with the flagship differentiating feature |
| `model_tab_switched` | User switches between model tabs in consensus view | `model_selected`, `fight_id` | Which AI model users are most curious about |
| `prediction_copied` | User copies the AI prediction text | `fighter_a`, `fighter_b` | Intent to share — signals high value |

---

### 2.4 Betting & Odds Events

| Event Name | Trigger | Key Properties | Why We Track It |
|---|---|---|---|
| `odds_section_viewed` | Betting Market Analysis section scrolled into view | `fighter_a`, `fighter_b` | How many users reach the betting layer |
| `value_edge_calculated` | AI vs Market probability delta is displayed | `fighter_a`, `fighter_b`, `ai_probability`, `market_probability`, `value_edge` | Core utility for bettors — signals product-market fit |
| `bookmaker_toggled` | User switches between bookmakers in odds view | `bookmaker_name`, `fight_id` | Which bookmakers users care about most |
| `positive_value_fight_viewed` | User views a fight where AI edge > 5% | `fighter_a`, `fighter_b`, `value_edge` | Tracks engagement with highest-signal content |

---

### 2.5 Session & Retention Events

| Event Name | Trigger | Key Properties | Why We Track It |
|---|---|---|---|
| `session_started` | First interaction of a new session | `referrer`, `device_type` | Session volume and traffic quality |
| `session_depth_reached` | User views 3+ fights in one session | `fights_viewed`, `session_duration_seconds` | Power user signal |
| `app_returned` | User visits again within 7 days | `days_since_last_visit`, `last_fight_viewed` | Retention signal — are people coming back? |

---

## 3. Funnels to Build in PostHog

### Funnel 1: Core Discovery → Analysis
Tracks whether users go from landing on the app to actually reading an AI breakdown.

```
page_viewed
  → fight_card_viewed
    → fight_clicked
      → ai_breakdown_viewed
```

**Question it answers:** What percentage of visitors actually reach the core value of the product? Where do they fall off?

---

### Funnel 2: Analysis Depth
Tracks whether users who read the AI breakdown also engage with the betting value section.

```
ai_breakdown_viewed
  → odds_section_viewed
    → value_edge_calculated
```

**Question it answers:** Do users treat this as a fight analysis tool or a betting tool? Are both sections being used together?

---

### Funnel 3: Multi-Model Engagement
Tracks whether users who see the consensus feature engage with it meaningfully.

```
ai_breakdown_viewed
  → multi_model_consensus_viewed
    → model_tab_switched
```

**Question it answers:** Is the multi-model feature adding value, or are users ignoring it?

---

## 4. Feature Flag Candidates

| Flag Name | Feature | Rollout Strategy | Metric to Watch |
|---|---|---|---|
| `multi_model_consensus` | Show Claude/GPT/Gemini comparison panel | Roll out to 50% of users | Does `ai_breakdown_section_read` duration increase? |
| `value_edge_highlight` | Highlight fights where AI edge > 5% in green | 100% rollout, can kill-switch if buggy | Does `positive_value_fight_viewed` correlate with return visits? |
| `why_wrong_section` | Show "Why the AI Could Be Wrong" section | A/B test: 50% see it, 50% don't | Does session depth increase for users who see it? |

---

## 5. Questions This Data Should Answer

These are the product questions a good analytics implementation should be able to answer. This is also the strongest framing for interviews — showing you designed tracking *around questions*, not just events.

1. **Where do users drop off?** At which step in the discovery funnel do we lose the most people?
2. **What content drives the most engagement?** Which fights, weight classes, or fighters get the most clicks?
3. **Is the AI breakdown being read or skimmed?** Which sub-sections get the most scroll depth?
4. **Does the multi-model consensus feature increase session depth?** Or do users ignore it?
5. **Are users coming back?** What's the 7-day return rate after a first visit?
6. **Is the betting value section useful?** Do users who view the value edge return more often than those who don't?
7. **Which AI model do users trust most?** Measured by which tab they click in the consensus panel.
8. **What's our top referral source?** Where are engaged users coming from?

---

## 6. Implementation Notes

- **Install PostHog JS SDK** in the Next.js app via `posthog-js` npm package
- **Use `posthog.identify()`** when Google OAuth login is added — connects anonymous history to a real user
- **Use `posthog.capture()`** for all custom events above
- **PostHog autocapture** will handle basic clicks and pageviews automatically — custom events add the meaningful layer on top
- **Session recordings** should be enabled — watching real sessions will reveal friction points no event tracking would catch

---

*This document should be updated as new features are added. Event names are final once captured — rename carefully.*
