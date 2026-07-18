import { NextResponse } from "next/server";
import { getOdds } from "../../lib/oddsCache";

export async function GET() {
  const result = await getOdds();

  if (result.odds.length === 0 && !result.providerAvailable) {
    // No fresh data and no fallback to serve — genuinely nothing to show.
    return NextResponse.json(
      { error: "Failed to fetch odds", stale: true, providerAvailable: false },
      { status: 503 }
    );
  }

  // Quota headers captured in oddsProvider.ts are dev-console-only and
  // deliberately never included here.
  return NextResponse.json({
    odds: result.odds,
    fetchedAt: result.fetchedAt,
    stale: result.stale,
    providerAvailable: result.providerAvailable,
  });
}
