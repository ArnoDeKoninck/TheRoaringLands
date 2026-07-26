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
  color: string
  description: string | null
  produces: string | null
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

export const RESOURCE_CONFIG = [
  { key: 'gold',  code: 'GD', color: 'oklch(0.78 0.15 85)' },
  { key: 'wood',  code: 'WD', color: 'oklch(0.5 0.09 145)' },
  { key: 'stone', code: 'ST', color: 'oklch(0.55 0.02 260)' },
  { key: 'food',  code: 'FD', color: 'oklch(0.68 0.11 95)' },
  { key: 'iron',  code: 'IR', color: 'oklch(0.55 0.03 30)' },
] as const

export type ResourceKey = typeof RESOURCE_CONFIG[number]['key']
