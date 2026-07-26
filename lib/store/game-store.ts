import { create } from 'zustand'
import type { GameMap, MapTile, TileType, CatalogueEntry } from '@/lib/types'

export interface ContextMenuState {
  col: number
  row: number
  clientX: number
  clientY: number
}

export interface GameState {
  // Server-hydrated (read-only after init)
  role: 'dm' | 'player'
  maps: GameMap[]
  tileTypes: TileType[]
  catalogueEntries: CatalogueEntry[]
  resources: Record<string, number>

  // Active map
  activeMap: GameMap | null
  tiles: MapTile[]

  // Viewport
  pan: { x: number; y: number }
  zoom: number

  // Selection
  selectedKeys: Set<string>
  inspectedKey: string | null

  // UI
  selectedTileTypeId: string | null
  catalogueOpen: boolean
  contextMenu: ContextMenuState | null

  // Actions
  hydrate: (data: {
    role: 'dm' | 'player'
    maps: GameMap[]
    tileTypes: TileType[]
    catalogueEntries: CatalogueEntry[]
    resources: Record<string, number>
    activeMap: GameMap
    tiles: MapTile[]
  }) => void
  setActiveMap: (map: GameMap) => void
  setTiles: (updater: MapTile[] | ((prev: MapTile[]) => MapTile[])) => void
  setPan: (pan: { x: number; y: number }) => void
  setZoom: (zoom: number) => void
  selectHex: (key: string, ctrl: boolean) => void
  paintSelect: (key: string) => void
  clearSelection: () => void
  setInspectedKey: (key: string | null) => void
  setSelectedTileTypeId: (id: string | null) => void
  setCatalogueOpen: (open: boolean) => void
  setContextMenu: (menu: ContextMenuState | null) => void
}

export function createGameSlice(
  set: (fn: (s: GameState) => Partial<GameState>) => void,
  get: () => GameState,
): GameState {
  return {
    role: 'player',
    maps: [],
    tileTypes: [],
    catalogueEntries: [],
    resources: {},
    activeMap: null,
    tiles: [],
    pan: { x: 0, y: 0 },
    zoom: 1,
    selectedKeys: new Set(),
    inspectedKey: null,
    selectedTileTypeId: null,
    catalogueOpen: true,
    contextMenu: null,

    hydrate: (data) => set(() => ({ ...data, selectedKeys: new Set(), inspectedKey: null, contextMenu: null })),
    setActiveMap: (map) => set(() => ({ activeMap: map, tiles: [], selectedKeys: new Set(), inspectedKey: null })),
    setTiles: (updater) => set((s) => ({ tiles: typeof updater === 'function' ? updater(s.tiles) : updater })),
    setPan: (pan) => set(() => ({ pan })),
    setZoom: (zoom) => set(() => ({ zoom })),
    selectHex: (key, ctrl) => set((s) => {
      if (ctrl) {
        const next = new Set(s.selectedKeys)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return { selectedKeys: next }
      }
      return { selectedKeys: new Set([key]) }
    }),
    paintSelect: (key) => {
      if (get().selectedKeys.has(key)) return
      set((s) => ({ selectedKeys: new Set([...s.selectedKeys, key]) }))
    },
    clearSelection: () => set(() => ({ selectedKeys: new Set() })),
    setInspectedKey: (key) => set(() => ({ inspectedKey: key })),
    setSelectedTileTypeId: (id) => set(() => ({ selectedTileTypeId: id })),
    setCatalogueOpen: (open) => set(() => ({ catalogueOpen: open })),
    setContextMenu: (menu) => set(() => ({ contextMenu: menu })),
  }
}

export const useGameStore = create<GameState>((set, get) => createGameSlice(set, get))
