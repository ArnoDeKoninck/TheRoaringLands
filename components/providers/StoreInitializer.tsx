'use client'
import { useEffect } from 'react'
import { useGameStore } from '@/lib/store/game-store'
import type { GameMap, MapTile, TileType, CatalogueEntry } from '@/lib/types'

interface Props {
  role: 'dm' | 'player'
  maps: GameMap[]
  tileTypes: TileType[]
  catalogueEntries: CatalogueEntry[]
  resources: Record<string, number>
  activeMap: GameMap
  tiles: MapTile[]
}

export default function StoreInitializer({ role, maps, tileTypes, catalogueEntries, resources, activeMap, tiles }: Props) {
  const hydrate = useGameStore(s => s.hydrate)

  useEffect(() => {
    hydrate({ role, maps, tileTypes, catalogueEntries, resources, activeMap, tiles })
  }, [activeMap.id])

  return null
}
