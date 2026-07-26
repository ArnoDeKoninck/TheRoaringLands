# Hexforge Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js 15 web app for a DND campaign with a hex grid map, DM/player role separation, fog of war, resource HUD, and a managed catalogue, backed by Supabase and deployed on Vercel.

**Architecture:** Next.js 15 App Router — server components fetch initial data, server actions handle all mutations (no separate API routes). Supabase handles auth (individual logins), database, and RLS enforces data visibility by role at the DB layer. Interactive game state (pan/zoom/tile selection) lives in client components; a React context provides the DM role flag and active map throughout the client tree.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS v4, Supabase JS v2 + @supabase/ssr, Vitest + React Testing Library, Vercel

---

## File Map

```
app/
  (auth)/login/page.tsx          — login form (server page, client form component)
  (game)/layout.tsx              — auth guard + data provider shell
  (game)/page.tsx                — game view (server, passes data to client)
  layout.tsx                     — root layout (fonts, metadata)
  globals.css                    — Tailwind v4 + design tokens (OKLCH vars)
components/
  auth/LoginForm.tsx             — client login form
  hud/Hud.tsx                   — top bar (resources, zoom, catalogue toggle)
  hud/ResourcePill.tsx          — single resource display
  hud/ZoomControls.tsx          — − / + zoom buttons
  hex-grid/HexGrid.tsx          — SVG canvas, pan/zoom, pointer events
  hex-grid/HexTile.tsx          — single SVG <polygon> hex
  hex-grid/PlacingPill.tsx      — "Placing: X" overlay pill
  catalogue/CataloguePanel.tsx  — 320px right panel, 4 tabs
  catalogue/TileCard.tsx        — draggable tile type card
  catalogue/RecipeCard.tsx      — recipe info card
  catalogue/StructureCard.tsx   — structure info card + tag pill
  catalogue/DmTileEditor.tsx    — DM: create/edit tile types form
  catalogue/DmEntryToggle.tsx   — DM: unlock toggle for recipes/structures
  inspector/TileInspector.tsx   — floating card on placed tile click
  maps/MapSwitcher.tsx          — DM: create map + switch active map
  providers/GameProvider.tsx    — client context (role, activeMap, selectedTileId, fog mode)
lib/
  supabase/client.ts            — browser Supabase client (singleton)
  supabase/server.ts            — server Supabase client (per-request, cookies)
  types.ts                      — all shared TypeScript types
  hex-math.ts                   — neighborsOf, hexToPixel, keyToColRow, colRowToKey
actions/
  map.ts                        — placeTile, revealTile, createMap
  catalogue.ts                  — createTileType, updateTileType, unlockEntry, createEntry
  resources.ts                  — updateResources
middleware.ts                   — Supabase session refresh + auth redirect
tests/
  setup.ts                      — Vitest + testing-library setup
  hex-math.test.ts
  types.test.ts                 — type guard smoke tests
vitest.config.ts
```

---

## Task 1: Next.js Project Initialization

**Files:**
- Create: `package.json` (via scaffold)
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step 1: Scaffold Next.js in the existing repo root**

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --yes
```

When prompted about existing files (README.md): keep existing. Accept all defaults.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install @supabase/supabase-js @supabase/ssr
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

- [ ] **Step 3: Verify Tailwind version**

Check `package.json` — if `tailwindcss` version is `^3.*`, upgrade:
```bash
npm install tailwindcss@latest
```
Tailwind v4 is required for `@theme` CSS syntax used in Task 6.

- [ ] **Step 4: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
})
```

- [ ] **Step 5: Create `tests/setup.ts`**

```typescript
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Add test script to `package.json`**

In `package.json` scripts, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Verify tests run**

```bash
npm test
```
Expected: "No test files found" — that's fine, no tests yet.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 + Vitest"
```

---

## Task 2: Supabase Schema

**Files:**
- Reference only: run SQL in Supabase dashboard SQL editor (Project → SQL Editor → New query)

- [ ] **Step 1: Create tables**

Run in Supabase SQL editor:

```sql
-- Profiles: one row per auth.users row, stores role
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'player' check (role in ('dm', 'player')),
  display_name text
);

-- Maps: world map + any custom maps the DM creates
create table public.maps (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text not null default 'world' check (type in ('world', 'city', 'base', 'custom')),
  grid_cols  int  not null default 30,
  grid_rows  int  not null default 24,
  hex_radius int  not null default 48,
  created_at timestamptz default now()
);

-- Tile types: DM-managed, shown in Catalogue Hex Tiles tab
create table public.tile_types (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  code        char(2) not null,
  color       text not null,  -- oklch(...) string
  description text,
  produces    text,           -- resource key: 'gold'|'wood'|'stone'|'food'|'iron'|null
  order_index int  not null default 0
);

-- Placed tiles on a map
create table public.map_tiles (
  id           uuid primary key default gen_random_uuid(),
  map_id       uuid not null references public.maps(id) on delete cascade,
  col          int  not null,
  row          int  not null,
  tile_type_id uuid not null references public.tile_types(id),
  revealed     boolean not null default false,
  unique (map_id, col, row)
);

-- Recipes and structures in the Catalogue
create table public.catalogue_entries (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('recipe', 'structure')),
  name        text not null,
  description text,
  unlocked    boolean not null default false,
  tag         text,           -- for structures: 'Core'|'Economy'|'Military'|'Unit'
  metadata    jsonb,          -- for recipes: { "ingredients": [{"resource":"wood","amount":2}] }
  order_index int  not null default 0
);

-- Party-wide resources (one row per map; null map_id = global fallback)
create table public.party_resources (
  id     uuid primary key default gen_random_uuid(),
  map_id uuid references public.maps(id) on delete cascade,
  gold   int not null default 0,
  wood   int not null default 0,
  stone  int not null default 0,
  food   int not null default 0,
  iron   int not null default 0,
  unique (map_id)
);
```

- [ ] **Step 2: Create auto-profile trigger**

```sql
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role)
  values (new.id, 'player');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

- [ ] **Step 3: Create DM helper function (used by RLS)**

```sql
create or replace function public.is_dm()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'dm'
  );
$$;
```

- [ ] **Step 4: Seed initial tile types**

```sql
insert into public.tile_types (name, code, color, description, produces, order_index) values
  ('Plains',      'PL', 'oklch(0.62 0.09 120)', 'Open grassland, easy to traverse.',  'food',  0),
  ('Forest',      'FR', 'oklch(0.5 0.09 145)',  'Dense woodland, rich in timber.',     'wood',  1),
  ('Mountain',    'MT', 'oklch(0.55 0.02 260)', 'Rocky peaks, source of stone.',       'stone', 2),
  ('Water',       'WA', 'oklch(0.6 0.1 230)',   'Lakes and rivers, impassable.',       null,    3),
  ('Desert',      'DS', 'oklch(0.72 0.09 80)',  'Arid wasteland, scarce resources.',   null,    4),
  ('Farmland',    'FM', 'oklch(0.68 0.11 95)',  'Cultivated fields, bountiful food.',  'food',  5),
  ('Ore Deposit', 'OR', 'oklch(0.55 0.03 30)',  'Iron-rich veins beneath the surface.','iron',  6);
```

- [ ] **Step 5: Seed initial catalogue entries**

```sql
insert into public.catalogue_entries (type, name, description, unlocked, tag, metadata, order_index) values
  ('recipe', 'Basic Tools',  'Craft simple tools from wood and iron.',     false, null, '{"ingredients":[{"resource":"wood","amount":2},{"resource":"iron","amount":1}]}', 0),
  ('recipe', 'Stone Walls',  'Fortify a settlement with thick stone.',      false, null, '{"ingredients":[{"resource":"stone","amount":3}]}', 1),
  ('recipe', 'Bread',        'Feed your people using grain and fuel.',      false, null, '{"ingredients":[{"resource":"food","amount":2},{"resource":"wood","amount":1}]}', 2),
  ('recipe', 'Iron Sword',   'A weapon forged from iron and timber.',       false, null, '{"ingredients":[{"resource":"iron","amount":2},{"resource":"wood","amount":1}]}', 3),
  ('recipe', 'Gold Ingot',   'Refine raw gold into tradeable ingots.',      false, null, '{"ingredients":[{"resource":"gold","amount":1},{"resource":"iron","amount":1}]}', 4),
  ('structure', 'Town Hall', 'The heart of your civilization.',             true,  'Core',     null, 0),
  ('structure', 'Market',    'Trade goods and generate gold.',              false, 'Economy',  null, 1),
  ('structure', 'Barracks',  'Train soldiers to defend your lands.',        false, 'Military', null, 2),
  ('structure', 'Scout',     'Send scouts to reveal the map.',              false, 'Unit',     null, 3);
```

- [ ] **Step 6: Seed default world map + resources**

```sql
insert into public.maps (name, type, grid_cols, grid_rows, hex_radius)
values ('The Roaring Lands', 'world', 30, 24, 48)
returning id;
-- Copy the returned id for next insert:
insert into public.party_resources (map_id, gold, wood, stone, food, iron)
values ('<map-id-from-above>', 100, 50, 30, 80, 20);
```

- [ ] **Step 7: Set DM role manually**

Sign up in the app (once auth is wired in Task 5), then run:
```sql
update public.profiles set role = 'dm' where id = '<your-user-id>';
```

Find your user id in Supabase → Authentication → Users.

- [ ] **Step 8: Commit note**

No files changed — schema lives in Supabase. Add a comment to `CLAUDE.md` noting the schema version. Skip commit.

---

## Task 3: Supabase RLS Policies

**Files:**
- Reference only: run in Supabase SQL editor

- [ ] **Step 1: Enable RLS on all tables**

```sql
alter table public.profiles         enable row level security;
alter table public.maps             enable row level security;
alter table public.tile_types       enable row level security;
alter table public.map_tiles        enable row level security;
alter table public.catalogue_entries enable row level security;
alter table public.party_resources  enable row level security;
```

- [ ] **Step 2: Profiles policies**

```sql
-- Anyone reads own profile
create policy "profiles: read own"
  on public.profiles for select
  using (auth.uid() = id);

-- DM reads all profiles
create policy "profiles: dm read all"
  on public.profiles for select
  using (public.is_dm());

-- Anyone updates own display_name
create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);
```

- [ ] **Step 3: Maps policies**

```sql
-- All authenticated users read maps
create policy "maps: authenticated read"
  on public.maps for select
  using (auth.role() = 'authenticated');

-- DM creates/updates/deletes maps
create policy "maps: dm write"
  on public.maps for all
  using (public.is_dm())
  with check (public.is_dm());
```

- [ ] **Step 4: Tile types policies**

```sql
-- All authenticated users read tile types
create policy "tile_types: authenticated read"
  on public.tile_types for select
  using (auth.role() = 'authenticated');

-- DM manages tile types
create policy "tile_types: dm write"
  on public.tile_types for all
  using (public.is_dm())
  with check (public.is_dm());
```

- [ ] **Step 5: Map tiles policies**

```sql
-- Players see only revealed tiles
create policy "map_tiles: players see revealed"
  on public.map_tiles for select
  using (revealed = true and auth.role() = 'authenticated');

-- DM sees all tiles
create policy "map_tiles: dm read all"
  on public.map_tiles for select
  using (public.is_dm());

-- DM places, reveals, removes tiles
create policy "map_tiles: dm write"
  on public.map_tiles for all
  using (public.is_dm())
  with check (public.is_dm());
```

- [ ] **Step 6: Catalogue entries policies**

```sql
-- Players see unlocked entries only
create policy "catalogue: players see unlocked"
  on public.catalogue_entries for select
  using (unlocked = true and auth.role() = 'authenticated');

-- DM sees all catalogue entries
create policy "catalogue: dm read all"
  on public.catalogue_entries for select
  using (public.is_dm());

-- DM manages all entries
create policy "catalogue: dm write"
  on public.catalogue_entries for all
  using (public.is_dm())
  with check (public.is_dm());
```

- [ ] **Step 7: Party resources policies**

```sql
-- All authenticated users read resources
create policy "resources: authenticated read"
  on public.party_resources for select
  using (auth.role() = 'authenticated');

-- DM updates resources
create policy "resources: dm write"
  on public.party_resources for all
  using (public.is_dm())
  with check (public.is_dm());
```

- [ ] **Step 8: Verify in Supabase Table Editor**

Open Table Editor → any table → check RLS badge shows "RLS enabled". No commit needed.

---

## Task 4: Supabase Client + TypeScript Types

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/types.ts`

- [ ] **Step 1: Create `.env.local`**

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

Get both values from: Supabase dashboard → Settings → API.

Also add these to Vercel project environment variables (Vercel dashboard → Project → Settings → Environment Variables).

- [ ] **Step 2: Create `lib/supabase/client.ts`**

```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create `lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

- [ ] **Step 4: Create `lib/types.ts`**

```typescript
export type Role = 'dm' | 'player'

export interface Profile {
  id: string
  role: Role
  display_name: string | null
}

export interface GameMap {
  id: string
  name: string
  type: 'world' | 'city' | 'base' | 'custom'
  grid_cols: number
  grid_rows: number
  hex_radius: number
  created_at: string
}

export interface TileType {
  id: string
  name: string
  code: string
  color: string        // e.g. "oklch(0.62 0.09 120)"
  description: string | null
  produces: string | null  // resource key or null
  order_index: number
}

export interface MapTile {
  id: string
  map_id: string
  col: number
  row: number
  tile_type_id: string
  revealed: boolean
}

export type CatalogueEntryType = 'recipe' | 'structure'
export type StructureTag = 'Core' | 'Economy' | 'Military' | 'Unit'

export interface RecipeIngredient {
  resource: string
  amount: number
}

export interface CatalogueEntry {
  id: string
  type: CatalogueEntryType
  name: string
  description: string | null
  unlocked: boolean
  tag: StructureTag | null
  metadata: { ingredients?: RecipeIngredient[] } | null
  order_index: number
}

export interface PartyResources {
  id: string
  map_id: string | null
  gold: number
  wood: number
  stone: number
  food: number
  iron: number
}

// Resource display config
export const RESOURCE_CONFIG = [
  { key: 'gold',  code: 'GD', color: 'oklch(0.78 0.15 85)' },
  { key: 'wood',  code: 'WD', color: 'oklch(0.5 0.09 145)' },
  { key: 'stone', code: 'ST', color: 'oklch(0.55 0.02 260)' },
  { key: 'food',  code: 'FD', color: 'oklch(0.68 0.11 95)' },
  { key: 'iron',  code: 'IR', color: 'oklch(0.55 0.03 30)' },
] as const

export type ResourceKey = typeof RESOURCE_CONFIG[number]['key']
```

- [ ] **Step 5: Commit**

```bash
git add lib/ .env.local
git commit -m "feat: add Supabase clients and TypeScript types"
```

Note: `.env.local` should already be in `.gitignore` from the Next.js scaffold. Verify before committing.

---

## Task 5: Auth Middleware + Login Page

**Files:**
- Create: `middleware.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `components/auth/LoginForm.tsx`

- [ ] **Step 1: Create `middleware.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isLoginPage = request.nextUrl.pathname === '/login'

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

- [ ] **Step 2: Create `components/auth/LoginForm.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Enter an email to continue')
      return
    }
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-[380px] bg-panel border border-border-subtle rounded-[14px] p-10 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] animate-fadein">
      <div className="flex items-center gap-2.5 mb-1.5">
        <svg width="26" height="30" viewBox="0 0 30 34" className="flex-none">
          <polygon points="15,0 30,8.5 30,25.5 15,34 0,25.5 0,8.5" fill="oklch(0.78 0.15 85)" />
        </svg>
        <div className="text-[19px] font-bold tracking-[0.5px] text-text-primary">HEXFORGE</div>
      </div>
      <div className="text-[13px] text-text-muted mb-8">Sign in to continue your civilization</div>

      <label className="block text-[12px] text-text-muted mb-1.5">Email</label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full box-border bg-[oklch(0.16_0.012_260)] border border-border-subtle rounded-lg px-3 py-[11px] text-text-primary text-sm mb-4 outline-none focus:border-accent-gold"
      />

      <label className="block text-[12px] text-text-muted mb-1.5">Password</label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="••••••••"
        className="w-full box-border bg-[oklch(0.16_0.012_260)] border border-border-subtle rounded-lg px-3 py-[11px] text-text-primary text-sm mb-2 outline-none focus:border-accent-gold"
      />

      {error && <div className="text-[oklch(0.7_0.15_25)] text-[12px] mb-2.5">{error}</div>}

      <div className="flex justify-between items-center my-3.5 mb-6">
        <label className="flex items-center gap-1.5 text-[12px] text-text-muted cursor-pointer">
          <input type="checkbox" className="accent-[oklch(0.78_0.15_85)]" />
          Remember me
        </label>
        <a href="#" className="text-[12px] text-accent-teal no-underline">Forgot password?</a>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-accent-gold border-none rounded-lg py-3 text-sm font-bold text-[oklch(0.16_0.02_85)] cursor-pointer tracking-[0.3px] hover:bg-[oklch(0.83_0.14_85)] disabled:opacity-60"
      >
        {loading ? 'ENTERING…' : 'ENTER THE REALM'}
      </button>
    </form>
  )
}
```

- [ ] **Step 3: Create `app/(auth)/login/page.tsx`**

```typescript
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="w-screen h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 20%, oklch(0.19 0.02 260) 0%, oklch(0.12 0.01 260) 70%)' }}>
      <div
        className="absolute inset-0 opacity-50 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(120deg, transparent 0 82px, oklch(1 0 0 / 0.03) 82px 84px), repeating-linear-gradient(60deg, transparent 0 82px, oklch(1 0 0 / 0.03) 82px 84px)' }}
      />
      <LoginForm />
    </div>
  )
}
```

- [ ] **Step 4: Update `app/layout.tsx`**

```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hexforge',
  description: 'The Roaring Lands campaign map',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: Test login flow manually**

```bash
npm run dev
```
Visit `http://localhost:3000` — should redirect to `/login`. Sign up a user in Supabase Authentication → Users → Add user, then log in. Should redirect to `/` (shows 404 for now — that's fine).

- [ ] **Step 6: Commit**

```bash
git add app/ components/auth/ middleware.ts
git commit -m "feat: auth middleware and login page"
```

---

## Task 6: Design Tokens + Global CSS

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Write failing test for token reference**

```typescript
// tests/types.test.ts
import { RESOURCE_CONFIG } from '@/lib/types'

test('RESOURCE_CONFIG has 5 resources', () => {
  expect(RESOURCE_CONFIG).toHaveLength(5)
})

test('all resources have code, color, key', () => {
  for (const r of RESOURCE_CONFIG) {
    expect(r.key).toBeTruthy()
    expect(r.code).toHaveLength(2)
    expect(r.color).toMatch(/^oklch/)
  }
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test
```
Expected: PASS (RESOURCE_CONFIG already defined in Task 4). If FAIL, verify `lib/types.ts` exports RESOURCE_CONFIG.

- [ ] **Step 3: Replace `app/globals.css` with design tokens**

```css
@import "tailwindcss";

@theme {
  /* Backgrounds */
  --color-bg-deepest:   oklch(0.14 0.012 260);
  --color-bg-map:       oklch(0.115 0.01 260);
  --color-panel:        oklch(0.19 0.014 260);
  --color-panel-hud:    oklch(0.17 0.013 260);
  --color-panel-raised: oklch(0.22 0.015 260);
  --color-panel-hover:  oklch(0.26 0.017 260);

  /* Borders */
  --color-border-subtle: oklch(1 0 0 / 0.08);
  --color-border-faint:  oklch(1 0 0 / 0.14);

  /* Text */
  --color-text-primary: oklch(0.93 0.006 260);
  --color-text-bright:  oklch(0.88 0.006 260);
  --color-text-muted:   oklch(0.60 0.02 260);
  --color-text-dim:     oklch(0.55 0.02 260);

  /* Accents */
  --color-accent-gold:       oklch(0.78 0.15 85);
  --color-accent-gold-hover: oklch(0.83 0.14 85);
  --color-accent-gold-dark:  oklch(0.16 0.02 85);
  --color-accent-teal:       oklch(0.78 0.15 200);
  --color-accent-teal-hover: oklch(0.84 0.13 200);

  /* Tile types */
  --color-tile-plains:   oklch(0.62 0.09 120);
  --color-tile-forest:   oklch(0.5 0.09 145);
  --color-tile-mountain: oklch(0.55 0.02 260);
  --color-tile-water:    oklch(0.6 0.1 230);
  --color-tile-desert:   oklch(0.72 0.09 80);
  --color-tile-farmland: oklch(0.68 0.11 95);
  --color-tile-ore:      oklch(0.55 0.03 30);

  /* Animations */
  --animate-fadein: fadein 0.4s ease both;
}

@keyframes fadein {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes pulse {
  0%, 100% { opacity: 0.55; }
  50%       { opacity: 1; }
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--color-bg-deepest);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  color: var(--color-text-primary);
}

/* Scrollbar */
::-webkit-scrollbar { width: 9px; height: 9px; }
::-webkit-scrollbar-thumb { background: var(--color-border-faint); border-radius: 6px; }
::-webkit-scrollbar-track { background: transparent; }
```

- [ ] **Step 4: Verify dev server still starts**

```bash
npm run dev
```
Visit `http://localhost:3000/login` — background should be dark. If Tailwind v4 `@theme` throws errors, check that `tailwindcss` package is v4.x. If v3 is installed, replace `@theme { ... }` with equivalent CSS custom properties in `:root { ... }` and use Tailwind arbitrary values `[oklch(...)]` throughout.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css tests/types.test.ts
git commit -m "feat: design tokens and global CSS"
```

---

## Task 7: Hex Math Utilities (TDD)

**Files:**
- Create: `lib/hex-math.ts`
- Create: `tests/hex-math.test.ts`

Pointy-top hex geometry (radius = R):
- Width  W = R * √3 ≈ 83.138 when R = 48
- Height H = 2R = 96
- Vertical step = 0.75 * H = 72
- Odd rows offset right by W/2

- [ ] **Step 1: Write all failing tests**

```typescript
// tests/hex-math.test.ts
import { colRowToKey, keyToColRow, hexToPixel, neighborsOf } from '@/lib/hex-math'

describe('colRowToKey', () => {
  test('encodes col,row as string', () => {
    expect(colRowToKey(3, 5)).toBe('3,5')
    expect(colRowToKey(0, 0)).toBe('0,0')
  })
})

describe('keyToColRow', () => {
  test('decodes string to [col, row]', () => {
    expect(keyToColRow('3,5')).toEqual([3, 5])
    expect(keyToColRow('0,0')).toEqual([0, 0])
  })

  test('round-trips through colRowToKey', () => {
    expect(keyToColRow(colRowToKey(7, 12))).toEqual([7, 12])
  })
})

describe('hexToPixel', () => {
  test('even row: no x offset', () => {
    const { x, y } = hexToPixel(0, 0, 48)
    expect(x).toBeCloseTo(0)
    expect(y).toBeCloseTo(0)
  })

  test('odd row: offset by half hex-width', () => {
    const { x, y } = hexToPixel(0, 1, 48)
    // W = 48 * sqrt(3) ≈ 83.138, half = 41.569
    expect(x).toBeCloseTo(41.569, 1)
    expect(y).toBeCloseTo(72, 1)   // row 1 * 0.75 * 96
  })

  test('col 1 row 0: one hex-width right', () => {
    const { x } = hexToPixel(1, 0, 48)
    expect(x).toBeCloseTo(83.138, 1)
  })
})

describe('neighborsOf', () => {
  test('even row returns 6 neighbors', () => {
    expect(neighborsOf(5, 4)).toHaveLength(6)
  })

  test('odd row returns 6 neighbors', () => {
    expect(neighborsOf(5, 3)).toHaveLength(6)
  })

  test('even row: right neighbor is [col+1, row]', () => {
    const neighbors = neighborsOf(5, 4)
    expect(neighbors).toContainEqual([6, 4])
  })

  test('even row: NE neighbor is [col, row-1]', () => {
    const neighbors = neighborsOf(5, 4)
    expect(neighbors).toContainEqual([5, 3])
  })

  test('odd row: NE neighbor is [col+1, row-1]', () => {
    const neighbors = neighborsOf(5, 3)
    expect(neighbors).toContainEqual([6, 2])
  })

  test('even row: SW neighbor is [col-1, row+1]', () => {
    const neighbors = neighborsOf(5, 4)
    expect(neighbors).toContainEqual([4, 5])
  })
})
```

- [ ] **Step 2: Run to verify all fail**

```bash
npm test
```
Expected: `Cannot find module '@/lib/hex-math'`

- [ ] **Step 3: Implement `lib/hex-math.ts`**

```typescript
// Pointy-top hex grid, odd-r offset (odd rows shift right by half hex-width)

export function colRowToKey(col: number, row: number): string {
  return `${col},${row}`
}

export function keyToColRow(key: string): [number, number] {
  const [col, row] = key.split(',').map(Number)
  return [col, row]
}

export function hexToPixel(col: number, row: number, radius: number): { x: number; y: number } {
  const w = radius * Math.sqrt(3)
  const h = 2 * radius
  const x = col * w + (row % 2 !== 0 ? w / 2 : 0)
  const y = row * (h * 0.75)
  return { x, y }
}

// Odd-r offset neighbor directions (pointy-top, odd rows shifted right)
export function neighborsOf(col: number, row: number): [number, number][] {
  const isOdd = row % 2 !== 0
  return isOdd
    ? [
        [col + 1, row],     // E
        [col - 1, row],     // W
        [col + 1, row - 1], // NE
        [col,     row - 1], // NW
        [col + 1, row + 1], // SE
        [col,     row + 1], // SW
      ]
    : [
        [col + 1, row],     // E
        [col - 1, row],     // W
        [col,     row - 1], // NE
        [col - 1, row - 1], // NW
        [col,     row + 1], // SE
        [col - 1, row + 1], // SW
      ]
}

export function hexPolygonPoints(radius: number): string {
  const w = radius * Math.sqrt(3)
  const h = 2 * radius
  return `${w/2},0 ${w},${h/4} ${w},${3*h/4} ${w/2},${h} 0,${3*h/4} 0,${h/4}`
}

export function gridPixelSize(cols: number, rows: number, radius: number): { width: number; height: number } {
  const w = radius * Math.sqrt(3)
  const h = 2 * radius
  return {
    width:  cols * w + w / 2,   // +half for odd-row offset
    height: rows * h * 0.75 + h * 0.25,
  }
}
```

- [ ] **Step 4: Run tests — all should pass**

```bash
npm test
```
Expected: all 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/hex-math.ts tests/hex-math.test.ts
git commit -m "feat: hex math utilities (TDD)"
```

---

## Task 8: Game Context Provider

**Files:**
- Create: `components/providers/GameProvider.tsx`

The GameProvider is a client component that holds shared interactive state: the DM role flag, active map, selected tile type for placement, and the pan/zoom state. It wraps the game layout.

- [ ] **Step 1: Create `components/providers/GameProvider.tsx`**

```typescript
'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { GameMap, TileType, Role } from '@/lib/types'

interface GameState {
  role: Role
  activeMap: GameMap
  maps: GameMap[]
  setActiveMap: (map: GameMap) => void
  selectedTileId: string | null
  setSelectedTileId: (id: string | null) => void
  catalogueOpen: boolean
  setCatalogueOpen: (open: boolean) => void
  // Pan/zoom (managed here so HUD zoom controls can update it)
  zoom: number
  setZoom: (z: number) => void
  pan: { x: number; y: number }
  setPan: (p: { x: number; y: number }) => void
}

const GameContext = createContext<GameState | null>(null)

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}

interface Props {
  role: Role
  initialMap: GameMap
  maps: GameMap[]
  children: React.ReactNode
}

export function GameProvider({ role, initialMap, maps: initialMaps, children }: Props) {
  const [activeMap, setActiveMap] = useState<GameMap>(initialMap)
  const [maps] = useState<GameMap[]>(initialMaps)
  const [selectedTileId, setSelectedTileIdState] = useState<string | null>(null)
  const [catalogueOpen, setCatalogueOpen] = useState(true)
  const [zoom, setZoomState] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const setSelectedTileId = useCallback((id: string | null) => {
    setSelectedTileIdState(id)
  }, [])

  const setZoom = useCallback((z: number) => {
    setZoomState(Math.min(2.5, Math.max(0.4, z)))
  }, [])

  return (
    <GameContext.Provider value={{
      role, activeMap, maps, setActiveMap,
      selectedTileId, setSelectedTileId,
      catalogueOpen, setCatalogueOpen,
      zoom, setZoom, pan, setPan,
    }}>
      {children}
    </GameContext.Provider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/providers/GameProvider.tsx
git commit -m "feat: game context provider"
```

---

## Task 9: Game Layout + HUD

**Files:**
- Create: `app/(game)/layout.tsx`
- Create: `app/(game)/page.tsx`
- Create: `components/hud/Hud.tsx`
- Create: `components/hud/ResourcePill.tsx`
- Create: `components/hud/ZoomControls.tsx`
- Create: `components/maps/MapSwitcher.tsx`

- [ ] **Step 1: Create `app/(game)/layout.tsx`**

This server component fetches session data and wraps children in GameProvider.

```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GameProvider } from '@/components/providers/GameProvider'
import type { Profile, GameMap, Role } from '@/lib/types'

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: maps }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase.from('maps').select('*').order('created_at'),
  ])

  const role: Role = (profile?.role ?? 'player') as Role
  const mapList: GameMap[] = (maps ?? []) as GameMap[]
  const initialMap = mapList[0]

  if (!initialMap) {
    return <div className="text-text-muted p-8">No maps created yet. Ask the DM to create one.</div>
  }

  return (
    <GameProvider role={role} initialMap={initialMap} maps={mapList}>
      {children}
    </GameProvider>
  )
}
```

- [ ] **Step 2: Create `components/hud/ResourcePill.tsx`**

```typescript
interface Props {
  code: string
  color: string
  amount: number
}

export default function ResourcePill({ code, color, amount }: Props) {
  return (
    <div className="flex items-center gap-[7px]">
      <div
        className="w-5 h-5 rounded-[5px] flex-none flex items-center justify-center text-[10px] font-bold font-mono"
        style={{ background: color, color: 'oklch(0.14 0.02 260)' }}
      >
        {code}
      </div>
      <div className="text-[13px] font-semibold font-mono text-text-bright">{amount}</div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/hud/ZoomControls.tsx`**

```typescript
'use client'
import { useGame } from '@/components/providers/GameProvider'

export default function ZoomControls() {
  const { zoom, setZoom } = useGame()
  return (
    <div className="flex items-center gap-3">
      <div className="text-[12px] text-text-muted">
        Zoom <span className="text-text-bright font-mono">{Math.round(zoom * 100)}%</span>
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={() => setZoom(zoom - 0.15)}
          className="w-7 h-7 rounded-[7px] border border-border-subtle bg-panel-raised text-text-bright cursor-pointer text-base leading-none hover:bg-panel-hover"
        >
          −
        </button>
        <button
          onClick={() => setZoom(zoom + 0.15)}
          className="w-7 h-7 rounded-[7px] border border-border-subtle bg-panel-raised text-text-bright cursor-pointer text-base leading-none hover:bg-panel-hover"
        >
          +
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `components/maps/MapSwitcher.tsx`**

```typescript
'use client'
import { useGame } from '@/components/providers/GameProvider'
import type { GameMap } from '@/lib/types'

export default function MapSwitcher() {
  const { maps, activeMap, setActiveMap, role } = useGame()
  if (maps.length <= 1 && role !== 'dm') return null
  return (
    <select
      value={activeMap.id}
      onChange={e => {
        const m = maps.find((m: GameMap) => m.id === e.target.value)
        if (m) setActiveMap(m)
      }}
      className="h-8 px-2 rounded-lg border border-border-subtle bg-panel-raised text-text-primary text-[12px] cursor-pointer"
    >
      {maps.map((m: GameMap) => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>
  )
}
```

- [ ] **Step 5: Create `components/hud/Hud.tsx`**

```typescript
import ResourcePill from './ResourcePill'
import ZoomControls from './ZoomControls'
import MapSwitcher from '@/components/maps/MapSwitcher'
import CatalogueToggle from './CatalogueToggle'
import type { PartyResources } from '@/lib/types'
import { RESOURCE_CONFIG } from '@/lib/types'

interface Props {
  resources: PartyResources
}

export default function Hud({ resources }: Props) {
  return (
    <div className="h-14 flex-none flex items-center gap-[22px] px-5 bg-panel-hud border-b border-border-subtle z-[5]">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-1.5">
        <svg width="18" height="21" viewBox="0 0 30 34" className="flex-none">
          <polygon points="15,0 30,8.5 30,25.5 15,34 0,25.5 0,8.5" fill="oklch(0.78 0.15 85)" />
        </svg>
        <div className="text-[14px] font-bold tracking-[0.4px] text-text-primary">HEXFORGE</div>
      </div>
      <div className="w-px h-6.5 bg-border-subtle" />

      {/* Resources */}
      {RESOURCE_CONFIG.map(r => (
        <ResourcePill
          key={r.key}
          code={r.code}
          color={r.color}
          amount={resources[r.key as keyof PartyResources] as number}
        />
      ))}

      <div className="flex-1" />
      <MapSwitcher />
      <ZoomControls />
      <div className="w-px h-6.5 bg-border-subtle" />
      <CatalogueToggle />
      {/* Avatar placeholder */}
      <div className="w-[30px] h-[30px] rounded-full bg-[oklch(0.3_0.02_260)] border border-border-subtle" />
    </div>
  )
}
```

- [ ] **Step 6: Create `components/hud/CatalogueToggle.tsx`**

```typescript
'use client'
import { useGame } from '@/components/providers/GameProvider'

export default function CatalogueToggle() {
  const { catalogueOpen, setCatalogueOpen } = useGame()
  return (
    <button
      onClick={() => setCatalogueOpen(!catalogueOpen)}
      className="h-8 px-3.5 rounded-lg border border-border-subtle cursor-pointer text-[12.5px] font-semibold text-text-primary"
      style={{ background: catalogueOpen ? 'oklch(0.78 0.15 85 / 0.12)' : 'transparent' }}
    >
      Catalogue
    </button>
  )
}
```

- [ ] **Step 7: Create `app/(game)/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hud from '@/components/hud/Hud'
import GameView from '@/components/GameView'
import type { PartyResources, MapTile, TileType, CatalogueEntry } from '@/lib/types'

export default async function GamePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch the first map's id (GameLayout set activeMap, but page fetches the data)
  const { data: maps } = await supabase.from('maps').select('id').order('created_at').limit(1)
  const mapId = maps?.[0]?.id

  const [
    { data: mapTiles },
    { data: tileTypes },
    { data: catalogueEntries },
    { data: resources },
  ] = await Promise.all([
    supabase.from('map_tiles').select('*').eq('map_id', mapId ?? ''),
    supabase.from('tile_types').select('*').order('order_index'),
    supabase.from('catalogue_entries').select('*').order('order_index'),
    supabase.from('party_resources').select('*').eq('map_id', mapId ?? '').single<PartyResources>(),
  ])

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden">
      <Hud resources={resources ?? { id: '', map_id: null, gold: 0, wood: 0, stone: 0, food: 0, iron: 0 }} />
      <GameView
        initialTiles={(mapTiles ?? []) as MapTile[]}
        tileTypes={(tileTypes ?? []) as TileType[]}
        catalogueEntries={(catalogueEntries ?? []) as CatalogueEntry[]}
      />
    </div>
  )
}
```

- [ ] **Step 8: Create `components/GameView.tsx`** (client shell, wires grid + catalogue)

```typescript
'use client'
import { useState } from 'react'
import HexGrid from './hex-grid/HexGrid'
import CataloguePanel from './catalogue/CataloguePanel'
import { useGame } from './providers/GameProvider'
import type { MapTile, TileType, CatalogueEntry } from '@/lib/types'

interface Props {
  initialTiles: MapTile[]
  tileTypes: TileType[]
  catalogueEntries: CatalogueEntry[]
}

export default function GameView({ initialTiles, tileTypes, catalogueEntries }: Props) {
  const { catalogueOpen } = useGame()
  const [tiles, setTiles] = useState<MapTile[]>(initialTiles)

  return (
    <div className="flex-1 relative flex overflow-hidden">
      <HexGrid
        tiles={tiles}
        setTiles={setTiles}
        tileTypes={tileTypes}
      />
      {catalogueOpen && (
        <CataloguePanel
          tileTypes={tileTypes}
          catalogueEntries={catalogueEntries}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 9: Run dev server and verify game page renders**

```bash
npm run dev
```
Log in → should see HUD bar with resource pills. No map yet (hex grid coming next). Console should be error-free.

- [ ] **Step 10: Commit**

```bash
git add app/(game)/ components/hud/ components/maps/ components/GameView.tsx
git commit -m "feat: game layout, HUD, and map switcher"
```

---

## Task 10: HexTile Component

**Files:**
- Create: `components/hex-grid/HexTile.tsx`

- [ ] **Step 1: Create `components/hex-grid/HexTile.tsx`**

```typescript
import { hexPolygonPoints } from '@/lib/hex-math'
import type { TileType } from '@/lib/types'

interface Props {
  x: number
  y: number
  radius: number
  tileType: TileType | null      // null = empty hex
  revealed: boolean              // only relevant for placed tiles
  isSelected: boolean            // current tile type selected for placement
  inPlacementMode: boolean       // some tile type is armed for placement
  isDm: boolean
  onClick: () => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
}

export default function HexTile({
  x, y, radius, tileType, revealed, isSelected,
  inPlacementMode, isDm, onClick, onDrop, onDragOver,
}: Props) {
  const w = radius * Math.sqrt(3)
  const h = 2 * radius
  const points = hexPolygonPoints(radius)

  let fill = 'transparent'
  let stroke = 'oklch(1 0 0 / 0.14)'
  let strokeWidth = 1

  if (tileType) {
    // DM sees all placed tiles; players see only revealed ones
    if (isDm || revealed) {
      fill = tileType.color
    } else {
      fill = 'transparent'  // hidden from player
    }
  } else if (inPlacementMode && isDm) {
    fill = 'oklch(0.78 0.15 85 / 0.08)'  // faint gold tint on empty hexes
  }

  if (isSelected) {
    stroke = 'oklch(0.78 0.15 200)'
    strokeWidth = 3
  }

  // DM: fog overlay on unrevealed placed tiles (visible to DM, shown dim)
  const isDmFogged = isDm && tileType && !revealed

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: 'absolute', left: x, top: y, cursor: 'pointer' }}
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <polygon
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={isDmFogged ? 0.4 : 1}
      />
      {tileType && (isDm || revealed) && (
        <text
          x={w / 2}
          y={h / 2 + 5}
          textAnchor="middle"
          fontFamily="ui-monospace, monospace"
          fontSize="15"
          fontWeight="700"
          fill="oklch(0.12 0.01 260)"
          opacity={isDmFogged ? 0.6 : 1}
        >
          {tileType.code}
        </text>
      )}
    </svg>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/hex-grid/HexTile.tsx
git commit -m "feat: HexTile SVG component"
```

---

## Task 11: HexGrid with Pan/Zoom

**Files:**
- Create: `components/hex-grid/HexGrid.tsx`
- Create: `components/hex-grid/PlacingPill.tsx`

- [ ] **Step 1: Create `components/hex-grid/PlacingPill.tsx`**

```typescript
'use client'
import { useGame } from '@/components/providers/GameProvider'
import type { TileType } from '@/lib/types'

interface Props {
  tileTypes: TileType[]
}

export default function PlacingPill({ tileTypes }: Props) {
  const { selectedTileId, setSelectedTileId } = useGame()
  if (!selectedTileId) return null
  const tile = tileTypes.find(t => t.id === selectedTileId)
  if (!tile) return null

  return (
    <div className="absolute top-4 left-4 z-10 flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-[12.5px] font-bold shadow-[0_8px_20px_rgba(0,0,0,0.35)]"
      style={{ background: 'oklch(0.78 0.15 85 / 0.95)', color: 'oklch(0.14 0.02 85)' }}>
      Placing: {tile.name}
      <button
        onClick={() => setSelectedTileId(null)}
        className="border-none rounded-[5px] w-[18px] h-[18px] cursor-pointer text-xs leading-none flex items-center justify-center"
        style={{ background: 'oklch(0.14 0.02 85 / 0.2)', color: 'oklch(0.14 0.02 85)' }}
      >
        ✕
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/hex-grid/HexGrid.tsx`**

```typescript
'use client'
import { useRef, useCallback, useState } from 'react'
import { useGame } from '@/components/providers/GameProvider'
import HexTile from './HexTile'
import PlacingPill from './PlacingPill'
import TileInspector from '@/components/inspector/TileInspector'
import { hexToPixel, gridPixelSize, colRowToKey, keyToColRow } from '@/lib/hex-math'
import { placeTile } from '@/actions/map'
import type { MapTile, TileType } from '@/lib/types'

interface Props {
  tiles: MapTile[]
  setTiles: React.Dispatch<React.SetStateAction<MapTile[]>>
  tileTypes: TileType[]
}

export default function HexGrid({ tiles, setTiles, tileTypes }: Props) {
  const { role, activeMap, selectedTileId, setSelectedTileId, zoom, setZoom, pan, setPan } = useGame()
  const isDm = role === 'dm'
  const { grid_cols: cols, grid_rows: rows, hex_radius: radius } = activeMap
  const { width: gridW, height: gridH } = gridPixelSize(cols, rows, radius)
  const w = radius * Math.sqrt(3)
  const h = 2 * radius

  const [inspectedKey, setInspectedKey] = useState<string | null>(null)

  // Pan drag state (NOT React state, to avoid re-renders during drag)
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })
  const moved = useRef(false)

  const tileMap = new Map(tiles.map(t => [colRowToKey(t.col, t.row), t]))
  const tileTypeMap = new Map(tileTypes.map(t => [t.id, t]))

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as Element).closest('svg')) return  // clicks on hex handled by hex
    dragging.current = true
    moved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...pan }
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  }, [pan])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy })
  }, [setPan])

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    setZoom(zoom + (e.deltaY > 0 ? -0.1 : 0.1))
  }, [zoom, setZoom])

  async function handleHexClick(col: number, row: number) {
    if (moved.current) return  // was a drag, not a click
    const key = colRowToKey(col, row)
    const existing = tileMap.get(key)

    if (selectedTileId && isDm) {
      // Place tile
      const result = await placeTile({ mapId: activeMap.id, col, row, tileTypeId: selectedTileId })
      if (result.tile) {
        setTiles(prev => {
          const next = prev.filter(t => !(t.col === col && t.row === row))
          return [...next, result.tile!]
        })
      }
      return
    }

    if (existing) {
      setInspectedKey(key === inspectedKey ? null : key)
    }
  }

  function handleDrop(e: React.DragEvent, col: number, row: number) {
    if (!isDm) return
    const tileId = e.dataTransfer.getData('tileTypeId')
    if (!tileId) return
    setSelectedTileId(tileId)
    handleHexClick(col, row)
  }

  const hexes: { col: number; row: number; key: string }[] = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      hexes.push({ col, row, key: colRowToKey(col, row) })
    }
  }

  const inspectedTile = inspectedKey ? tileMap.get(inspectedKey) : null
  const inspectedType = inspectedTile ? tileTypeMap.get(inspectedTile.tile_type_id) ?? null : null

  return (
    <div
      className="flex-1 relative overflow-hidden"
      style={{
        background: 'oklch(0.115 0.01 260)',
        backgroundImage: 'radial-gradient(oklch(1 0 0 / 0.045) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
        cursor: dragging.current ? 'grabbing' : 'grab',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onWheel={onWheel}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: gridW,
          height: gridH,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {hexes.map(({ col, row, key }) => {
          const { x, y } = hexToPixel(col, row, radius)
          const tile = tileMap.get(key) ?? null
          const tileType = tile ? (tileTypeMap.get(tile.tile_type_id) ?? null) : null
          return (
            <HexTile
              key={key}
              x={x}
              y={y}
              radius={radius}
              tileType={tileType}
              revealed={tile?.revealed ?? false}
              isSelected={!!tile && key === inspectedKey}
              inPlacementMode={!!selectedTileId}
              isDm={isDm}
              onClick={() => handleHexClick(col, row)}
              onDrop={e => handleDrop(e, col, row)}
              onDragOver={e => e.preventDefault()}
            />
          )
        })}
      </div>

      {selectedTileId && <PlacingPill tileTypes={tileTypes} />}
      {inspectedTile && inspectedType && (
        <TileInspector
          tile={inspectedTile}
          tileType={inspectedType}
          allTiles={tiles}
          tileTypeMap={tileTypeMap}
          onClose={() => setInspectedKey(null)}
          onRevealToggle={isDm ? async () => {
            const { revealTile } = await import('@/actions/map')
            const result = await revealTile({ tileId: inspectedTile.id, revealed: !inspectedTile.revealed })
            if (result.tile) {
              setTiles(prev => prev.map(t => t.id === result.tile!.id ? result.tile! : t))
              setInspectedKey(null)
            }
          } : undefined}
          isDm={isDm}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/hex-grid/
git commit -m "feat: HexGrid with pan/zoom and tile placement"
```

---

## Task 12: Server Actions — Map

**Files:**
- Create: `actions/map.ts`

- [ ] **Step 1: Create `actions/map.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { MapTile, GameMap } from '@/lib/types'

export async function placeTile({
  mapId, col, row, tileTypeId,
}: {
  mapId: string
  col: number
  row: number
  tileTypeId: string
}): Promise<{ tile: MapTile | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('map_tiles')
    .upsert({ map_id: mapId, col, row, tile_type_id: tileTypeId, revealed: false }, {
      onConflict: 'map_id,col,row',
    })
    .select()
    .single<MapTile>()

  if (error) return { tile: null, error: error.message }
  revalidatePath('/')
  return { tile: data, error: null }
}

export async function revealTile({
  tileId, revealed,
}: {
  tileId: string
  revealed: boolean
}): Promise<{ tile: MapTile | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('map_tiles')
    .update({ revealed })
    .eq('id', tileId)
    .select()
    .single<MapTile>()

  if (error) return { tile: null, error: error.message }
  revalidatePath('/')
  return { tile: data, error: null }
}

export async function createMap({
  name, type, gridCols, gridRows,
}: {
  name: string
  type: 'world' | 'city' | 'base' | 'custom'
  gridCols: number
  gridRows: number
}): Promise<{ map: GameMap | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('maps')
    .insert({ name, type, grid_cols: gridCols, grid_rows: gridRows, hex_radius: 48 })
    .select()
    .single<GameMap>()

  if (error) return { map: null, error: error.message }

  // Create resource row for new map
  await supabase.from('party_resources').insert({ map_id: data.id })
  revalidatePath('/')
  return { map: data, error: null }
}
```

- [ ] **Step 2: Commit**

```bash
git add actions/map.ts
git commit -m "feat: server actions for map tile placement and reveal"
```

---

## Task 13: Tile Inspector

**Files:**
- Create: `components/inspector/TileInspector.tsx`

- [ ] **Step 1: Create `components/inspector/TileInspector.tsx`**

```typescript
import { neighborsOf, colRowToKey } from '@/lib/hex-math'
import type { MapTile, TileType } from '@/lib/types'

interface Props {
  tile: MapTile
  tileType: TileType
  allTiles: MapTile[]
  tileTypeMap: Map<string, TileType>
  onClose: () => void
  onRevealToggle?: () => void
  isDm: boolean
}

export default function TileInspector({ tile, tileType, allTiles, tileTypeMap, onClose, onRevealToggle, isDm }: Props) {
  const neighborCoords = neighborsOf(tile.col, tile.row)
  const tileIndex = new Map(allTiles.map(t => [colRowToKey(t.col, t.row), t]))
  const adjacentTiles = neighborCoords
    .map(([c, r]) => tileIndex.get(colRowToKey(c, r)))
    .filter(Boolean) as MapTile[]

  return (
    <div
      className="absolute bottom-4 left-4 w-[250px] rounded-[10px] border border-border-subtle p-4 z-10 animate-fadein"
      style={{ background: 'oklch(0.22 0.015 260)', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold font-mono"
            style={{ background: tileType.color, color: 'oklch(0.12 0.01 260)' }}
          >
            {tileType.code}
          </div>
          <div className="text-[13px] font-bold text-text-primary">{tileType.name}</div>
        </div>
        <button
          onClick={onClose}
          className="text-text-muted border-none bg-transparent cursor-pointer text-base"
        >
          ✕
        </button>
      </div>

      {tileType.produces && (
        <div className="text-[12px] text-text-muted mb-2">
          Produces: <span className="text-text-bright capitalize">{tileType.produces}</span>
        </div>
      )}

      {tileType.description && (
        <div className="text-[11.5px] text-text-dim mb-3">{tileType.description}</div>
      )}

      <div className="text-[11.5px] text-text-muted mb-1.5">
        Connections ({adjacentTiles.length})
      </div>
      {adjacentTiles.length === 0 ? (
        <div className="text-[11px] text-text-dim">No adjacent tiles yet</div>
      ) : (
        <div className="flex flex-col gap-1">
          {adjacentTiles.map(t => {
            const type = tileTypeMap.get(t.tile_type_id)
            return (
              <div key={t.id} className="text-[11px] text-text-bright flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm flex-none" style={{ background: type?.color }} />
                {type?.name ?? 'Unknown'}
              </div>
            )
          })}
        </div>
      )}

      {isDm && onRevealToggle && (
        <button
          onClick={onRevealToggle}
          className="mt-3 w-full py-1.5 rounded-lg border border-border-subtle text-[11.5px] font-semibold cursor-pointer"
          style={{
            background: tile.revealed ? 'oklch(0.78 0.15 25 / 0.15)' : 'oklch(0.78 0.15 200 / 0.15)',
            color: tile.revealed ? 'oklch(0.75 0.15 25)' : 'oklch(0.78 0.15 200)',
          }}
        >
          {tile.revealed ? 'Hide from players' : 'Reveal to players'}
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/inspector/TileInspector.tsx
git commit -m "feat: tile inspector with neighbor connections and reveal toggle"
```

---

## Task 14: Catalogue Panel

**Files:**
- Create: `components/catalogue/CataloguePanel.tsx`
- Create: `components/catalogue/TileCard.tsx`
- Create: `components/catalogue/RecipeCard.tsx`
- Create: `components/catalogue/StructureCard.tsx`

- [ ] **Step 1: Create `components/catalogue/TileCard.tsx`**

```typescript
'use client'
import { useGame } from '@/components/providers/GameProvider'
import type { TileType } from '@/lib/types'

interface Props {
  tile: TileType
  isDm: boolean
}

export default function TileCard({ tile, isDm }: Props) {
  const { selectedTileId, setSelectedTileId } = useGame()
  const isActive = selectedTileId === tile.id

  function onDragStart(e: React.DragEvent) {
    if (!isDm) return
    e.dataTransfer.setData('tileTypeId', tile.id)
  }

  return (
    <div
      draggable={isDm}
      onDragStart={onDragStart}
      onClick={() => isDm && setSelectedTileId(isActive ? null : tile.id)}
      className="flex items-center gap-3 p-2.5 rounded-[10px] border cursor-pointer transition-colors"
      style={{
        background: isActive ? 'oklch(0.78 0.15 85 / 0.1)' : 'oklch(0.22 0.015 260)',
        borderColor: isActive ? 'oklch(0.78 0.15 85 / 0.4)' : 'oklch(1 0 0 / 0.08)',
      }}
    >
      <div
        className="w-[34px] h-[34px] rounded-lg flex-none flex items-center justify-center text-[11px] font-bold font-mono"
        style={{ background: tile.color, color: 'oklch(0.12 0.01 260)' }}
      >
        {tile.code}
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-bold text-text-primary truncate">{tile.name}</div>
        {tile.description && (
          <div className="text-[11.5px] text-text-muted truncate">{tile.description}</div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `components/catalogue/RecipeCard.tsx`**

```typescript
import type { CatalogueEntry } from '@/lib/types'
import { RESOURCE_CONFIG } from '@/lib/types'

interface Props {
  entry: CatalogueEntry
}

export default function RecipeCard({ entry }: Props) {
  const ingredients = entry.metadata?.ingredients ?? []
  return (
    <div className="flex items-start gap-3 p-2.5 rounded-[10px] border border-border-subtle bg-panel-raised">
      <div className="w-[34px] h-[34px] rounded-lg flex-none flex items-center justify-center text-[11px] font-bold text-text-muted bg-[oklch(0.26_0.015_260)]">
        RC
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-bold text-text-primary">{entry.name}</div>
        {entry.description && <div className="text-[11.5px] text-text-muted">{entry.description}</div>}
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {ingredients.map((ing, i) => {
              const res = RESOURCE_CONFIG.find(r => r.key === ing.resource)
              return (
                <span key={i} className="text-[10.5px] font-mono px-1.5 py-0.5 rounded-md"
                  style={{ background: `${res?.color ?? 'oklch(0.3 0 0)'}22`, color: res?.color ?? 'oklch(0.7 0 0)' }}>
                  {ing.amount}× {res?.code ?? ing.resource.toUpperCase()}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `components/catalogue/StructureCard.tsx`**

```typescript
import type { CatalogueEntry } from '@/lib/types'

const TAG_COLORS: Record<string, string> = {
  Core:     'oklch(0.78 0.15 85)',
  Economy:  'oklch(0.78 0.15 145)',
  Military: 'oklch(0.75 0.15 25)',
  Unit:     'oklch(0.78 0.15 200)',
}

interface Props {
  entry: CatalogueEntry
}

export default function StructureCard({ entry }: Props) {
  const tagColor = entry.tag ? TAG_COLORS[entry.tag] : null
  return (
    <div className="flex items-start gap-3 p-2.5 rounded-[10px] border border-border-subtle bg-panel-raised">
      <div className="w-[34px] h-[34px] rounded-lg flex-none flex items-center justify-center text-[11px] font-bold text-text-muted bg-[oklch(0.26_0.015_260)]">
        BL
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="text-[13px] font-bold text-text-primary">{entry.name}</div>
          {tagColor && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: `${tagColor}22`, color: tagColor }}>
              {entry.tag}
            </span>
          )}
        </div>
        {entry.description && <div className="text-[11.5px] text-text-muted mt-0.5">{entry.description}</div>}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Create `components/catalogue/CataloguePanel.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { useGame } from '@/components/providers/GameProvider'
import TileCard from './TileCard'
import RecipeCard from './RecipeCard'
import StructureCard from './StructureCard'
import type { TileType, CatalogueEntry } from '@/lib/types'

type Tab = 'tiles' | 'recipes' | 'resources' | 'buildings'
const TABS: { id: Tab; label: string }[] = [
  { id: 'tiles',     label: 'Hex Tiles' },
  { id: 'recipes',   label: 'Recipes' },
  { id: 'resources', label: 'Resources' },
  { id: 'buildings', label: 'Buildings' },
]

interface Props {
  tileTypes: TileType[]
  catalogueEntries: CatalogueEntry[]
}

export default function CataloguePanel({ tileTypes, catalogueEntries }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('tiles')
  const { role } = useGame()
  const isDm = role === 'dm'

  const recipes    = catalogueEntries.filter(e => e.type === 'recipe')
  const structures = catalogueEntries.filter(e => e.type === 'structure')

  return (
    <div className="w-80 flex flex-col border-l border-border-subtle flex-none overflow-hidden" style={{ background: 'oklch(0.19 0.014 260)' }}>
      {/* Tabs */}
      <div className="flex border-b border-border-subtle flex-none">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 py-3 border-none cursor-pointer text-[11.5px] font-semibold uppercase tracking-wide transition-colors"
            style={{
              background: 'transparent',
              color: activeTab === tab.id ? 'oklch(0.93 0.006 260)' : 'oklch(0.55 0.02 260)',
              borderBottom: activeTab === tab.id ? '2px solid oklch(0.78 0.15 85)' : '2px solid transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {activeTab === 'tiles' && tileTypes.map(t => (
          <TileCard key={t.id} tile={t} isDm={isDm} />
        ))}

        {activeTab === 'recipes' && (
          recipes.length > 0
            ? recipes.map(e => <RecipeCard key={e.id} entry={e} />)
            : <div className="text-[12px] text-text-muted text-center py-8">No recipes unlocked yet</div>
        )}

        {activeTab === 'resources' && (
          <div className="text-[12px] text-text-muted text-center py-8">Resource details coming soon</div>
        )}

        {activeTab === 'buildings' && (
          structures.length > 0
            ? structures.map(e => <StructureCard key={e.id} entry={e} />)
            : <div className="text-[12px] text-text-muted text-center py-8">No buildings unlocked yet</div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Test in dev server**

```bash
npm run dev
```
Log in → Catalogue panel should appear on the right with 4 tabs. Hex Tiles tab should show seeded tile types. DM should be able to click/drag cards.

- [ ] **Step 6: Commit**

```bash
git add components/catalogue/
git commit -m "feat: catalogue panel with tiles, recipes, and structures"
```

---

## Task 15: DM Catalogue Management

**Files:**
- Create: `actions/catalogue.ts`
- Create: `components/catalogue/DmTileEditor.tsx`
- Create: `components/catalogue/DmEntryToggle.tsx`

- [ ] **Step 1: Create `actions/catalogue.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TileType, CatalogueEntry } from '@/lib/types'

export async function createTileType(data: {
  name: string; code: string; color: string; description: string; produces: string | null
}): Promise<{ tileType: TileType | null; error: string | null }> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('tile_types')
    .insert(data)
    .select()
    .single<TileType>()
  if (error) return { tileType: null, error: error.message }
  revalidatePath('/')
  return { tileType: result, error: null }
}

export async function updateTileType(
  id: string,
  data: Partial<Pick<TileType, 'name' | 'code' | 'color' | 'description' | 'produces'>>
): Promise<{ tileType: TileType | null; error: string | null }> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('tile_types')
    .update(data)
    .eq('id', id)
    .select()
    .single<TileType>()
  if (error) return { tileType: null, error: error.message }
  revalidatePath('/')
  return { tileType: result, error: null }
}

export async function setEntryUnlocked(
  id: string, unlocked: boolean
): Promise<{ entry: CatalogueEntry | null; error: string | null }> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('catalogue_entries')
    .update({ unlocked })
    .eq('id', id)
    .select()
    .single<CatalogueEntry>()
  if (error) return { entry: null, error: error.message }
  revalidatePath('/')
  return { entry: result, error: null }
}

export async function createEntry(data: {
  type: 'recipe' | 'structure'
  name: string
  description: string
  tag: string | null
  metadata: object | null
}): Promise<{ entry: CatalogueEntry | null; error: string | null }> {
  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('catalogue_entries')
    .insert({ ...data, unlocked: false })
    .select()
    .single<CatalogueEntry>()
  if (error) return { entry: null, error: error.message }
  revalidatePath('/')
  return { entry: result, error: null }
}
```

- [ ] **Step 2: Create `components/catalogue/DmEntryToggle.tsx`**

This toggle appears next to recipe/structure cards for the DM:

```typescript
'use client'
import { useState } from 'react'
import { setEntryUnlocked } from '@/actions/catalogue'

interface Props {
  entryId: string
  unlocked: boolean
  onToggle: (unlocked: boolean) => void
}

export default function DmEntryToggle({ entryId, unlocked, onToggle }: Props) {
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const result = await setEntryUnlocked(entryId, !unlocked)
    setLoading(false)
    if (result.entry) onToggle(result.entry.unlocked)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer disabled:opacity-50"
      style={{
        background: unlocked ? 'oklch(0.78 0.15 145 / 0.15)' : 'oklch(0.55 0.02 260 / 0.15)',
        borderColor: unlocked ? 'oklch(0.78 0.15 145 / 0.4)' : 'oklch(0.55 0.02 260 / 0.4)',
        color: unlocked ? 'oklch(0.78 0.15 145)' : 'oklch(0.55 0.02 260)',
      }}
    >
      {unlocked ? 'Unlocked' : 'Locked'}
    </button>
  )
}
```

- [ ] **Step 3: Update `CataloguePanel.tsx` to use DmEntryToggle**

In `CataloguePanel.tsx`, import `DmEntryToggle` and add local state for entries:

```typescript
// Add at top of component body:
const [entries, setEntries] = useState<CatalogueEntry[]>(catalogueEntries)
const recipes    = entries.filter(e => e.type === 'recipe')
const structures = entries.filter(e => e.type === 'structure')

function handleEntryToggle(id: string, unlocked: boolean) {
  setEntries(prev => prev.map(e => e.id === id ? { ...e, unlocked } : e))
}
```

Wrap `RecipeCard` and `StructureCard` in a div with the toggle:

```typescript
{activeTab === 'recipes' && recipes.map(e => (
  <div key={e.id} className="relative">
    <RecipeCard entry={e} />
    {isDm && (
      <div className="absolute top-2 right-2">
        <DmEntryToggle
          entryId={e.id}
          unlocked={e.unlocked}
          onToggle={u => handleEntryToggle(e.id, u)}
        />
      </div>
    )}
  </div>
))}
```

Apply same pattern for `buildings` tab / `StructureCard`.

- [ ] **Step 4: Commit**

```bash
git add actions/catalogue.ts components/catalogue/DmEntryToggle.tsx components/catalogue/CataloguePanel.tsx
git commit -m "feat: DM catalogue management and entry unlock toggle"
```

---

## Task 16: Resource Management

**Files:**
- Create: `actions/resources.ts`
- Create: `components/hud/DmResourceEditor.tsx`

- [ ] **Step 1: Create `actions/resources.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PartyResources } from '@/lib/types'

export async function updateResources(
  mapId: string,
  values: Partial<Pick<PartyResources, 'gold' | 'wood' | 'stone' | 'food' | 'iron'>>
): Promise<{ resources: PartyResources | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('party_resources')
    .update(values)
    .eq('map_id', mapId)
    .select()
    .single<PartyResources>()
  if (error) return { resources: null, error: error.message }
  revalidatePath('/')
  return { resources: data, error: null }
}
```

- [ ] **Step 2: Create `components/hud/DmResourceEditor.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { RESOURCE_CONFIG, type PartyResources, type ResourceKey } from '@/lib/types'
import { updateResources } from '@/actions/resources'

interface Props {
  resources: PartyResources
  mapId: string
}

export default function DmResourceEditor({ resources, mapId }: Props) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<ResourceKey, number>>({
    gold:  resources.gold,
    wood:  resources.wood,
    stone: resources.stone,
    food:  resources.food,
    iron:  resources.iron,
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await updateResources(mapId, values)
    setSaving(false)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] text-text-muted border-none bg-transparent cursor-pointer hover:text-text-primary"
        title="Edit resources (DM)"
      >
        ✎
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-72 rounded-[12px] border border-border-subtle p-6"
            style={{ background: 'oklch(0.22 0.015 260)' }}>
            <div className="text-[15px] font-bold text-text-primary mb-4">Edit Resources</div>
            <div className="flex flex-col gap-3 mb-5">
              {RESOURCE_CONFIG.map(r => (
                <div key={r.key} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex-none flex items-center justify-center text-[10px] font-bold font-mono"
                    style={{ background: r.color, color: 'oklch(0.14 0.02 260)' }}
                  >
                    {r.code}
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={values[r.key]}
                    onChange={e => setValues(prev => ({ ...prev, [r.key]: Number(e.target.value) }))}
                    className="flex-1 bg-[oklch(0.16_0.012_260)] border border-border-subtle rounded-lg px-2.5 py-1.5 text-text-primary text-sm outline-none focus:border-accent-gold"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 py-2 rounded-lg border border-border-subtle text-[13px] text-text-muted bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 py-2 rounded-lg text-[13px] font-bold cursor-pointer disabled:opacity-50 border-none"
                style={{ background: 'oklch(0.78 0.15 85)', color: 'oklch(0.16 0.02 85)' }}
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 3: Update `Hud.tsx` to accept resources + mapId, show editor for DM**

In `Hud.tsx`, change the props and import:

```typescript
interface Props {
  resources: PartyResources
  mapId: string
  isDm: boolean
}

export default function Hud({ resources, mapId, isDm }: Props) {
```

Add the editor next to the resource pills area:

```typescript
{isDm && <DmResourceEditor resources={resources} mapId={mapId} />}
```

(Import `DmResourceEditor` at top of file.)

- [ ] **Step 4: Update `app/(game)/page.tsx` to pass `isDm` and `mapId` to `Hud`**

In `page.tsx`, fetch profile to determine role:

```typescript
const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
const isDm = profile?.role === 'dm'
```

Pass to Hud:
```tsx
<Hud
  resources={resources ?? { ... }}
  mapId={mapId ?? ''}
  isDm={isDm}
/>
```

- [ ] **Step 5: Test end-to-end as DM**

```bash
npm run dev
```
Log in as DM → click ✎ next to resources → modal opens → change values → Save → HUD updates on next page load.

- [ ] **Step 6: Commit**

```bash
git add actions/resources.ts components/hud/DmResourceEditor.tsx components/hud/ app/(game)/page.tsx
git commit -m "feat: DM resource editor"
```

---

## Task 17: DM Map Creator

**Files:**
- Create: `components/maps/CreateMapModal.tsx`
- Modify: `components/maps/MapSwitcher.tsx`

- [ ] **Step 1: Create `components/maps/CreateMapModal.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { createMap } from '@/actions/map'
import { useGame } from '@/components/providers/GameProvider'
import type { GameMap } from '@/lib/types'

interface Props {
  onCreated: (map: GameMap) => void
  onClose: () => void
}

export default function CreateMapModal({ onCreated, onClose }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'world' | 'city' | 'base' | 'custom'>('custom')
  const [cols, setCols] = useState(20)
  const [rows, setRows] = useState(16)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Enter a map name'); return }
    setSaving(true)
    const result = await createMap({ name, type, gridCols: cols, gridRows: rows })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    if (result.map) onCreated(result.map)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <form
        onSubmit={submit}
        className="w-80 rounded-[12px] border border-border-subtle p-6"
        style={{ background: 'oklch(0.22 0.015 260)' }}
      >
        <div className="text-[15px] font-bold text-text-primary mb-4">Create Map</div>
        <div className="flex flex-col gap-3 mb-5">
          <div>
            <label className="text-[11px] text-text-muted block mb-1">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[oklch(0.16_0.012_260)] border border-border-subtle rounded-lg px-2.5 py-1.5 text-text-primary text-sm outline-none focus:border-accent-gold"
            />
          </div>
          <div>
            <label className="text-[11px] text-text-muted block mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as typeof type)}
              className="w-full bg-[oklch(0.16_0.012_260)] border border-border-subtle rounded-lg px-2.5 py-1.5 text-text-primary text-sm"
            >
              <option value="world">World</option>
              <option value="city">City</option>
              <option value="base">Base</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[11px] text-text-muted block mb-1">Columns</label>
              <input type="number" min="5" max="100" value={cols}
                onChange={e => setCols(Number(e.target.value))}
                className="w-full bg-[oklch(0.16_0.012_260)] border border-border-subtle rounded-lg px-2.5 py-1.5 text-text-primary text-sm" />
            </div>
            <div className="flex-1">
              <label className="text-[11px] text-text-muted block mb-1">Rows</label>
              <input type="number" min="5" max="100" value={rows}
                onChange={e => setRows(Number(e.target.value))}
                className="w-full bg-[oklch(0.16_0.012_260)] border border-border-subtle rounded-lg px-2.5 py-1.5 text-text-primary text-sm" />
            </div>
          </div>
        </div>
        {error && <div className="text-[oklch(0.7_0.15_25)] text-[11.5px] mb-3">{error}</div>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-border-subtle text-[13px] text-text-muted bg-transparent cursor-pointer">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2 rounded-lg text-[13px] font-bold cursor-pointer disabled:opacity-50 border-none"
            style={{ background: 'oklch(0.78 0.15 85)', color: 'oklch(0.16 0.02 85)' }}>
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Update `MapSwitcher.tsx` to include create button for DM**

```typescript
'use client'
import { useState } from 'react'
import { useGame } from '@/components/providers/GameProvider'
import CreateMapModal from './CreateMapModal'
import type { GameMap } from '@/lib/types'

export default function MapSwitcher() {
  const { maps: initialMaps, activeMap, setActiveMap, role } = useGame()
  const [maps, setMaps] = useState<GameMap[]>(initialMaps)
  const [showCreate, setShowCreate] = useState(false)
  const isDm = role === 'dm'

  if (!isDm && maps.length <= 1) return null

  function handleCreated(map: GameMap) {
    setMaps(prev => [...prev, map])
    setActiveMap(map)
    setShowCreate(false)
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <select
          value={activeMap.id}
          onChange={e => {
            const m = maps.find((m: GameMap) => m.id === e.target.value)
            if (m) setActiveMap(m)
          }}
          className="h-8 px-2 rounded-lg border border-border-subtle bg-panel-raised text-text-primary text-[12px] cursor-pointer"
        >
          {maps.map((m: GameMap) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        {isDm && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-8 h-8 rounded-lg border border-border-subtle bg-panel-raised text-text-muted text-lg cursor-pointer flex items-center justify-center hover:bg-panel-hover"
          >
            +
          </button>
        )}
      </div>
      {showCreate && (
        <CreateMapModal
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/maps/ actions/map.ts
git commit -m "feat: DM map creator"
```

---

## Task 18: Vercel Deployment

**Files:**
- Verify: `.env.local` is in `.gitignore`
- Reference: Vercel dashboard

- [ ] **Step 1: Confirm env vars in Vercel**

In Vercel dashboard → Project → Settings → Environment Variables, verify these exist for Production, Preview, and Development:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- [ ] **Step 2: Verify `.gitignore` excludes secrets**

```bash
cat .gitignore | grep env
```
Expected: `.env.local` is listed.

- [ ] **Step 3: Run build to catch type errors**

```bash
npm run build
```
Expected: Build completes with no errors. Fix any TypeScript errors before continuing.

- [ ] **Step 4: Push to main to trigger Vercel deploy**

```bash
git push origin main
```

- [ ] **Step 5: Verify deployed app**

Visit the Vercel deployment URL → login page should load → log in → game view renders with hex grid.

- [ ] **Step 6: Set DM role in production**

In Supabase dashboard (production project) → SQL Editor:
```sql
update public.profiles set role = 'dm' where id = '<dm-user-uuid>';
```

---

## Self-Review

**Spec coverage check:**
- ✅ Infinite pan/zoomable hex grid
- ✅ Custom maps (DM creates named maps with configurable grid size)
- ✅ Catalogue (tiles, recipes, resources tab, buildings) with tabs
- ✅ Draggable hex tiles from catalogue
- ✅ HUD with party resources
- ✅ Supabase backend on Vercel
- ✅ Individual player logins
- ✅ DM login with elevated powers
- ✅ Fog of war (per-tile, party-wide, RLS-enforced)
- ✅ DM edit mode (place tiles, reveal, manage catalogue, edit resources)
- ✅ Hidden catalogue entries (players see unlocked only, enforced by RLS)
- ✅ Design system (OKLCH tokens, dark-mode-only, design matches `deisgn/` reference)

**Gaps / Follow-up:**
- Resources tab in Catalogue is a placeholder — expand later if needed
- No signup flow — use Supabase dashboard to invite players (Authentication → Invite user)
- No tile deletion — can extend `actions/map.ts` with `deleteTile` when needed
- `GameView` and `HexGrid` re-fetch tiles on placement via optimistic local state; full refresh on navigate
