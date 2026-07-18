const NAME_SUFFIXES = new Set(["jr", "sr", "ii", "iii", "iv", "v"]);

// Matching normalization used only here, to line up ESPN fight-card
// entries with Odds API entries — deliberately separate from
// app/lib/fighterName.ts, whose normalizeFighterName() output backs
// Supabase/Cito cache keys and must not change shape.
//
// Handles (safely, without fuzzy/similarity matching that could join two
// different fighters):
//  - accents: "é" -> "e" instead of being silently dropped
//  - hyphens/apostrophes: "-" -> " " so "Jean-Paul" and "Jean Paul" match
//  - suffixes: "Levi Rodrigues Jr." vs "Levi Rodrigues" now match
//
// Does NOT attempt to reconcile a missing/extra middle name (e.g. "Jose
// Miguel Delgado" vs "Jose Delgado") or divergent transliterations (e.g.
// "Seokhyeon Ko" vs "Seok Hyun Ko") — dropping a middle word or fuzzy-
// matching spellings risks conflating two different real fighters, which
// is worse than showing no odds.
function normalizeForOddsMatch(name: string): string {
  const cleaned = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-']/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const parts = cleaned.split(" ");
  if (parts.length > 1 && NAME_SUFFIXES.has(parts[parts.length - 1])) {
    return parts.slice(0, -1).join(" ");
  }
  return cleaned;
}

export function mergeFightData(
    espnFights: any[],
    oddsFights: any[]
  ) {
    return espnFights.map((fight) => {
      const normA = normalizeForOddsMatch(fight.fighterA);
      const normB = normalizeForOddsMatch(fight.fighterB);

      const oddsMatch = oddsFights.find((oddsFight) => {
        const names = [
          normalizeForOddsMatch(oddsFight.home_team),
          normalizeForOddsMatch(oddsFight.away_team),
        ];

        return names.includes(normA) && names.includes(normB);
      });

      if (!oddsMatch && process.env.NODE_ENV !== "production") {
        console.warn(
          `[mergeFightData] no odds match for "${fight.fighterA}" vs "${fight.fighterB}" (normalized: "${normA}" / "${normB}")`
        );
      }

      return {
        ...fight,
        odds: oddsMatch || null,
      };
    });
  }
