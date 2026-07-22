import "server-only";
import * as cheerio from "cheerio";

// ufc.com's official rankings page — server-rendered HTML, not an API.
// robots.txt has no Disallow on /rankings (crawl-delay: 15, irrelevant
// here since this is fetched at most once per cache window, see
// ufcRankingsCache.ts). Chosen over ESPN's rankings feed because ESPN's
// numeric-id-keyed rankings endpoint was observed to lag behind actual
// title changes and regularly omit fighters who are clearly ranked on
// every other source, while this is the rankings UFC itself publishes.
const UFC_RANKINGS_URL = "https://www.ufc.com/rankings";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

export type DivisionRanking = {
  champion: string | null;
  ranks: { rank: number; name: string }[];
};

// Keyed by the division name text as UFC.com renders it (e.g. "Light
// Heavyweight", "Women's Strawweight") — matched against a fight's
// weightClass by the API route, not normalized here, since that's the
// one place that already knows the caller's exact spelling.
export type UfcRankings = Record<string, DivisionRanking>;

export async function fetchUfcRankingsFromSource(): Promise<UfcRankings> {
  const res = await fetch(UFC_RANKINGS_URL, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`UFC rankings request failed (${res.status})`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);
  const rankings: UfcRankings = {};

  // The page renders each division's section twice — the second copy's
  // table is empty (no <tr> rows), so without this guard it would
  // overwrite the first, correctly-populated copy for every division.
  $(".view-grouping").each((_, section) => {
    const divisionName = $(section).find(".view-grouping-header").first().clone().children().remove().end().text().trim();
    if (!divisionName || rankings[divisionName]) return;

    const champion =
      $(section).find(".rankings--athlete--champion .info h5 a").first().text().trim() || null;

    const ranks: { rank: number; name: string }[] = [];
    $(section)
      .find("tbody tr")
      .each((_, row) => {
        const rankText = $(row).find(".views-field-weight-class-rank").first().text().trim();
        const name = $(row).find(".views-field-title a").first().text().trim();
        const rank = parseInt(rankText, 10);
        if (name && Number.isFinite(rank)) {
          ranks.push({ rank, name });
        }
      });

    rankings[divisionName] = { champion, ranks };
  });

  return rankings;
}
