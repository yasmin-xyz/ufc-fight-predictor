-- Cito's fighter-search response includes `stance` ("Orthodox", "Southpaw",
-- "Switch"). ESPN, the Tale of the Tape's primary bio source, has no usable
-- stance for some fighters (it stores a missing one as "--"), so this is kept
-- alongside the rest of the Cito search hit as a fallback for the Stance row.
alter table public.fighter_metrics add column if not exists stance text;
