-- Run AFTER schema.sql and rls.sql.
-- Seeds default tile types, catalogue entries, world map, and resources.

-- ============================================================
-- TILE TYPES
-- ============================================================

insert into public.tile_types (name, code, color, description, produces, category, order_index) values
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
on conflict do nothing;

-- ============================================================
-- CATALOGUE ENTRIES
-- ============================================================

insert into public.catalogue_entries (type, name, description, unlocked, tag, metadata, order_index) values
  ('recipe',    'Basic Tools',  'Craft simple tools from wood and iron.',     false, null,       '{"ingredients":[{"resource":"wood","amount":2},{"resource":"iron","amount":1}]}',                       0),
  ('recipe',    'Stone Walls',  'Fortify a settlement with thick stone.',     false, null,       '{"ingredients":[{"resource":"stone","amount":3}]}',                                                      1),
  ('recipe',    'Bread',        'Feed your people using grain and fuel.',     false, null,       '{"ingredients":[{"resource":"food","amount":2},{"resource":"wood","amount":1}]}',                        2),
  ('recipe',    'Iron Sword',   'A weapon forged from iron and timber.',      false, null,       '{"ingredients":[{"resource":"iron","amount":2},{"resource":"wood","amount":1}]}',                        3),
  ('recipe',    'Gold Ingot',   'Refine raw gold into tradeable ingots.',     false, null,       '{"ingredients":[{"resource":"gold","amount":1},{"resource":"iron","amount":1}]}',                        4),
  ('structure', 'Town Hall',    'The heart of your civilization.',            true,  'Core',     null,                                                                                                     0),
  ('structure', 'Market',       'Trade goods and generate gold.',             false, 'Economy',  null,                                                                                                     1),
  ('structure', 'Barracks',     'Train soldiers to defend your lands.',       false, 'Military', null,                                                                                                     2),
  ('structure', 'Scout',        'Send scouts to reveal the map.',             false, 'Unit',     null,                                                                                                     3)
on conflict do nothing;

-- ============================================================
-- DEFAULT WORLD MAP + RESOURCES
-- ============================================================

-- Insert default map, capture id, insert resources row
do $$
declare
  v_map_id uuid;
begin
  insert into public.maps (name, type, grid_cols, grid_rows, hex_radius)
  values ('The Roaring Lands', 'world', 30, 24, 48)
  on conflict do nothing
  returning id into v_map_id;

  if v_map_id is not null then
    insert into public.party_resources (map_id, gold, wood, stone, food, iron)
    values (v_map_id, 100, 50, 30, 80, 20)
    on conflict do nothing;
  end if;
end;
$$;

-- ============================================================
-- SET DM ROLE
-- After running this file, update your own user to DM:
--
--   update public.profiles set role = 'dm'
--   where id = '<your-user-uuid>';
--
-- Find your UUID: Supabase dashboard → Authentication → Users
-- ============================================================
