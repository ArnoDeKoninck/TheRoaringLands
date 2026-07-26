'use client'
import { useGameStore } from '@/lib/store/game-store'
import type { TileType } from '@/lib/types'

interface Props {
  tile: TileType
  isDm: boolean
}

export default function TileCard({ tile, isDm }: Props) {
  const selectedTileId = useGameStore(s => s.selectedTileTypeId)
  const setSelectedTileId = useGameStore(s => s.setSelectedTileTypeId)
  const isActive = selectedTileId === tile.id

  function onDragStart(e: React.DragEvent) {
    if (!isDm) return
    e.dataTransfer.setData('tileTypeId', tile.id)
  }

  return (
    <div
      draggable={isDm}
      onDragStart={onDragStart}
      onClick={() => isDm && setSelectedTileId(isActive ? null : tile.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px',
        borderRadius: '10px',
        border: `1px solid ${isActive ? 'oklch(0.78 0.15 85 / 0.4)' : 'oklch(1 0 0 / 0.08)'}`,
        background: isActive ? 'oklch(0.78 0.15 85 / 0.1)' : 'oklch(0.22 0.015 260)',
        cursor: isDm ? 'pointer' : 'default',
        userSelect: 'none',
      }}
    >
      <div style={{
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        background: tile.color,
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: 'ui-monospace, monospace',
        color: 'oklch(0.12 0.01 260)',
      }}>
        {tile.code}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'oklch(0.93 0.006 260)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {tile.name}
        </div>
        {tile.description && (
          <div style={{ fontSize: '11.5px', color: 'oklch(0.6 0.02 260)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {tile.description}
          </div>
        )}
      </div>
    </div>
  )
}
