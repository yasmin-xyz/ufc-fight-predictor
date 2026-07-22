-- Cito's fighter-search response includes octagonDebut — the date of a
-- fighter's first UFC bout. When it matches the fight card being viewed,
-- that's a reliable signal for "this fighter is making their UFC debut",
-- unlike inferring it from empty fight-history rows (which is ambiguous:
-- Cito's history coverage can be incomplete for a real veteran too).
alter table public.fighter_metrics add column if not exists octagon_debut timestamptz;
