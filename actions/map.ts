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
    .upsert(
      { map_id: mapId, col, row, tile_type_id: tileTypeId, revealed: false },
      { onConflict: 'map_id,col,row' }
    )
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

  await supabase.from('party_resources').insert({ map_id: data.id })
  revalidatePath('/')
  return { map: data, error: null }
}
