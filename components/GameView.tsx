'use client'
import { useState } from 'react'
import { useGame } from './providers/GameProvider'
import type { MapTile, TileType, CatalogueEntry } from '@/lib/types'

interface Props {
  initialTiles: MapTile[]
  tileTypes: TileType[]
  catalogueEntries: CatalogueEntry[]
}

export default function GameView({ initialTiles, tileTypes, catalogueEntries }: Props) {
  const { catalogueOpen } = useGame()
  const [tiles, setTiles] = useState<MapTile[]>(initialTiles)

  return (
    <div style={{ flex: 1, position: 'relative', display: 'flex', overflow: 'hidden' }}>
      {/* HexGrid placeholder — implemented in next task */}
      <div style={{
        flex: 1,
        background: 'oklch(0.115 0.01 260)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'oklch(0.4 0.01 260)',
        fontSize: '13px',
      }}>
        Hex grid coming soon
      </div>
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
