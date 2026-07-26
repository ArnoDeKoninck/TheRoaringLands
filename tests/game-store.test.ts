import { createStore } from 'zustand/vanilla'
import { createGameSlice, type GameState } from '@/lib/store/game-store'
import type { MapLayer, LayerRegion, HexLayerData } from '@/lib/types'

function makeStore(overrides: Partial<GameState> = {}) {
  return createStore<GameState>((set, get) => ({
    ...createGameSlice(set as (fn: (s: GameState) => Partial<GameState>) => void, get),
    ...overrides,
  }))
}

describe('selection', () => {
  test('selectHex sets selectedKeys to single key', () => {
    const store = makeStore()
    store.getState().selectHex('3,4', false)
    expect(store.getState().selectedKeys).toEqual(new Set(['3,4']))
  })

  test('selectHex with ctrl adds to selection', () => {
    const store = makeStore()
    store.getState().selectHex('3,4', false)
    store.getState().selectHex('5,6', true)
    expect(store.getState().selectedKeys).toEqual(new Set(['3,4', '5,6']))
  })

  test('selectHex ctrl on already-selected key removes it', () => {
    const store = makeStore()
    store.getState().selectHex('3,4', false)
    store.getState().selectHex('3,4', true)
    expect(store.getState().selectedKeys).toEqual(new Set())
  })

  test('clearSelection empties selectedKeys', () => {
    const store = makeStore()
    store.getState().selectHex('3,4', false)
    store.getState().clearSelection()
    expect(store.getState().selectedKeys).toEqual(new Set())
  })

  test('paintSelect adds key to selection', () => {
    const store = makeStore()
    store.getState().paintSelect('1,1')
    store.getState().paintSelect('2,2')
    expect(store.getState().selectedKeys).toEqual(new Set(['1,1', '2,2']))
  })

  test('setInspectedKey updates inspectedKey', () => {
    const store = makeStore()
    store.getState().setInspectedKey('5,5')
    expect(store.getState().inspectedKey).toBe('5,5')
  })

  test('setInspectedKey null clears', () => {
    const store = makeStore()
    store.getState().setInspectedKey('5,5')
    store.getState().setInspectedKey(null)
    expect(store.getState().inspectedKey).toBeNull()
  })

  test('paintSelect is idempotent on duplicate key', () => {
    const store = makeStore()
    store.getState().paintSelect('1,1')
    store.getState().paintSelect('1,1')
    expect(store.getState().selectedKeys).toEqual(new Set(['1,1']))
  })

  test('setTiles with functional updater appends tile', () => {
    const store = makeStore()
    const tile = { id: 't1', col: 0, row: 0, map_id: 'm1', tile_type_id: 'tt1', revealed: false } as any
    store.getState().setTiles([tile])
    store.getState().setTiles(prev => [...prev, { ...tile, id: 't2', col: 1 }])
    expect(store.getState().tiles).toHaveLength(2)
  })
})

describe('layer state', () => {
  test('initial layer state is empty', () => {
    const store = makeStore()
    const s = store.getState()
    expect(s.mapLayers).toEqual([])
    expect(s.layerRegions).toEqual([])
    expect(s.hexLayerData.size).toBe(0)
    expect(s.activeLayerIds.size).toBe(0)
    expect(s.layerPanelOpen).toBe(false)
    expect(s.selectedLayerId).toBeNull()
    expect(s.selectedRegionId).toBeNull()
  })

  test('toggleLayerId adds and removes layer from activeLayerIds', () => {
    const store = makeStore()
    store.getState().toggleLayerId('l1')
    expect(store.getState().activeLayerIds).toEqual(new Set(['l1']))
    store.getState().toggleLayerId('l1')
    expect(store.getState().activeLayerIds).toEqual(new Set())
  })

  test('setSelectedLayerId sets selectedLayerId', () => {
    const store = makeStore()
    store.getState().setSelectedLayerId('l1')
    expect(store.getState().selectedLayerId).toBe('l1')
  })

  test('setSelectedRegionId sets selectedRegionId', () => {
    const store = makeStore()
    store.getState().setSelectedRegionId('r1')
    expect(store.getState().selectedRegionId).toBe('r1')
  })

  test('upsertHexLayerAssignment stores assignment', () => {
    const store = makeStore()
    const entry: HexLayerData = { map_id: 'm1', layer_id: 'l1', col: 3, row: 4, region_id: 'r1' }
    store.getState().upsertHexLayerAssignment(entry)
    expect(store.getState().hexLayerData.get('l1')?.get('3,4')).toBe('r1')
  })

  test('removeHexLayerAssignment clears assignment', () => {
    const store = makeStore()
    const entry: HexLayerData = { map_id: 'm1', layer_id: 'l1', col: 3, row: 4, region_id: 'r1' }
    store.getState().upsertHexLayerAssignment(entry)
    store.getState().removeHexLayerAssignment({ layer_id: 'l1', col: 3, row: 4 })
    expect(store.getState().hexLayerData.get('l1')?.get('3,4')).toBeUndefined()
  })

  test('addLayer adds a layer and activates it', () => {
    const store = makeStore()
    const layer: MapLayer = { id: 'l1', map_id: 'm1', name: 'Countries', order_index: 0, created_at: '' }
    store.getState().addLayer(layer)
    expect(store.getState().mapLayers).toContain(layer)
    expect(store.getState().activeLayerIds).toContain('l1')
  })

  test('removeLayer removes layer, regions, data', () => {
    const store = makeStore()
    const layer: MapLayer = { id: 'l1', map_id: 'm1', name: 'Countries', order_index: 0, created_at: '' }
    const region: LayerRegion = { id: 'r1', layer_id: 'l1', name: 'N', color: '#f00', opacity: 0.4, order_index: 0 }
    store.getState().addLayer(layer)
    store.getState().addRegion(region)
    const entry: HexLayerData = { map_id: 'm1', layer_id: 'l1', col: 0, row: 0, region_id: 'r1' }
    store.getState().upsertHexLayerAssignment(entry)
    store.getState().removeLayer('l1')
    expect(store.getState().mapLayers).toHaveLength(0)
    expect(store.getState().layerRegions.filter(r => r.layer_id === 'l1')).toHaveLength(0)
    expect(store.getState().hexLayerData.has('l1')).toBe(false)
    expect(store.getState().activeLayerIds.has('l1')).toBe(false)
  })

  test('addRegion appends region', () => {
    const store = makeStore()
    const region: LayerRegion = { id: 'r1', layer_id: 'l1', name: 'N', color: '#f00', opacity: 0.4, order_index: 0 }
    store.getState().addRegion(region)
    expect(store.getState().layerRegions).toContain(region)
  })

  test('removeRegion removes region', () => {
    const store = makeStore()
    const region: LayerRegion = { id: 'r1', layer_id: 'l1', name: 'N', color: '#f00', opacity: 0.4, order_index: 0 }
    store.getState().addRegion(region)
    store.getState().removeRegion('r1')
    expect(store.getState().layerRegions).toHaveLength(0)
  })
})
