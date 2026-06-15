import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const response = await axios.get(
      "https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds",
      {
        params: {
          apiKey: process.env.ODDS_API_KEY,
          regions: "us",
          markets: "h2h",
          oddsFormat: "american",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Odds API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch odds" },
      { status: 500 }
    );
  }
}