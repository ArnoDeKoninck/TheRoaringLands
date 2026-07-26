import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Hud from '@/components/hud/Hud'
import GameView from '@/components/GameView'
import type { PartyResources, MapTile, TileType, CatalogueEntry, Profile, Role } from '@/lib/types'

export default async function GamePage({ searchParams }: { searchParams: Promise<{ mapId?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: maps } = await supabase.from('maps').select('id').order('created_at')
  const mapId = params.mapId ?? maps?.[0]?.id ?? ''

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single<Pick<Profile, 'role'>>()
  const isDm = (profile?.role as Role) === 'dm'

  const [
    { data: mapTiles },
    { data: tileTypes },
    { data: catalogueEntries },
    { data: resources },
  ] = await Promise.all([
    supabase.from('map_tiles').select('*').eq('map_id', mapId),
    supabase.from('tile_types').select('*').order('order_index'),
    supabase.from('catalogue_entries').select('*').order('order_index'),
    supabase.from('party_resources').select('*').eq('map_id', mapId).maybeSingle<PartyResources>(),
  ])

  const emptyResources: PartyResources = { id: '', map_id: null, gold: 0, wood: 0, stone: 0, food: 0, iron: 0 }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <Hud
        resources={resources ?? emptyResources}
        mapId={mapId}
        isDm={isDm}
      />
      <GameView
        initialTiles={(mapTiles ?? []) as MapTile[]}
        tileTypes={(tileTypes ?? []) as TileType[]}
        catalogueEntries={(catalogueEntries ?? []) as CatalogueEntry[]}
      />
    </div>
  )
}
