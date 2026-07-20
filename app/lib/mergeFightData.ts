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

// Last word of the normalized name — surnames are far more stable across
// providers than given names. Every mismatch seen in production so far
// (a missing/extra middle name, a nickname vs. formal given name like
// "Steve"/"Stephen" or "Ramazan"/"Ramazonbek", a transliteration split
// like "Seokhyeon"/"Seok Hyun") has left the surname untouched.
function surname(normalizedName: string): string {
  const parts = normalizedName.split(" ");
  return parts[parts.length - 1] || "";
}

export function mergeFightData(
    espnFights: any[],
    oddsFights: any[]
  ) {
    return espnFights.map((fight) => {
      const normA = normalizeForOddsMatch(fight.fighterA);
      const normB = normalizeForOddsMatch(fight.fighterB);

      let oddsMatch = oddsFights.find((oddsFight) => {
        const names = [
          normalizeForOddsMatch(oddsFight.home_team),
          normalizeForOddsMatch(oddsFight.away_team),
        ];

        return names.includes(normA) && names.includes(normB);
      });

      let matchTier: "exact" | "surname" | "none" = oddsMatch ? "exact" : "none";

      // Fall back to matching on the surname of BOTH fighters together,
      // not just one name in isolation — requiring the whole pair to
      // agree is what keeps this safe. A single surname is common enough
      // (multiple "Silva"s on one card, for instance) that matching it
      // alone could pair the wrong two fighters; requiring their
      // opponent's surname to also match as a pair makes a false
      // positive across a real fight card essentially impossible. If
      // more than one odds entry satisfies the pair, treat it as
      // unresolved rather than guess.
      if (!oddsMatch) {
        const surnameA = surname(normA);
        const surnameB = surname(normB);

        const candidates = oddsFights.filter((oddsFight) => {
          const surnames = [
            surname(normalizeForOddsMatch(oddsFight.home_team)),
            surname(normalizeForOddsMatch(oddsFight.away_team)),
          ];

          return surnames.includes(surnameA) && surnames.includes(surnameB);
        });

        if (candidates.length === 1) {
          oddsMatch = candidates[0];
          matchTier = "surname";
        }
      }

      if (process.env.NODE_ENV !== "production") {
        if (matchTier === "surname") {
          console.warn(
            `[mergeFightData] matched "${fight.fighterA}" vs "${fight.fighterB}" to odds "${oddsMatch.home_team}" vs "${oddsMatch.away_team}" by surname only (given names differ)`
          );
        } else if (matchTier === "none") {
          console.warn(
            `[mergeFightData] no odds match for "${fight.fighterA}" vs "${fight.fighterB}" (normalized: "${normA}" / "${normB}")`
          );
        }
      }

      return {
        ...fight,
        odds: oddsMatch || null,
      };
    });
  }
