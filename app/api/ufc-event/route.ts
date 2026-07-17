import { NextResponse } from "next/server";
import { fetchCurrentUfcEvent } from "../../lib/ufcEvent";

export async function GET() {
  try {
    const event = await fetchCurrentUfcEvent();

    if (!event) {
      return NextResponse.json({ error: "No UFC event found" }, { status: 404 });
    }

    return NextResponse.json(event);
  } catch (error) {
    console.error("ESPN UFC event error:", error);

    return NextResponse.json(
      { error: "Failed to fetch UFC event" },
      { status: 500 }
    );
  }
}
