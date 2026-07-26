import { neighborsOf, colRowToKey } from '@/lib/hex-math'
import type { MapTile, TileType } from '@/lib/types'

interface Props {
  tile: MapTile
  tileType: TileType
  allTiles: MapTile[]
  tileTypeMap: Map<string, TileType>
  onClose: () => void
  onRevealToggle?: () => Promise<void>
  isDm: boolean
}

export default function TileInspector({
  tile, tileType, allTiles, tileTypeMap, onClose, onRevealToggle, isDm,
}: Props) {
  const neighborCoords = neighborsOf(tile.col, tile.row)
  const tileIndex = new Map(allTiles.map(t => [colRowToKey(t.col, t.row), t]))
  const adjacentTiles = neighborCoords
    .map(([c, r]) => tileIndex.get(colRowToKey(c, r)))
    .filter((t): t is MapTile => t !== undefined)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        width: '250px',
        borderRadius: '10px',
        border: '1px solid oklch(1 0 0 / 0.08)',
        padding: '16px',
        zIndex: 10,
        background: 'oklch(0.22 0.015 260)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        animation: 'hf-fadein 0.2s ease both',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: tileType.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'ui-monospace, monospace',
            color: 'oklch(0.12 0.01 260)',
            flex: 'none',
          }}>
            {tileType.code}
          </div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'oklch(0.93 0.006 260)' }}>
            {tileType.name}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'oklch(0.55 0.02 260)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: 0,
            lineHeight: 1,
          }}
        >
          ✕
        </button>
      </div>

      {/* Produces */}
      {tileType.produces && (
        <div style={{ fontSize: '12px', color: 'oklch(0.6 0.02 260)', marginBottom: '8px' }}>
          Produces:{' '}
          <span style={{ color: 'oklch(0.88 0.006 260)', textTransform: 'capitalize' }}>
            {tileType.produces}
          </span>
        </div>
      )}

      {/* Description */}
      {tileType.description && (
        <div style={{ fontSize: '11.5px', color: 'oklch(0.55 0.02 260)', marginBottom: '12px' }}>
          {tileType.description}
        </div>
      )}

      {/* Connections */}
      <div style={{ fontSize: '11.5px', color: 'oklch(0.6 0.02 260)', marginBottom: '6px' }}>
        Connections ({adjacentTiles.length})
      </div>
      {adjacentTiles.length === 0 ? (
        <div style={{ fontSize: '11px', color: 'oklch(0.45 0.01 260)' }}>
          No adjacent tiles yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {adjacentTiles.map(t => {
            const type = tileTypeMap.get(t.tile_type_id)
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'oklch(0.88 0.006 260)' }}>
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '3px',
                  background: type?.color ?? 'oklch(0.3 0 0)',
                  flex: 'none',
                }} />
                {type?.name ?? 'Unknown'}
              </div>
            )
          })}
        </div>
      )}

      {/* DM reveal toggle */}
      {isDm && onRevealToggle && (
        <button
          onClick={onRevealToggle}
          style={{
            marginTop: '12px',
            width: '100%',
            padding: '6px 0',
            borderRadius: '8px',
            border: '1px solid oklch(1 0 0 / 0.1)',
            cursor: 'pointer',
            fontSize: '11.5px',
            fontWeight: 600,
            background: tile.revealed
              ? 'oklch(0.75 0.15 25 / 0.15)'
              : 'oklch(0.78 0.15 200 / 0.15)',
            color: tile.revealed
              ? 'oklch(0.75 0.15 25)'
              : 'oklch(0.78 0.15 200)',
          }}
        >
          {tile.revealed ? 'Hide from players' : 'Reveal to players'}
        </button>
      )}
    </div>
  )
}
