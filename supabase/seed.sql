-- Run AFTER schema.sql and rls.sql.
-- Seeds default tile types, catalogue entries, world map, and resources.

-- ============================================================
-- TILE TYPES
-- ============================================================

insert into public.tile_types (name, code, color, description, produces, order_index) values
  ('Plains',      'PL', 'oklch(0.62 0.09 120)', 'Open grassland, easy to traverse.',   'food',  0),
  ('Forest',      'FR', 'oklch(0.5 0.09 145)',  'Dense woodland, rich in timber.',      'wood',  1),
  ('Mountain',    'MT', 'oklch(0.55 0.02 260)', 'Rocky peaks, source of stone.',        'stone', 2),
  ('Water',       'WA', 'oklch(0.6 0.1 230)',   'Lakes and rivers, impassable.',        null,    3),
  ('Desert',      'DS', 'oklch(0.72 0.09 80)',  'Arid wasteland, scarce resources.',    null,    4),
  ('Farmland',    'FM', 'oklch(0.68 0.11 95)',  'Cultivated fields, bountiful food.',   'food',  5),
  ('Ore Deposit', 'OR', 'oklch(0.55 0.03 30)',  'Iron-rich veins beneath the surface.', 'iron',  6)
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
