-- Resize World Map to 70x45
UPDATE public.maps
SET grid_cols = 70, grid_rows = 45
WHERE name = 'World Map';
