-- supabase/migrations/004_layers.sql

-- Named overlay layers per map
CREATE TABLE IF NOT EXISTS public.map_layers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id      UUID NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Named regions within a layer (e.g. "Northern Kingdom" in "Countries" layer)
CREATE TABLE IF NOT EXISTS public.layer_regions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  layer_id    UUID NOT NULL REFERENCES public.map_layers(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  color       TEXT NOT NULL DEFAULT '#4488cc',
  opacity     REAL NOT NULL DEFAULT 0.4,
  order_index INTEGER NOT NULL DEFAULT 0
);

-- Which region each hex belongs to on each layer
CREATE TABLE IF NOT EXISTS public.hex_layer_data (
  map_id    UUID    NOT NULL REFERENCES public.maps(id)    ON DELETE CASCADE,
  layer_id  UUID    NOT NULL REFERENCES public.map_layers(id) ON DELETE CASCADE,
  col       INTEGER NOT NULL,
  row       INTEGER NOT NULL,
  region_id UUID    REFERENCES public.layer_regions(id) ON DELETE SET NULL,
  PRIMARY KEY (map_id, layer_id, col, row)
);

-- RLS: any authenticated user can read, only DM role can write
ALTER TABLE public.map_layers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layer_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hex_layer_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read map_layers"     ON public.map_layers    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "write map_layers"    ON public.map_layers    FOR ALL    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dm'));
CREATE POLICY "read layer_regions"  ON public.layer_regions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "write layer_regions" ON public.layer_regions FOR ALL    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dm'));
CREATE POLICY "read hex_layer_data"  ON public.hex_layer_data FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "write hex_layer_data" ON public.hex_layer_data FOR ALL    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'dm'));

-- Enable Realtime for hex_layer_data so clients get live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.hex_layer_data;
