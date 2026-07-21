import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "../../lib/rateLimit";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 60;

// ESPN athlete IDs are always numeric — this endpoint concatenates `id`
// directly into the outbound ESPN URL, so a strict numeric check here is
// what stops arbitrary path/query injection into that proxied request.
const VALID_ID = /^[0-9]{1,15}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id || !VALID_ID.test(id)) {
    return NextResponse.json(
      { error: "Missing or invalid fighter id" },
      { status: 400 }
    );
  }

  const { allowed, retryAfterSeconds } = await checkRateLimit(
    `fighter-stats:${getClientIp(request)}`,
    RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_MAX_REQUESTS
  );

  if (!allowed) {
    return rateLimitResponse(retryAfterSeconds);
  }

  try {
    const res = await fetch(
      `https://site.web.api.espn.com/apis/common/v3/sports/mma/ufc/athletes/${id}`,
      { cache: "no-store" }
    );

    const data = await res.json();
    const athlete = data.athlete;

    if (!athlete) {
      return NextResponse.json(
        { error: "Fighter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: athlete.id,
      name: athlete.displayName,
      nickname: athlete.nickname,
      headshot: athlete.headshot?.href,
      record: athlete.statsSummary?.statistics?.find(
        (stat: any) => stat.name === "wins-losses-draws"
      )?.displayValue,
      height: athlete.displayHeight,
      weight: athlete.displayWeight,
      reach: athlete.displayReach,
      stance: athlete.stance?.text,
      age: athlete.age,
      style: athlete.displayFightingStyle,
      gym: athlete.association?.name,
      country: athlete.citizenship,
      flag: athlete.flag?.href,
    });
  } catch (error) {
    console.error("Fighter stats error:", error);

    return NextResponse.json(
      { error: "Failed to fetch fighter stats" },
      { status: 500 }
    );
  }
}