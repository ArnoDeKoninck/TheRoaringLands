'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireDm } from '@/lib/supabase/require-dm'
import { neighborsOf, colRowToKey } from '@/lib/hex-math'
import type { MapLayer, LayerRegion, HexLayerData } from '@/lib/types'

export async function createLayer({
  mapId, name,
}: { mapId: string; name: string }): Promise<{ layer: MapLayer | null; error: string | null }> {
  const supabase = await createClient()
  const { error: authError } = await requireDm(supabase)
  if (authError) return { layer: null, error: authError }

  const { data: existing } = await supabase
    .from('map_layers').select('order_index').eq('map_id', mapId).order('order_index', { ascending: false }).limit(1)
  const nextIndex = (existing?.[0]?.order_index ?? -1) + 1

  const { data, error } = await supabase
    .from('map_layers')
    .insert({ map_id: mapId, name, order_index: nextIndex })
    .select().single<MapLayer>()
  if (error) return { layer: null, error: error.message }
  revalidatePath('/')
  return { layer: data, error: null }
}

export async function deleteLayer({
  layerId,
}: { layerId: string }): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error: authError } = await requireDm(supabase)
  if (authError) return { error: authError }
  const { error } = await supabase.from('map_layers').delete().eq('id', layerId)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { error: null }
}

export async function createRegion({
  layerId, name, color,
}: { layerId: string; name: string; color: string }): Promise<{ region: LayerRegion | null; error: string | null }> {
  const supabase = await createClient()
  const { error: authError } = await requireDm(supabase)
  if (authError) return { region: null, error: authError }

  const { data: existing } = await supabase
    .from('layer_regions').select('order_index').eq('layer_id', layerId).order('order_index', { ascending: false }).limit(1)
  const nextIndex = (existing?.[0]?.order_index ?? -1) + 1

  const { data, error } = await supabase
    .from('layer_regions')
    .insert({ layer_id: layerId, name, color, opacity: 0.4, order_index: nextIndex })
    .select().single<LayerRegion>()
  if (error) return { region: null, error: error.message }
  revalidatePath('/')
  return { region: data, error: null }
}

export async function deleteRegion({
  regionId,
}: { regionId: string }): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { error: authError } = await requireDm(supabase)
  if (authError) return { error: authError }
  const { error } = await supabase.from('layer_regions').delete().eq('id', regionId)
  if (error) return { error: error.message }
  revalidatePath('/')
  return { error: null }
}

export async function paintHex({
  mapId, layerId, col, row, regionId,
}: { mapId: string; layerId: string; col: number; row: number; regionId: string | null }): Promise<{ entry: HexLayerData | null; error: string | null }> {
  const supabase = await createClient()
  const { error: authError } = await requireDm(supabase)
  if (authError) return { entry: null, error: authError }

  if (regionId === null) {
    const { error } = await supabase
      .from('hex_layer_data')
      .delete()
      .eq('map_id', mapId).eq('layer_id', layerId).eq('col', col).eq('row', row)
    if (error) return { entry: null, error: error.message }
    return { entry: { map_id: mapId, layer_id: layerId, col, row, region_id: null }, error: null }
  }

  const { data, error } = await supabase
    .from('hex_layer_data')
    .upsert({ map_id: mapId, layer_id: layerId, col, row, region_id: regionId }, { onConflict: 'map_id,layer_id,col,row' })
    .select().single<HexLayerData>()
  if (error) return { entry: null, error: error.message }
  return { entry: data, error: null }
}

export async function floodFillLayer({
  mapId, layerId, startCol, startRow, regionId, gridCols, gridRows,
}: {
  mapId: string; layerId: string; startCol: number; startRow: number
  regionId: string | null; gridCols: number; gridRows: number
}): Promise<{ count: number; error: string | null }> {
  const supabase = await createClient()
  const { error: authError } = await requireDm(supabase)
  if (authError) return { count: 0, error: authError }

  // Load all current assignments for this layer
  const { data: existing } = await supabase
    .from('hex_layer_data')
    .select('col,row,region_id')
    .eq('map_id', mapId)
    .eq('layer_id', layerId)

  const assignMap = new Map<string, string | null>()
  for (const row of (existing ?? [])) {
    assignMap.set(colRowToKey(row.col, row.row), row.region_id)
  }

  // BFS from startCol,startRow — fill all connected hexes with same region as start
  const startKey = colRowToKey(startCol, startRow)
  const startRegion = assignMap.get(startKey) ?? null
  const visited = new Set<string>()
  const queue: [number, number][] = [[startCol, startRow]]
  visited.add(startKey)

  while (queue.length > 0) {
    const [col, row] = queue.shift()!
    for (const [nc, nr] of neighborsOf(col, row)) {
      if (nc < 0 || nr < 0 || nc >= gridCols || nr >= gridRows) continue
      const nk = colRowToKey(nc, nr)
      if (visited.has(nk)) continue
      const nRegion = assignMap.get(nk) ?? null
      if (nRegion !== startRegion) continue
      visited.add(nk)
      queue.push([nc, nr])
    }
  }

  const hexes = [...visited].map(key => {
    const [c, r] = key.split(',').map(Number)
    return { map_id: mapId, layer_id: layerId, col: c, row: r, region_id: regionId }
  })

  if (regionId === null) {
    // Delete all visited rows
    for (const h of hexes) {
      await supabase.from('hex_layer_data').delete()
        .eq('map_id', mapId).eq('layer_id', layerId).eq('col', h.col).eq('row', h.row)
    }
  } else {
    const { error } = await supabase.from('hex_layer_data').upsert(hexes, { onConflict: 'map_id,layer_id,col,row' })
    if (error) return { count: 0, error: error.message }
  }

  return { count: hexes.length, error: null }
}
