-- Cito's fighter-search response includes `fightingStyle` ("Striker",
-- "Wrestler", ...). ESPN, the Tale of the Tape's primary bio source, has no
-- fighting style on file for a large share of fighters (10 of 28 on a recent
-- card), so this is stored alongside the rest of the Cito search hit and used
-- as a fallback to avoid an "Unknown" Style row.
alter table public.fighter_metrics add column if not exists fighting_style text;
