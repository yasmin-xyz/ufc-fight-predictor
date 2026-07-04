import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return NextResponse.json(
      { error: "Missing fighter name" },
      { status: 400 }
    );
  }

  const searchUrl = `http://ufcstats.com/statistics/fighters/search?query=${encodeURIComponent(name)}`;

  const res = await fetch(searchUrl, {
    cache: "no-store",
  });
  
  const html = await res.text();
  
  return NextResponse.json({
    name,
    searchUrl,
    htmlPreview: html.slice(0, 500),
  });
}