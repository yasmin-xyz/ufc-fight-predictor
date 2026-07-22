import { NextResponse } from "next/server";
import { checkRateLimit, getClientIp, rateLimitResponse } from "../../lib/rateLimit";
import { getUfcRankings } from "../../lib/ufcRankingsCache";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const RATE_LIMIT_MAX_REQUESTS = 60;

// No query params — the whole (cached, ~6hr-refreshed) rankings payload
// is cheap enough to send as-is, and matching a fight's two fighters
// against the right division is done client-side against selectedFight's
// own weightClass/fighterA/fighterB, the same way Cito/Sherdog matches
// are done by name rather than a shared id.
export async function GET(request: Request) {
  const { allowed, retryAfterSeconds } = await checkRateLimit(
    `rankings:${getClientIp(request)}`,
    RATE_LIMIT_WINDOW_SECONDS,
    RATE_LIMIT_MAX_REQUESTS
  );

  if (!allowed) {
    return rateLimitResponse(retryAfterSeconds);
  }

  const { rankings, stale } = await getUfcRankings();

  return NextResponse.json({ rankings, stale });
}
