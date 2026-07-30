import { create } from 'zustand'
import type { GameMap, MapTile, TileType, CatalogueEntry, MapLayer, LayerRegion, HexLayerData } from '@/lib/types'
import { colRowToKey } from '@/lib/hex-math'

export interface PaintPreview {
  color: string
  hexes: Array<{ key: string; x: number; y: number }>
}

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

  // Layers
  mapLayers: MapLayer[]
  layerRegions: LayerRegion[]
  // layerId → (colRowKey → regionId)
  hexLayerData: Map<string, Map<string, string | null>>
  activeLayerIds: Set<string>
  layerPanelOpen: boolean
  selectedLayerId: string | null
  selectedRegionId: string | null
  paintPreview: PaintPreview | null
  hasPendingChanges: boolean

  // Actions
  hydrate: (data: {
    role: 'dm' | 'player'
    maps: GameMap[]
    tileTypes: TileType[]
    catalogueEntries: CatalogueEntry[]
    resources: Record<string, number>
    activeMap: GameMap
    tiles: MapTile[]
    mapLayers: MapLayer[]
    layerRegions: LayerRegion[]
    hexLayerData: HexLayerData[]
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
  removeMap: (mapId: string) => void
  // Layer actions
  toggleLayerId: (layerId: string) => void
  setSelectedLayerId: (id: string | null) => void
  setSelectedRegionId: (id: string | null) => void
  setLayerPanelOpen: (open: boolean) => void
  upsertHexLayerAssignment: (entry: HexLayerData) => void
  upsertBatchHexLayerAssignments: (entries: HexLayerData[]) => void
  removeHexLayerAssignment: (key: { layer_id: string; col: number; row: number }) => void
  setPaintPreview: (preview: PaintPreview | null) => void
  markDirty: () => void
  markClean: () => void
  addLayer: (layer: MapLayer) => void
  removeLayer: (layerId: string) => void
  addRegion: (region: LayerRegion) => void
  removeRegion: (regionId: string) => void
}

function buildHexLayerDataMap(rows: HexLayerData[]): Map<string, Map<string, string | null>> {
  const out = new Map<string, Map<string, string | null>>()
  for (const row of rows) {
    if (!out.has(row.layer_id)) out.set(row.layer_id, new Map())
    out.get(row.layer_id)!.set(colRowToKey(row.col, row.row), row.region_id)
  }
  return out
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
    mapLayers: [],
    layerRegions: [],
    hexLayerData: new Map(),
    activeLayerIds: new Set(),
    layerPanelOpen: false,
    selectedLayerId: null,
    selectedRegionId: null,
    paintPreview: null,
    hasPendingChanges: false,

    hydrate: (data) => set(() => ({
      ...data,
      selectedKeys: new Set(),
      inspectedKey: null,
      contextMenu: null,
      hexLayerData: buildHexLayerDataMap(data.hexLayerData),
      activeLayerIds: new Set(data.mapLayers.map(l => l.id)),
    })),
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
    removeMap: (mapId) => set((s) => ({ maps: s.maps.filter(m => m.id !== mapId) })),

    toggleLayerId: (layerId) => set((s) => {
      const next = new Set(s.activeLayerIds)
      next.has(layerId) ? next.delete(layerId) : next.add(layerId)
      return { activeLayerIds: next }
    }),
    setSelectedLayerId: (id) => set(() => ({ selectedLayerId: id })),
    setSelectedRegionId: (id) => set(() => ({ selectedRegionId: id })),
    setLayerPanelOpen: (open) => set(() => ({ layerPanelOpen: open })),

    upsertHexLayerAssignment: (entry) => set((s) => {
      const next = new Map(s.hexLayerData)
      if (!next.has(entry.layer_id)) next.set(entry.layer_id, new Map())
      const inner = new Map(next.get(entry.layer_id)!)
      inner.set(colRowToKey(entry.col, entry.row), entry.region_id)
      next.set(entry.layer_id, inner)
      return { hexLayerData: next }
    }),

    upsertBatchHexLayerAssignments: (entries) => set((s) => {
      if (entries.length === 0) return {}
      const next = new Map(s.hexLayerData)
      const byLayer = new Map<string, HexLayerData[]>()
      for (const e of entries) {
        if (!byLayer.has(e.layer_id)) byLayer.set(e.layer_id, [])
        byLayer.get(e.layer_id)!.push(e)
      }
      for (const [layerId, layerEntries] of byLayer) {
        const inner = new Map(next.get(layerId) ?? new Map<string, string | null>())
        for (const e of layerEntries) inner.set(colRowToKey(e.col, e.row), e.region_id)
        next.set(layerId, inner)
      }
      return { hexLayerData: next }
    }),

    setPaintPreview: (preview) => set(() => ({ paintPreview: preview })),
    markDirty: () => set(() => ({ hasPendingChanges: true })),
    markClean: () => set(() => ({ hasPendingChanges: false })),

    removeHexLayerAssignment: ({ layer_id, col, row }) => set((s) => {
      const next = new Map(s.hexLayerData)
      if (!next.has(layer_id)) return {}
      const inner = new Map(next.get(layer_id)!)
      inner.delete(colRowToKey(col, row))
      next.set(layer_id, inner)
      return { hexLayerData: next }
    }),

    addLayer: (layer) => set((s) => ({
      mapLayers: [...s.mapLayers, layer],
      activeLayerIds: new Set([...s.activeLayerIds, layer.id]),
    })),

    removeLayer: (layerId) => set((s) => {
      const next = new Map(s.hexLayerData)
      next.delete(layerId)
      const nextActive = new Set(s.activeLayerIds)
      nextActive.delete(layerId)
      return {
        mapLayers: s.mapLayers.filter(l => l.id !== layerId),
        layerRegions: s.layerRegions.filter(r => r.layer_id !== layerId),
        hexLayerData: next,
        activeLayerIds: nextActive,
        selectedLayerId: s.selectedLayerId === layerId ? null : s.selectedLayerId,
      }
    }),

    addRegion: (region) => set((s) => ({ layerRegions: [...s.layerRegions, region] })),

    removeRegion: (regionId) => set((s) => ({ layerRegions: s.layerRegions.filter(r => r.id !== regionId) })),
  }
}

export const useGameStore = create<GameState>((set, get) => createGameSlice(set, get))
