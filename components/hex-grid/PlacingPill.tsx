'use client'
import { useGameStore } from '@/lib/store/game-store'
import type { TileType } from '@/lib/types'

interface Props {
  tileTypes: TileType[]
}

export default function PlacingPill({ tileTypes }: Props) {
  const selectedTileId = useGameStore(s => s.selectedTileTypeId)
  const setSelectedTileId = useGameStore(s => s.setSelectedTileTypeId)
  if (!selectedTileId) return null
  const tile = tileTypes.find(t => t.id === selectedTileId)
  if (!tile) return null

  return (
    <div style={{
      position: 'absolute',
      top: '16px',
      left: '16px',
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '8px 14px',
      borderRadius: '8px',
      fontSize: '12.5px',
      fontWeight: 700,
      boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
      background: 'oklch(0.78 0.15 85 / 0.95)',
      color: 'oklch(0.14 0.02 85)',
    }}>
      Placing: {tile.name}
      <button
        onClick={() => setSelectedTileId(null)}
        style={{
          background: 'oklch(0.14 0.02 85 / 0.2)',
          border: 'none',
          borderRadius: '5px',
          color: 'oklch(0.14 0.02 85)',
          width: '18px',
          height: '18px',
          cursor: 'pointer',
          fontSize: '12px',
          lineHeight: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  )
}
