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
};

export type UfcEvent = {
  eventName: string;
  shortName: string;
  date: string;
  venue: string;
  fights: UfcEventFight[];
};

// Shared by the public /api/ufc-event route and the admin fighter-sync
// endpoint, so both read the exact same ESPN parsing logic.
export async function fetchCurrentUfcEvent(): Promise<UfcEvent | null> {
  const res = await fetch(
    "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard",
    { cache: "no-store" }
  );

  const data = await res.json();
  const event = data.events?.[0];

  if (!event) return null;

  const fights: UfcEventFight[] = (event.competitions || []).map((competition: any) => {
    const competitors = competition.competitors || [];

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
    };
  });

  return {
    eventName: event.name,
    shortName: event.shortName,
    date: event.date,
    venue: event.competitions?.[0]?.venue?.fullName || "Venue TBD",
    fights,
  };
}
