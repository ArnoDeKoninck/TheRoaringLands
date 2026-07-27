-- Add category column to tile_types
ALTER TABLE public.tile_types ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Terrain';

-- Ensure all existing terrain tiles are categorized
UPDATE public.tile_types SET category = 'Terrain'
WHERE code IN ('PL','FO','MN','WA','DE','FL','OR');

-- Insert new tile types (skip if code already exists)
INSERT INTO public.tile_types (name, code, color, description, category, order_index) VALUES
  ('Castle',        'CS', 'oklch(0.40 0.04 260)', 'Royal seat of power',          'Settlements', 10),
  ('Village',       'VL', 'oklch(0.58 0.07 60)',  'Small civilian settlement',    'Settlements', 11),
  ('Well',          'WE', 'oklch(0.55 0.08 225)', 'Fresh water source',           'Settlements', 12),
  ('Market',        'MK', 'oklch(0.65 0.10 70)',  'Trade and commerce hub',       'Economy',     13),
  ('Treasury',      'TR', 'oklch(0.72 0.14 85)',  'Gold reserves and vault',      'Economy',     14),
  ('Farmstead',     'FS', 'oklch(0.65 0.10 95)',  'Working agricultural plot',    'Production',  15),
  ('Granary',       'GN', 'oklch(0.70 0.09 90)',  'Food storage and distribution','Production',  16),
  ('Lumber Camp',   'LC', 'oklch(0.48 0.08 80)',  'Wood harvesting site',         'Production',  17),
  ('Mine',          'MI', 'oklch(0.38 0.03 260)', 'Stone and mineral extraction', 'Production',  18),
  ('Iron Ore',      'IO', 'oklch(0.50 0.05 30)',  'Rich iron-bearing deposit',    'Production',  19),
  ('Forge',         'FG', 'oklch(0.38 0.06 30)',  'Metalworking furnace',         'Production',  20),
  ('Barracks',      'BA', 'oklch(0.38 0.04 15)',  'Military training grounds',    'Military',    21),
  ('Armory',        'AM', 'oklch(0.40 0.03 260)', 'Weapons and arms storage',     'Military',    22),
  ('Archery Range', 'AY', 'oklch(0.40 0.06 130)', 'Ranged combat training',       'Military',    23),
  ('Stable',        'SB', 'oklch(0.48 0.06 60)',  'Cavalry and mount housing',    'Military',    24),
  ('Fortification', 'FN', 'oklch(0.42 0.02 260)', 'Defensive wall section',       'Military',    25),
  ('Watchtower',    'WC', 'oklch(0.36 0.03 260)', 'Scouting and defense post',    'Military',    26),
  ('Guard Post',    'GP', 'oklch(0.40 0.06 200)', 'Security checkpoint',          'Military',    27),
  ('Library',       'LB', 'oklch(0.46 0.08 280)', 'Knowledge and research hub',   'Knowledge',   28),
  ('Woodland',      'WN', 'oklch(0.48 0.09 145)', 'Dense secondary tree cover',   'Terrain',     29)
ON CONFLICT DO NOTHING;
