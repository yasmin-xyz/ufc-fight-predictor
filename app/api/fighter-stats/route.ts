import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "../../lib/rateLimit";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 60;

// ESPN athlete IDs are always numeric — this endpoint concatenates `id`
// directly into the outbound ESPN URL, so a strict numeric check here is
// what stops arbitrary path/query injection into that proxied request.
const VALID_ID = /^[0-9]{1,15}$/;

const ESPN_TIMEOUT_MS = 8_000;

type FighterStatsPayload = {
  id: string;
  name: string;
  nickname: string | undefined;
  headshot: string | undefined;
  record: string | undefined;
  height: string | undefined;
  weight: string | undefined;
  reach: string | undefined;
  stance: string | undefined;
  age: number | undefined;
  style: string | undefined;
  gym: string | undefined;
  country: string | undefined;
  flag: string | undefined;
};

// ESPN's site.web "common/v3" athlete endpoint is the cheaper source (one
// request, record included), but its backend intermittently 400s for a
// large share of athlete ids — in practice most of a fight card at once,
// including long-time veterans — returning no `athlete` at all. Callers
// used to see that as "Fighter not found" and render the whole Tale of the
// Tape as Unknown with no headshot. Returns null on any failure so the
// caller can fall back to fetchFromCore.
async function fetchFromSite(id: string): Promise<FighterStatsPayload | null> {
  try {
    const res = await fetch(
      `https://site.web.api.espn.com/apis/common/v3/sports/mma/ufc/athletes/${id}`,
      { cache: "no-store", signal: AbortSignal.timeout(ESPN_TIMEOUT_MS) }
    );
    if (!res.ok) return null;

    const athlete = (await res.json())?.athlete;
    if (!athlete) return null;

    return {
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
    };
  } catch {
    return null;
  }
}

// ESPN's core API serves the same athlete data from a separate backend that
// stays up when the site.web endpoint above doesn't. It carries a `styles`
// list (more fighters have one here) but keeps the W-L-D record behind a
// separate `records` link, so that's one extra best-effort request — the
// page falls back to the scoreboard's own record if it doesn't come back.
async function fetchFromCore(id: string): Promise<FighterStatsPayload | null> {
  try {
    const base = `https://sports.core.api.espn.com/v2/sports/mma/athletes/${id}`;
    const [athleteRes, recordsRes] = await Promise.all([
      fetch(`${base}?lang=en&region=us`, { cache: "no-store", signal: AbortSignal.timeout(ESPN_TIMEOUT_MS) }),
      fetch(`${base}/records?lang=en&region=us`, { cache: "no-store", signal: AbortSignal.timeout(ESPN_TIMEOUT_MS) }).catch(
        () => null
      ),
    ]);
    if (!athleteRes.ok) return null;

    const athlete = await athleteRes.json();
    if (!athlete?.displayName) return null;

    let record: string | undefined;
    if (recordsRes?.ok) {
      const records = await recordsRes.json().catch(() => null);
      const overall =
        records?.items?.find((item: any) => item?.name === "overall") ?? records?.items?.[0];
      record = overall?.displayValue || overall?.summary || undefined;
    }

    return {
      id: String(athlete.id ?? id),
      name: athlete.displayName,
      nickname: athlete.nickname,
      headshot: athlete.headshot?.href,
      record,
      height: athlete.displayHeight,
      weight: athlete.displayWeight,
      reach: athlete.displayReach,
      stance: athlete.stance?.text,
      age: athlete.age,
      style: athlete.styles?.[0]?.text,
      gym: athlete.association?.name,
      country: athlete.citizenship,
      flag: athlete.flag?.href,
    };
  } catch {
    return null;
  }
}

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
    const payload = (await fetchFromSite(id)) ?? (await fetchFromCore(id));

    if (!payload) {
      return NextResponse.json(
        { error: "Fighter not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error("Fighter stats error:", error);

    return NextResponse.json(
      { error: "Failed to fetch fighter stats" },
      { status: 500 }
    );
  }
}