-- Run this in Supabase dashboard: Project → SQL Editor → New query
-- Run ONCE on a fresh project. Re-running is safe (uses IF NOT EXISTS / OR REPLACE).

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  role         text not null default 'player' check (role in ('dm', 'player')),
  display_name text
);

create table if not exists public.maps (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text not null default 'world' check (type in ('world', 'city', 'base', 'custom')),
  grid_cols  int  not null default 30,
  grid_rows  int  not null default 24,
  hex_radius int  not null default 48,
  created_at timestamptz default now()
);

create table if not exists public.tile_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        char(2) not null,
  color       text not null,
  description text,
  produces    text,
  order_index int  not null default 0
);

create table if not exists public.map_tiles (
  id           uuid primary key default gen_random_uuid(),
  map_id       uuid not null references public.maps(id) on delete cascade,
  col          int  not null,
  row          int  not null,
  tile_type_id uuid not null references public.tile_types(id),
  revealed     boolean not null default false,
  unique (map_id, col, row)
);

create table if not exists public.catalogue_entries (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('recipe', 'structure')),
  name        text not null,
  description text,
  unlocked    boolean not null default false,
  tag         text,
  metadata    jsonb,
  order_index int  not null default 0
);

create table if not exists public.party_resources (
  id     uuid primary key default gen_random_uuid(),
  map_id uuid references public.maps(id) on delete cascade,
  gold   int not null default 0,
  wood   int not null default 0,
  stone  int not null default 0,
  food   int not null default 0,
  iron   int not null default 0,
  unique (map_id)
);

-- ============================================================
-- AUTO-PROFILE TRIGGER
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'player')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- DM HELPER (used by RLS)
-- ============================================================

create or replace function public.is_dm()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'dm'
  );
$$;
