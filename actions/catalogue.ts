'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TileType, CatalogueEntry } from '@/lib/types'

export async function setEntryUnlocked(
  id: string,
  unlocked: boolean
): Promise<{ entry: CatalogueEntry | null; error: string | null }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('catalogue_entries')
    .update({ unlocked })
    .eq('id', id)
    .select()
    .single<CatalogueEntry>()
  if (error) return { entry: null, error: error.message }
  revalidatePath('/')
  return { entry: data, error: null }
}

export async function createTileType(data: {
  name: string
  code: string
  color: string
  description: string
  produces: string | null
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
