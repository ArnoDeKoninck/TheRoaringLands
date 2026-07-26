'use client'
import { useRef } from 'react'
import { useGameStore } from '@/lib/store/game-store'
import type { GameMap, MapTile, TileType, CatalogueEntry, MapLayer, LayerRegion, HexLayerData } from '@/lib/types'

interface Props {
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
}

export default function StoreInitializer({
  role, maps, tileTypes, catalogueEntries, resources, activeMap, tiles,
  mapLayers, layerRegions, hexLayerData,
}: Props) {
  const lastMapId = useRef<string | null>(null)

  if (lastMapId.current !== activeMap.id) {
    lastMapId.current = activeMap.id
    useGameStore.getState().hydrate({
      role, maps, tileTypes, catalogueEntries, resources, activeMap, tiles,
      mapLayers, layerRegions, hexLayerData,
    })
  }

  return null
}
