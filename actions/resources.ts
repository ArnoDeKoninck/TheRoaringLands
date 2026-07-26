'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PartyResources } from '@/lib/types'
import { requireDm } from '@/lib/supabase/require-dm'

export async function updateResources(
  mapId: string,
  values: Partial<Pick<PartyResources, 'gold' | 'wood' | 'stone' | 'food' | 'iron'>>
): Promise<{ resources: PartyResources | null; error: string | null }> {
  const supabase = await createClient()
  const { error: authError } = await requireDm(supabase)
  if (authError) return { resources: null, error: authError }
  const { data, error } = await supabase
    .from('party_resources')
    .update(values)
    .eq('map_id', mapId)
    .select()
    .single<PartyResources>()
  if (error) return { resources: null, error: error.message }
  revalidatePath('/')
  return { resources: data, error: null }
}
