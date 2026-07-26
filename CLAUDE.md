# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Hexforge** — dark-mode-only browser-based civilization builder. Users log in, place hex tiles on an infinite pan/zoomable grid, track resources via a HUD, and browse a Catalogue of tiles, recipes, resources, and buildings.

Currently in **design phase**. No production source code or build tooling exists yet. Choose a framework and set up tooling before implementing.

## Design Reference

`deisgn/Hexforge.dc.html` — full working prototype (login + game screen, all logic inline, ~340 lines). `deisgn/README.md` — high-fidelity spec. The prototype uses a custom JSX-like syntax; **do not copy it verbatim** — recreate using the target framework's actual patterns.

The design is **high-fidelity**: colors, spacing, typography, and interactions are final-intent.

## Architecture

### Screens
1. **Login** — centered card, stub auth (valid username → game screen), inline validation
2. **Game** — three regions: fixed top HUD (56px), pan/zoomable hex map (fills left), collapsible Catalogue panel (320px right)

### Hex Grid
- Pointy-top, 30×24, hex radius 48px (w≈83.14px, h=96px, row step 72px, odd cols offset by half-width)
- Inline SVG polygons: `41.57,0 83.14,24 83.14,72 41.57,96 0,72 0,24`
- Pan via pointer drag, zoom via wheel or buttons, clamped 0.4×–2.5×
- Neighbor math uses even-r offset coordinates (`neighborsOf(col, row)`)
- Placement mode: drag card from Catalogue onto hex, or click card then click hex

### State
```
view: 'login' | 'game'
username, password, loginError
activeTab: 'tiles' | 'recipes' | 'resources' | 'buildings'
catalogueOpen: boolean
selectedTileId: string | null          // tile type armed for placement
placed: Map<"col,row", tileTypeId>     // board state
selectedKey: "col,row" | null          // inspected placed tile
pan: {x, y}, zoom: number
resources: {gold, wood, stone, food, iron}
```

### Data
- 7 tile types: Plains, Forest, Mountain, Water, Desert, Farmland, Ore Deposit
- 5 crafting recipes, 5 resources (GD/WD/ST/FD/IR), 4 buildings (Core/Economy/Military/Unit tags)

## Design Tokens

**OKLCH colors** (dark-mode only):
| Token | Value |
|---|---|
| Background deepest | `oklch(0.14 0.012 260)` |
| Panel | `oklch(0.19 0.014 260)` |
| Raised panel | `oklch(0.22–0.24 0.015–0.017 260)` |
| Border subtle | `oklch(1 0 0 / 0.08–0.14)` |
| Text primary | `oklch(0.93 0.006 260)` |
| Text muted | `oklch(0.55–0.65 0.02 260)` |
| Accent gold (CTA/resources) | `oklch(0.78 0.15 85)` |
| Accent teal (selection/info) | `oklch(0.78 0.15 200)` |

**Tile colors**: Plains `oklch(0.62 0.09 120)`, Forest `oklch(0.5 0.09 145)`, Mountain `oklch(0.55 0.02 260)`, Water `oklch(0.6 0.1 230)`, Desert `oklch(0.72 0.09 80)`, Farmland `oklch(0.68 0.11 95)`, Ore `oklch(0.55 0.03 30)`

**Typography**: system UI stack; `ui-monospace` for resource counts and tile 2-letter codes.

**Radii**: 5–8px controls/icons, 10–14px cards/panels. No animations except 0.2–0.4s fade-in on login card and inspector card.

**Assets**: no external images — all icons are inline SVG hex polygons or flat color swatches with 2-letter codes.
