-- Replace all tile types with the icon-based set.
-- All placed tiles are cleared first to avoid FK violations.

DELETE FROM public.map_tiles;
DELETE FROM public.tile_types;

INSERT INTO public.tile_types (name, code, color, description, produces, category, order_index) VALUES
  -- Terrain
  ('Grassland',      'GR', 'oklch(0.62 0.09 120)', 'Open plains and rolling meadows.',      'food',  'Terrain',     0),
  ('Forest',         'FR', 'oklch(0.48 0.09 145)', 'Dense woodland, rich in timber.',       'wood',  'Terrain',     1),
  ('Mountain',       'MT', 'oklch(0.55 0.02 260)', 'Rocky peaks, source of stone.',         'stone', 'Terrain',     2),
  ('Desert',         'DS', 'oklch(0.72 0.09 80)',  'Arid wasteland, scarce resources.',     null,    'Terrain',     3),
  ('Jungle',         'JG', 'oklch(0.42 0.12 140)', 'Thick tropical undergrowth.',           'wood',  'Terrain',     4),
  ('Swamp',          'SW', 'oklch(0.45 0.07 160)', 'Murky wetlands, hard to traverse.',    null,    'Terrain',     5),
  ('Waterfall',      'WF', 'oklch(0.60 0.10 230)', 'Cascading falls and river rapids.',     null,    'Terrain',     6),
  -- Settlements
  ('Castle',         'CS', 'oklch(0.40 0.04 260)', 'Fortified seat of power.',              null,    'Settlements', 10),
  ('Village',        'VL', 'oklch(0.58 0.07 60)',  'Small civilian settlement.',            'food',  'Settlements', 11),
  ('Huts',           'HV', 'oklch(0.50 0.06 60)',  'Primitive dwelling cluster.',           'food',  'Settlements', 12),
  -- Encounters
  ('Goblin Camp',    'GC', 'oklch(0.42 0.08 130)', 'Hostile goblin encampment.',            null,    'Encounters',  20),
  ('Wolf Trap',      'WT', 'oklch(0.45 0.05 60)',  'Dangerous beast hunting ground.',       null,    'Encounters',  21),
  ('Tumulus',        'TU', 'oklch(0.48 0.04 90)',  'Ancient burial mound.',                null,    'Encounters',  22),
  ('Camp',           'CT', 'oklch(0.60 0.06 70)',  'Temporary traveler''s encampment.',     null,    'Encounters',  23),
  ('Airtight Hatch', 'AH', 'oklch(0.40 0.03 200)', 'Hidden underground entrance.',         null,    'Encounters',  24),
  -- Military
  ('Defensive Wall', 'DW', 'oklch(0.42 0.02 260)', 'Stone fortification wall.',            null,    'Military',    30),
  ('Palisade',       'PA', 'oklch(0.48 0.06 60)',  'Wooden stake barrier.',                null,    'Military',    31)
;
