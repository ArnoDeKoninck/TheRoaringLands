# Handoff: Hexforge — Hex Map Civilization Builder

## Overview
A dark-mode-only web app for a civilization-builder game: users log in, then place hex tiles on an infinitely pan/zoomable pointy-top hex grid, tracking resources via a HUD, and browsing a tabbed Catalogue (Hex Tiles, Crafting Recipes, Resources, Buildings/Units).

## About the Design Files
The bundled file (`Hexforge.dc.html`) is a **design reference built in HTML/React-like JSX** — a working prototype of look, layout, and interaction, not production code to copy verbatim. Recreate this design in your target codebase's actual framework (React, Vue, Swift, etc.) using its existing patterns, component library, and state layer. If no frontend framework exists yet, choose the one best suited to the project.

## Fidelity
**High-fidelity.** Colors, typography, spacing, and interactions are final-intent; recreate pixel-close using your own component/styling system.

## Screens / Views

### 1. Login
- Full-viewport, centered card (380px wide), radial dark background with a faint diagonal hex-line texture overlay.
- Card: `oklch(0.19 0.014 260)` background, 1px `oklch(1 0 0 / 0.08)` border, 14px radius, heavy drop shadow.
- Logo: small hex polygon icon (gold `oklch(0.78 0.15 85)`) + "HEXFORGE" wordmark, 19px/700.
- Subtitle: "Sign in to continue your civilization", 13px, muted.
- Fields: Username (text), Password (password) — dark inputs (`oklch(0.16 0.012 260)` bg, 1px border, 8px radius, gold border on focus).
- Inline validation: empty username on submit shows red error text ("Enter a username to continue").
- Row: "Remember me" checkbox + "Forgot password?" link.
- Primary button: full-width, gold fill, dark gold text, 700 weight, "ENTER THE REALM", 8px radius.
- Submit with valid username transitions to the Game screen (this is a design-only stub — no real auth).

### 2. Game — Top HUD (56px bar, fixed)
- Left: logo mark + wordmark, divider.
- Resource pills: 20×20 colored square with 2-letter code (GD/WD/ST/FD/IR) + monospace amount, one per resource (Gold, Wood, Stone, Food, Iron).
- Right side: zoom % readout, − / + zoom buttons (28×28, rounded 7px), divider, "Catalogue" toggle button (highlighted gold-tinted when panel open), circular avatar placeholder.

### 3. Game — Hex Map (fills remaining height, left of Catalogue panel)
- Pointy-top hex grid, 30 cols × 24 rows, hex radius 48px (width ≈83.14px, height 96px, row vertical step 72px, odd rows offset by half-width).
- Each hex rendered as an inline SVG polygon: points `41.57,0 83.14,24 83.14,72 41.57,96 0,72 0,24`, stroke `oklch(1 0 0 / 0.14)` normally, empty tiles transparent fill.
- Grid sits in a layer transformed by `translate(pan.x, pan.y) scale(zoom)`; pan via pointerdown/move/up drag (grab/grabbing cursor), zoom via mouse wheel and +/− buttons, clamped 0.4×–2.5×.
- Background: near-black `oklch(0.115 0.01 260)` with a subtle 26px dot grid for depth beyond the hex bounds.
- Placed tile: hex fill = tile type color, 2-letter code centered in dark monospace text.
- Selected tile: stroke becomes teal `oklch(0.78 0.15 200)`, 3px width.
- Placement mode (tile selected from Catalogue): empty hexes tint faint gold; a floating pill top-left reads "Placing: {Tile Name}" with a cancel (✕) button.
- Tile inspector (bottom-left floating card, 250px wide, appears when a placed tile is clicked): swatch + tile name, "Produces" resource line, "Connections (n)" listing adjacent placed tile names (hex neighbor math included in code) or "No adjacent tiles yet".

### 4. Game — Catalogue Panel (320px wide, right side, collapsible)
- 4 tabs, equal width, 11.5px/600 uppercase labels, active tab gets a 2px gold bottom border and bright text; inactive tabs muted.
- Tabs: **Hex Tiles**, **Recipes**, **Resources**, **Buildings**.
- Each tab lists cards (10px gap, scrollable): 34×34 colored icon (2-letter code) + name (13px/700) + description (11.5px muted) + optional small teal tag pill (used for Buildings: Core/Economy/Military/Unit).
- Hex Tiles cards are **draggable** (HTML5 DnD) and **clickable** to enter placement mode (selected card gets gold-tinted background/border); dropping or click-placing onto a map hex sets that tile. Recipes/Resources/Buildings cards are informational only (not placeable in this pass).

## Interactions & Behavior
- **Pan**: pointerdown+drag on map background; movement <4px is treated as a click (doesn't cancel placement mode).
- **Zoom**: wheel (±0.1/tick) or HUD buttons (±0.15), clamped 0.4–2.5, displayed as rounded percentage.
- **Place tile**: drag a Hex Tiles card onto a hex (dragover must preventDefault to allow drop), or click a card then click a hex.
- **Cancel placement**: ✕ on the "Placing: …" pill, or select a different tile.
- **Select placed tile**: click it when not in placement mode → opens inspector card; ✕ closes it.
- **Toggle Catalogue**: HUD button shows/hides the right panel; map area reflows to fill freed space.
- No animations beyond a 0.2–0.4s fade-in on the login card and inspector card appearance.

## State Management
- `view`: 'login' | 'game'
- `username`, `password`, `loginError`
- `activeTab`: 'tiles' | 'recipes' | 'resources' | 'buildings'
- `catalogueOpen`: boolean
- `selectedTileId`: id of the Hex Tile type currently armed for placement, or null
- `placed`: map of `"col,row"` → tile type id (the placed-tile board state)
- `selectedKey`: `"col,row"` of the currently inspected placed tile, or null
- `pan`: {x, y}, `zoom`: number (map viewport transform)
- `resources`: {gold, wood, stone, food, iron} — currently static demo values; wire to real economy/game-tick logic
- Hex neighbor lookup uses standard offset-coordinate ("even-r") adjacency, included in source as `neighborsOf(col, row)`.

## Design Tokens
**Colors (OKLCH)**
- Background deepest: `oklch(0.14 0.012 260)`
- Panel: `oklch(0.19 0.014 260)` / raised panel: `oklch(0.22–0.24 0.015–0.017 260)`
- Border subtle: `oklch(1 0 0 / 0.08–0.14)`
- Text primary: `oklch(0.93 0.006 260)`, muted: `oklch(0.55–0.65 0.02 260)`
- Accent gold (primary/CTA/resources): `oklch(0.78 0.15 85)`
- Accent teal (selection/info): `oklch(0.78 0.15 200)`
- Tile type colors: Plains `oklch(0.62 0.09 120)`, Forest `oklch(0.5 0.09 145)`, Mountain `oklch(0.55 0.02 260)`, Water `oklch(0.6 0.1 230)`, Desert `oklch(0.72 0.09 80)`, Farmland `oklch(0.68 0.11 95)`, Ore `oklch(0.55 0.03 30)`

**Typography**: system UI stack (-apple-system, Segoe UI, Helvetica, Arial); monospace (ui-monospace) for resource counts and tile codes for a "HUD" feel.

**Radii**: 5–8px small controls/icons, 10–14px cards/panels/login card.

**Shadows**: large soft shadows on floating cards (`0 20-30px 40-60px rgba(0,0,0,0.35-0.6)`).

## Assets
No external image assets — all icons are inline SVG hex polygons or flat color swatches with 2-letter monospace codes as placeholders. Replace with real tile art/icons as available.

## Files
- `Hexforge.dc.html` — the full design reference (login + game screen, all logic inline).
