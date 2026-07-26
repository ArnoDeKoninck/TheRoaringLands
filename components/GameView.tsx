'use client'
import { useMemo } from 'react'
import { useGameStore } from '@/lib/store/game-store'
import HexGrid from './hex-grid/HexGrid'
import TileInspector from './inspector/TileInspector'
import CataloguePanel from './catalogue/CataloguePanel'
import { colRowToKey } from '@/lib/hex-math'
import { revealTile } from '@/actions/map'
import { useRealtimeSync } from '@/hooks/use-realtime-sync'
import type { MapTile, TileType, CatalogueEntry } from '@/lib/types'

interface Props {
  initialTiles: MapTile[]
  tileTypes: TileType[]
  catalogueEntries: CatalogueEntry[]
}

export default function GameView({ initialTiles: _initialTiles, tileTypes, catalogueEntries }: Props) {
  useRealtimeSync()
  const catalogueOpen = useGameStore(s => s.catalogueOpen)
  const role = useGameStore(s => s.role)
  const isDm = role === 'dm'
  const tiles = useGameStore(s => s.tiles)
  const setTiles = useGameStore(s => s.setTiles)
  const inspectedKey = useGameStore(s => s.inspectedKey)
  const setInspectedKey = useGameStore(s => s.setInspectedKey)

  const tileTypeMap = useMemo(() => new Map(tileTypes.map(t => [t.id, t])), [tileTypes])

  const inspectedTile = inspectedKey
    ? tiles.find(t => colRowToKey(t.col, t.row) === inspectedKey) ?? null
    : null
  const inspectedType = inspectedTile
    ? tileTypeMap.get(inspectedTile.tile_type_id) ?? null
    : null

  async function handleRevealToggle() {
    if (!inspectedTile) return
    const result = await revealTile({ tileId: inspectedTile.id, revealed: !inspectedTile.revealed })
    if (result.tile) {
      setTiles(prev => prev.map(t => t.id === result.tile!.id ? result.tile! : t))
    }
  }

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
      <HexGrid />
      {inspectedTile && inspectedType && (
        <TileInspector
          tile={inspectedTile}
          tileType={inspectedType}
          allTiles={tiles}
          tileTypeMap={tileTypeMap}
          onClose={() => setInspectedKey(null)}
          onRevealToggle={isDm ? handleRevealToggle : undefined}
          isDm={isDm}
        />
      )}
      {catalogueOpen && (
        <CataloguePanel
          tileTypes={tileTypes}
          catalogueEntries={catalogueEntries}
        />
      )}
    </div>
  )
}
