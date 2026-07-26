import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Hud from '@/components/hud/Hud'
import GameView from '@/components/GameView'
import StoreInitializer from '@/components/providers/StoreInitializer'
import type { PartyResources, MapTile, TileType, CatalogueEntry, GameMap, Profile, Role, MapLayer, LayerRegion, HexLayerData } from '@/lib/types'

export default async function GamePage({ searchParams }: { searchParams: Promise<{ mapId?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: mapsData }, { data: profile }] = await Promise.all([
    supabase.from('maps').select('*').order('created_at'),
    supabase.from('profiles').select('role').eq('id', user.id).single<Pick<Profile, 'role'>>(),
  ])

  const maps: GameMap[] = (mapsData ?? []) as GameMap[]
  const role: Role = (profile?.role as Role) ?? 'player'
  const isDm = role === 'dm'
  const mapId = params.mapId ?? maps[0]?.id ?? ''
  const activeMap = maps.find(m => m.id === mapId) ?? maps[0]

  const [
    { data: mapTiles },
    { data: tileTypes },
    { data: catalogueEntries },
    { data: resources },
    { data: mapLayersData },
  ] = await Promise.all([
    supabase.from('map_tiles').select('*').eq('map_id', mapId),
    supabase.from('tile_types').select('*').order('order_index'),
    supabase.from('catalogue_entries').select('*').order('order_index'),
    supabase.from('party_resources').select('*').eq('map_id', mapId).maybeSingle<PartyResources>(),
    supabase.from('map_layers').select('*').eq('map_id', mapId).order('order_index'),
  ])

  const layerIds = (mapLayersData ?? []).map((l: any) => l.id as string)
  const [{ data: layerRegionsData }, { data: hexLayerDataRows }] = await Promise.all([
    layerIds.length > 0
      ? supabase.from('layer_regions').select('*').in('layer_id', layerIds).order('order_index')
      : Promise.resolve({ data: [] }),
    layerIds.length > 0
      ? supabase.from('hex_layer_data').select('*').eq('map_id', mapId).in('layer_id', layerIds)
      : Promise.resolve({ data: [] }),
  ])

  const emptyResources: PartyResources = { id: '', map_id: null, gold: 0, wood: 0, stone: 0, food: 0, iron: 0 }
  const resolvedResources = resources ?? emptyResources
  const resourceRecord: Record<string, number> = {
    gold: resolvedResources.gold, wood: resolvedResources.wood,
    stone: resolvedResources.stone, food: resolvedResources.food, iron: resolvedResources.iron,
  }

  return (
    <>
      <StoreInitializer
        role={role}
        maps={maps}
        tileTypes={(tileTypes ?? []) as TileType[]}
        catalogueEntries={(catalogueEntries ?? []) as CatalogueEntry[]}
        resources={resourceRecord}
        activeMap={activeMap!}
        tiles={(mapTiles ?? []) as MapTile[]}
        mapLayers={(mapLayersData ?? []) as MapLayer[]}
        layerRegions={(layerRegionsData ?? []) as LayerRegion[]}
        hexLayerData={(hexLayerDataRows ?? []) as HexLayerData[]}
      />
      <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Hud resources={resolvedResources} mapId={mapId} isDm={isDm} />
        <GameView
          initialTiles={(mapTiles ?? []) as MapTile[]}
          tileTypes={(tileTypes ?? []) as TileType[]}
          catalogueEntries={(catalogueEntries ?? []) as CatalogueEntry[]}
        />
      </div>
    </>
  )
}
