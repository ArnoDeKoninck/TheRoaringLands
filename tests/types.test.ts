import { RESOURCE_CONFIG } from '@/lib/types'
import type { MapLayer, LayerRegion, HexLayerData } from '@/lib/types'
import { test, expect } from 'vitest'

test('RESOURCE_CONFIG has 5 resources', () => {
  expect(RESOURCE_CONFIG).toHaveLength(5)
})

test('all resources have 2-char code and oklch color', () => {
  for (const r of RESOURCE_CONFIG) {
    expect(r.key).toBeTruthy()
    expect(r.code).toHaveLength(2)
    expect(r.color).toMatch(/^oklch/)
  }
})

test('MapLayer type has required fields', () => {
  const layer: MapLayer = { id: 'l1', map_id: 'm1', name: 'Countries', order_index: 0, created_at: '' }
  expect(layer.id).toBe('l1')
})

test('LayerRegion type has required fields', () => {
  const r: LayerRegion = { id: 'r1', layer_id: 'l1', name: 'Northern Kingdom', color: '#4488cc', opacity: 0.4, order_index: 0 }
  expect(r.color).toBe('#4488cc')
})

test('HexLayerData type has required fields', () => {
  const h: HexLayerData = { map_id: 'm1', layer_id: 'l1', col: 3, row: 4, region_id: 'r1' }
  expect(h.col).toBe(3)
})
