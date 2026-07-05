import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/mma/ufc/scoreboard",
      { cache: "no-store" }
    );

    const data = await res.json();
    const event = data.events?.[0];

    if (!event) {
      return NextResponse.json({ error: "No UFC event found" }, { status: 404 });
    }

    const fights = event.competitions?.map((competition: any) => {
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

    return NextResponse.json({
      eventName: event.name,
      shortName: event.shortName,
      date: event.date,
      venue: event.competitions?.[0]?.venue?.fullName || "Venue TBD",
      fights,
    });
  } catch (error) {
    console.error("ESPN UFC event error:", error);

    return NextResponse.json(
      { error: "Failed to fetch UFC event" },
      { status: 500 }
    );
  }
}