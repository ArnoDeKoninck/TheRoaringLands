-- Run AFTER schema.sql.
-- Supabase dashboard: Project → SQL Editor → New query

-- ============================================================
-- ENABLE RLS
-- ============================================================

alter table public.profiles          enable row level security;
alter table public.maps              enable row level security;
alter table public.tile_types        enable row level security;
alter table public.map_tiles         enable row level security;
alter table public.catalogue_entries enable row level security;
alter table public.party_resources   enable row level security;

-- ============================================================
-- PROFILES
-- ============================================================

drop policy if exists "profiles: read own"     on public.profiles;
drop policy if exists "profiles: dm read all"  on public.profiles;
drop policy if exists "profiles: update own"   on public.profiles;

create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: dm read all"
  on public.profiles for select
  using (public.is_dm());

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- MAPS
-- ============================================================

drop policy if exists "maps: authenticated read" on public.maps;
drop policy if exists "maps: dm write"           on public.maps;

create policy "maps: authenticated read"
  on public.maps for select
  using (auth.role() = 'authenticated');

create policy "maps: dm write"
  on public.maps for all
  using (public.is_dm())
  with check (public.is_dm());

-- ============================================================
-- TILE TYPES
-- ============================================================

drop policy if exists "tile_types: authenticated read" on public.tile_types;
drop policy if exists "tile_types: dm write"           on public.tile_types;

create policy "tile_types: authenticated read"
  on public.tile_types for select
  using (auth.role() = 'authenticated');

create policy "tile_types: dm write"
  on public.tile_types for all
  using (public.is_dm())
  with check (public.is_dm());

-- ============================================================
-- MAP TILES
-- ============================================================

drop policy if exists "map_tiles: players see revealed" on public.map_tiles;
drop policy if exists "map_tiles: dm read all"          on public.map_tiles;
drop policy if exists "map_tiles: dm write"             on public.map_tiles;

create policy "map_tiles: players see revealed"
  on public.map_tiles for select
  using (revealed = true and auth.role() = 'authenticated');

create policy "map_tiles: dm read all"
  on public.map_tiles for select
  using (public.is_dm());

create policy "map_tiles: dm write"
  on public.map_tiles for all
  using (public.is_dm())
  with check (public.is_dm());

-- ============================================================
-- CATALOGUE ENTRIES
-- ============================================================

drop policy if exists "catalogue: players see unlocked" on public.catalogue_entries;
drop policy if exists "catalogue: dm read all"          on public.catalogue_entries;
drop policy if exists "catalogue: dm write"             on public.catalogue_entries;

create policy "catalogue: players see unlocked"
  on public.catalogue_entries for select
  using (unlocked = true and auth.role() = 'authenticated');

create policy "catalogue: dm read all"
  on public.catalogue_entries for select
  using (public.is_dm());

create policy "catalogue: dm write"
  on public.catalogue_entries for all
  using (public.is_dm())
  with check (public.is_dm());

-- ============================================================
-- PARTY RESOURCES
-- ============================================================

drop policy if exists "resources: authenticated read" on public.party_resources;
drop policy if exists "resources: dm write"           on public.party_resources;

create policy "resources: authenticated read"
  on public.party_resources for select
  using (auth.role() = 'authenticated');

create policy "resources: dm write"
  on public.party_resources for all
  using (public.is_dm())
  with check (public.is_dm());
