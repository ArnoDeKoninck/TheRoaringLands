'use client'
import { useState } from 'react'
import { useGame } from './providers/GameProvider'
import HexGrid from './hex-grid/HexGrid'
import TileInspector from './inspector/TileInspector'
import { keyToColRow, colRowToKey } from '@/lib/hex-math'
import { revealTile } from '@/actions/map'
import type { MapTile, TileType, CatalogueEntry } from '@/lib/types'

interface Props {
  initialTiles: MapTile[]
  tileTypes: TileType[]
  catalogueEntries: CatalogueEntry[]
}

export default function GameView({ initialTiles, tileTypes, catalogueEntries }: Props) {
  const { catalogueOpen, role } = useGame()
  const isDm = role === 'dm'
  const [tiles, setTiles] = useState<MapTile[]>(initialTiles)
  const [inspectedKey, setInspectedKey] = useState<string | null>(null)

  const tileTypeMap = new Map(tileTypes.map(t => [t.id, t]))

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
      <HexGrid
        tiles={tiles}
        setTiles={setTiles}
        tileTypes={tileTypes}
        onTileInspect={setInspectedKey}
        inspectedKey={inspectedKey}
      />
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
        <div style={{
          width: '320px',
          background: 'oklch(0.19 0.014 260)',
          borderLeft: '1px solid oklch(1 0 0 / 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'oklch(0.4 0.01 260)',
          fontSize: '13px',
        }}>
          Catalogue coming soon
        </div>
      )}
    </div>
  )
}
