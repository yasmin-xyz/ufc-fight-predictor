import "server-only";
import * as cheerio from "cheerio";
import { namesMatchExactly } from "./fighterName";

// Unofficial fallback for fight history when Cito has none — Cito's own
// fight-history coverage is Octagon-only, so a fighter making their UFC
// debut (or one Cito simply hasn't backfilled) shows zero fights there
// even though they have a real record elsewhere. Sherdog's robots.txt has
// no restrictions for any user agent (unlike Tapology, which explicitly
// disallows AI crawlers including this one — not used here for that
// reason). Sherdog doesn't publish the striking/grappling efficiency
// numbers used in Fighter Metrics, only records/fight history, so this is
// scoped to backfilling history only.
const SHERDOG_BASE_URL = "https://www.sherdog.com";
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// No documented rate limit (it's not an API), but pacing requests keeps
// this a good citizen and avoids tripping bot-detection that would break
// it for good.
const MIN_INTERVAL_MS = 4000;
let lastRequestAt = 0;
let throttleChain: Promise<void> = Promise.resolve();

function throttle(): Promise<void> {
  const next = throttleChain.then(async () => {
    const wait = lastRequestAt + MIN_INTERVAL_MS - Date.now();
    if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
  });
  throttleChain = next.catch(() => {});
  return next;
}

async function sherdogFetch(path: string): Promise<{ ok: true; body: string } | { ok: false; error: string }> {
  await throttle();

  try {
    const res = await fetch(`${SHERDOG_BASE_URL}${path}`, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!res.ok) {
      return { ok: false, error: `Sherdog request failed (${res.status})` };
    }

    return { ok: true, body: await res.text() };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unknown Sherdog request error" };
  }
}

type SherdogSearchResult = {
  id: string;
  firstname: string;
  lastname: string;
  url: string;
};

export type SherdogFighterSearchResult =
  | { status: "matched"; profileUrl: string }
  | { status: "not_found" }
  | { status: "ambiguous"; candidateCount: number }
  | { status: "error"; error: string };

export async function searchSherdogFighter(fighterName: string): Promise<SherdogFighterSearchResult> {
  const result = await sherdogFetch(`/search/fightfinder/?q=${encodeURIComponent(fighterName)}`);

  if (!result.ok) {
    return { status: "error", error: result.error };
  }

  let parsed: { collection?: SherdogSearchResult[] };
  try {
    parsed = JSON.parse(result.body);
  } catch {
    return { status: "error", error: "Unexpected Sherdog search response format" };
  }

  const candidates = (parsed.collection || []).filter((f) =>
    namesMatchExactly(`${f.firstname} ${f.lastname}`, fighterName)
  );

  if (candidates.length === 0) return { status: "not_found" };
  if (candidates.length > 1) return { status: "ambiguous", candidateCount: candidates.length };

  return { status: "matched", profileUrl: candidates[0].url };
}

export type SherdogFightHistoryEntry = {
  opponent: string | null;
  result: string | null;
  event: string | null;
  eventDate: string | null;
  method: string | null;
  round: number | null;
  time: string | null;
};

export type SherdogFightHistoryResult =
  | { status: "ok"; fights: SherdogFightHistoryEntry[] }
  | { status: "error"; error: string };

// Sherdog's month names ("Apr / 11 / 2026") need parsing into an ISO date
// so they sort/compare correctly alongside Cito's ISO dates in the same
// fighter_history table.
function parseSherdogDate(text: string | undefined): string | null {
  if (!text) return null;
  const match = text.trim().match(/^([A-Za-z]{3})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/);
  if (!match) return null;
  const [, mon, day, year] = match;
  const date = new Date(`${mon} ${day}, ${year} UTC`);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export async function fetchSherdogFightHistory(profileUrl: string): Promise<SherdogFightHistoryResult> {
  const result = await sherdogFetch(profileUrl);

  if (!result.ok) {
    return { status: "error", error: result.error };
  }

  const $ = cheerio.load(result.body);

  // Sherdog lists "FIGHT HISTORY - PRO" before "FIGHT HISTORY - AMATEUR" —
  // the first .module.fight_history table on the page is always the pro
  // record, which is what belongs in an MMA prediction tool.
  const table = $(".module.fight_history table.new_table").first();

  const fights: SherdogFightHistoryEntry[] = [];

  table.find("tr").each((_, row) => {
    const $row = $(row);
    if ($row.hasClass("table_head")) return;

    const cells = $row.find("td");
    if (cells.length < 6) return;

    const result_ = $(cells[0]).find(".final_result").text().trim().toLowerCase() || null;
    const opponent = $(cells[1]).find("a").first().text().trim() || null;
    // The event name lives in a nested <span itemprop="award"> inside the
    // cell's <a> — select on the <a> itself (its .text() includes the
    // span's text), since a[itemprop=award] only matches if the attribute
    // were on the <a> tag directly, which it isn't.
    const event = $(cells[2]).find("a").first().text().trim() || null;
    const eventDate = parseSherdogDate($(cells[2]).find(".sub_line").first().text());
    const method = $(cells[3]).find("b").first().text().trim() || null;
    const roundText = $(cells[4]).text().trim();
    const round = roundText ? parseInt(roundText, 10) : null;
    const time = $(cells[5]).text().trim() || null;

    fights.push({
      opponent,
      result: result_,
      event,
      eventDate,
      method,
      round: Number.isNaN(round) ? null : round,
      time,
    });
  });

  return { status: "ok", fights };
}
