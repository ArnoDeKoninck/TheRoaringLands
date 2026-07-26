-- Add campaign grouping and circular map support

ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS campaign TEXT DEFAULT 'The Roaring Lands';
ALTER TABLE public.maps ADD COLUMN IF NOT EXISTS radius_hexes INTEGER;

-- Rename existing world map to reflect it's the overworld
UPDATE public.maps SET name = 'World Map' WHERE name = 'The Roaring Lands';

-- Insert Imorgath circular map (23x23 grid, radius=10 from center 11,11)
DO $$
DECLARE
  v_map_id uuid;
BEGIN
  INSERT INTO public.maps (name, type, grid_cols, grid_rows, hex_radius, campaign, radius_hexes)
  VALUES ('Imorgath', 'city', 23, 23, 48, 'The Roaring Lands', 10)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_map_id;

  IF v_map_id IS NOT NULL THEN
    INSERT INTO public.party_resources (map_id, gold, wood, stone, food, iron)
    VALUES (v_map_id, 0, 0, 0, 0, 0)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;
