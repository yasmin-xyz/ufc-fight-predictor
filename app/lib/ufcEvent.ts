import { unstable_cache } from "next/cache";

export type UfcEventFight = {
  id: string;
  date: string;
  weightClass: string;
  venue: string;
  fighterA: string;
  fighterB: string;
  recordA: string;
  recordB: string;
  fighterAId: string | undefined;
  fighterBId: string | undefined;
  fighterAFlag: string | undefined;
  fighterBFlag: string | undefined;
  // True once THIS fight is over — per fight, not per event, so a result
  // shows up as soon as its bout ends even while the card is still running.
  completed: boolean;
  // Display name of the winner, exactly as ESPN spells it for the fight
  // (matches fighterA/fighterB). Undefined for a draw/no contest, or until
  // the fight is over.
  winner: string | undefined;
  // How it ended. Only present once the fight is over; each part is
  // independently optional since ESPN's method lookup is a separate request.
  result: UfcFightResult | undefined;
};

export type UfcFightResult = {
  // e.g. "KO/TKO (Knee)", "Submission (Rear Naked Choke)", "Decision (Unanimous)"
  method: string | undefined;
  round: number | undefined;
  time: string | undefined;
};

export type UfcEventNext = {
  name: string;
  date: string;
};

export type UfcEvent = {
  eventName: string;
  shortName: string;
  date: string;
  venue: string;
  // City/state split out separately from `venue` (the arena name) so the
  // event bar can render "T-Mobile Arena, Las Vegas, NV" instead of just
  // the arena name — undefined rather than "" when ESPN doesn't have an
  // address on file, so the UI can cleanly omit it instead of showing a
  // stray comma.
  venueCity: string | undefined;
  venueState: string | undefined;
  fights: UfcEventFight[];
  completed: boolean;
  // ESPN's own status.type.state ("pre" | "in" | "post") — a direct signal
  // rather than inferring "in progress" from the event's start time having
  // passed, which would be wrong for however long ESPN takes to flip
  // `completed` after the actual last fight ends.
  isLive: boolean;
  // The next scheduled event after this one, per ESPN's own forward
  // calendar — never hardcoded, since the schedule shifts. null if this
  // event isn't completed, or if it couldn't be found in the calendar
  // (e.g. it's the last one ESPN currently lists).
  nextEvent: UfcEventNext | null;
};

// Dana White's Contender Series is a separate prospect-tryout show — not
// a numbered UFC card or Fight Night — but ESPN's calendar/scoreboard
// lists it in the same "Ultimate Fighting Championship" league feed,
// interspersed weekly with real UFC events. This app only ever wants the
// latter.
function isContenderSeries(name: string | undefined): boolean {
  return typeof name === "string" && name.toLowerCase().includes("contender series");
}

// A calendar entry's startDate is a bucket boundary (e.g. midnight UTC on
// the listed day), not the event's actual start time — ESPN's real event
// date/time can land on the day before or after it. Querying that exact
// day can come back empty, so this builds a day-before/day-after range
// instead, wide enough to always contain the real event.
function toEspnDateParam(isoDate: string, offsetDays: number): string {
  const d = new Date(isoDate);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

// ESPN's scoreboard "events[0]" keeps returning the just-concluded event
// for a while after it ends (status.type.completed flips true, but it
// doesn't roll over to the next event immediately) — this looks up the
// following entry in the league's own forward calendar, keyed by name,
// rather than guessing or hardcoding a date. Skips past any Contender
// Series entries so "next event" always points at a real UFC card.
function findNextEvent(calendar: any[] | undefined, currentEventName: string): UfcEventNext | null {
  if (!Array.isArray(calendar)) return null;

  const idx = calendar.findIndex((entry) => entry?.label === currentEventName);
  if (idx === -1) return null;

  const next = calendar
    .slice(idx + 1)
    .find((entry) => entry?.label && entry?.startDate && !isContenderSeries(entry.label));
  if (!next) return null;

  return { name: next.label, date: next.startDate };
}

const ESPN_RESULT_TIMEOUT_MS = 6_000;

// The scoreboard says WHO won and in which round/time, but not HOW — the
// method lives on a separate per-fight status resource on ESPN's core API.
// Best-effort: a failure just leaves the method off the result card.
async function fetchFightMethod(eventId: string, competitionId: string): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://sports.core.api.espn.com/v2/sports/mma/leagues/ufc/events/${eventId}/competitions/${competitionId}/status?lang=en&region=us`,
      { cache: "no-store", signal: AbortSignal.timeout(ESPN_RESULT_TIMEOUT_MS) }
    );
    if (!res.ok) return undefined;

    const result = (await res.json())?.result;
    const name: string | undefined = result?.displayName || result?.shortDisplayName;
    if (!name) return undefined;

    // ESPN writes decisions as "Decision - Unanimous"; match the
    // "Decision (Unanimous)" style used in the fight history instead.
    const decision = name.match(/^Decision\s*[-–]\s*(.+)$/i);
    if (decision) return `Decision (${decision[1].trim()})`;

    // Finishes carry the technique separately ("Submission" + "Kimura").
    const detail: string | undefined = result?.description || result?.displayDescription;
    return detail ? `${name} (${detail})` : name;
  } catch {
    return undefined;
  }
}

// Shared by the public /api/ufc-event route and the admin fighter-sync
// endpoint, so both read the exact same ESPN parsing logic.
async function fetchCurrentUfcEventUncached(): Promise<UfcEvent | null> {
  const res = await fetch(
    "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard",
    { cache: "no-store" }
  );

  const data = await res.json();
  let event = data.events?.[0];
  const calendar = data.leagues?.[0]?.calendar;

  // events[0] is whatever's chronologically next in the league feed,
  // which can land on a Contender Series week — walk the calendar
  // forward to the next real UFC card and fetch that date instead.
  if (event && isContenderSeries(event.name) && Array.isArray(calendar)) {
    const currentIdx = calendar.findIndex((entry) => entry?.label === event.name);
    const nextMainline = calendar
      .slice(currentIdx === -1 ? 0 : currentIdx + 1)
      .find((entry) => entry?.label && entry?.startDate && !isContenderSeries(entry.label));

    if (nextMainline?.startDate) {
      const dateParam = `${toEspnDateParam(nextMainline.startDate, -1)}-${toEspnDateParam(nextMainline.startDate, 1)}`;
      const mainlineRes = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard?dates=${dateParam}`,
        { cache: "no-store" }
      );
      const mainlineData = await mainlineRes.json();
      const mainlineEvent = mainlineData.events?.find((e: any) => e?.name === nextMainline.label);
      if (mainlineEvent) {
        event = mainlineEvent;
      }
    }
  }

  if (!event) return null;

  const fights: UfcEventFight[] = await Promise.all((event.competitions || []).map(async (competition: any) => {
    const competitors = competition.competitors || [];
    const completed = competition.status?.type?.completed === true;
    const winner: string | undefined = completed
      ? competitors.find((c: any) => c?.winner === true)?.athlete?.displayName
      : undefined;
    const method = completed ? await fetchFightMethod(String(event.id), String(competition.id)) : undefined;

    return {
      id: competition.id,
      date: competition.date,
      weightClass: competition.type?.abbreviation || "MMA",
      venue: competition.venue?.fullName || event.venue?.fullName || "Venue TBD",

      fighterA: competitors[0]?.athlete?.displayName || "Fighter A",
      fighterB: competitors[1]?.athlete?.displayName || "Fighter B",

      recordA: competitors[0]?.records?.[0]?.summary || "—",
      recordB: competitors[1]?.records?.[0]?.summary || "—",

      fighterAId: competitors[0]?.id,
      fighterBId: competitors[1]?.id,

      fighterAFlag: competitors[0]?.flag?.href,
      fighterBFlag: competitors[1]?.flag?.href,

      completed,
      winner,
      result: completed
        ? {
            method,
            round: typeof competition.status?.period === "number" && competition.status.period > 0 ? competition.status.period : undefined,
            time: competition.status?.displayClock && competition.status.displayClock !== "-" ? competition.status.displayClock : undefined,
          }
        : undefined,
    };
  }));

  const completed = event.status?.type?.completed === true;
  const isLive = event.status?.type?.state === "in";
  const nextEvent = completed ? findNextEvent(calendar, event.name) : null;

  const venueAddress = event.competitions?.[0]?.venue?.address || event.venue?.address;

  return {
    eventName: event.name,
    shortName: event.shortName,
    date: event.date,
    venue: event.competitions?.[0]?.venue?.fullName || "Venue TBD",
    venueCity: venueAddress?.city || undefined,
    venueState: venueAddress?.state || undefined,
    fights,
    completed,
    isLive,
    nextEvent,
  };
}

// ESPN's scoreboard is free/unauthenticated, so this cache exists for
// consistency and to avoid hammering it on every page load/refresh rather
// than for cost control — a much shorter window than the paid odds cache,
// since fight-card info (odds, weigh-in results) can change same-day.
const UFC_EVENT_REVALIDATE_SECONDS = 5 * 60;

export const fetchCurrentUfcEvent = unstable_cache(
  fetchCurrentUfcEventUncached,
  ["ufc-current-event"],
  { revalidate: UFC_EVENT_REVALIDATE_SECONDS }
);
