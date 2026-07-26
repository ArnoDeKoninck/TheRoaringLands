'use client'
import { useRef } from 'react'
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
  const lastMapId = useRef<string | null>(null)

  // Synchronous during render — store is hydrated before any child renders,
  // eliminating the useEffect-after-paint flash. Re-runs on map switch.
  if (lastMapId.current !== activeMap.id) {
    lastMapId.current = activeMap.id
    useGameStore.getState().hydrate({ role, maps, tileTypes, catalogueEntries, resources, activeMap, tiles })
  }

  return null
}
