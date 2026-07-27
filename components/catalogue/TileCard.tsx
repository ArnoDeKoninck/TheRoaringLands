'use client'
import { useGameStore } from '@/lib/store/game-store'
import { HEX_ICON_MAP } from '@/lib/hex-icons'
import type { TileType } from '@/lib/types'

interface Props {
  tile: TileType
  isDm: boolean
}

const HEX_POINTS = '18,0 36,10 36,30 18,40 0,30 0,10'

export default function TileCard({ tile, isDm }: Props) {
  const selectedTileId = useGameStore(s => s.selectedTileTypeId)
  const setSelectedTileId = useGameStore(s => s.setSelectedTileTypeId)
  const isActive = selectedTileId === tile.id

  function onDragStart(e: React.DragEvent) {
    if (!isDm) return
    e.dataTransfer.setData('tileTypeId', tile.id)
    setSelectedTileId(tile.id)

    // Hex-shaped drag ghost using the tile's icon SVG
    const ns = 'http://www.w3.org/2000/svg'
    const ghost = document.createElementNS(ns, 'svg')
    ghost.setAttribute('width', '63')
    ghost.setAttribute('height', '72')
    ghost.style.cssText = 'position:fixed;top:-9999px;left:-9999px;'

    const iconPath = HEX_ICON_MAP[tile.code]
    if (iconPath) {
      const img = document.createElementNS(ns, 'image')
      img.setAttribute('href', iconPath)
      img.setAttribute('x', '0')
      img.setAttribute('y', '0')
      img.setAttribute('width', '63')
      img.setAttribute('height', '72')
      img.setAttribute('preserveAspectRatio', 'xMidYMid slice')
      ghost.appendChild(img)
    } else {
      const poly = document.createElementNS(ns, 'polygon')
      poly.setAttribute('points', '31.18,0 62.35,18 62.35,54 31.18,72 0,54 0,18')
      poly.setAttribute('fill', tile.color)
      ghost.appendChild(poly)
      const text = document.createElementNS(ns, 'text')
      text.setAttribute('x', '31')
      text.setAttribute('y', '41')
      text.setAttribute('text-anchor', 'middle')
      text.setAttribute('font-family', 'ui-monospace, monospace')
      text.setAttribute('font-size', '13')
      text.setAttribute('font-weight', '700')
      text.setAttribute('fill', 'rgba(10,10,20,0.85)')
      text.textContent = tile.code
      ghost.appendChild(text)
    }

    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, 31, 36)
    requestAnimationFrame(() => document.body.removeChild(ghost))
  }

  function onDragEnd(e: React.DragEvent) {
    if (e.dataTransfer.dropEffect === 'none') setSelectedTileId(null)
  }

  return (
    <div
      draggable={isDm}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => isDm && setSelectedTileId(isActive ? null : tile.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 10px',
        borderRadius: '10px',
        border: `1px solid ${isActive ? 'oklch(0.78 0.15 85 / 0.4)' : 'oklch(1 0 0 / 0.08)'}`,
        background: isActive ? 'oklch(0.78 0.15 85 / 0.1)' : 'oklch(0.22 0.015 260)',
        cursor: isDm ? (isActive ? 'grabbing' : 'grab') : 'default',
        userSelect: 'none',
      }}
    >
      <svg width={36} height={40} viewBox="0 0 36 40" style={{ flex: 'none' }}>
        {HEX_ICON_MAP[tile.code] ? (
          <image
            href={HEX_ICON_MAP[tile.code]}
            x={0} y={0} width={36} height={40}
            preserveAspectRatio="xMidYMid slice"
          />
        ) : (
          <>
            <polygon points={HEX_POINTS} fill={tile.color} stroke="oklch(0 0 0 / 0.25)" strokeWidth="1" />
            <text x="18" y="24" textAnchor="middle" fontFamily="ui-monospace, monospace" fontSize="9" fontWeight="700" fill="oklch(0.12 0.01 260)">
              {tile.code}
            </text>
          </>
        )}
      </svg>

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'oklch(0.93 0.006 260)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {tile.name}
        </div>
        {tile.description && (
          <div style={{
            fontSize: '11px',
            color: 'oklch(0.55 0.02 260)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            marginTop: '1px',
          }}>
            {tile.description}
          </div>
        )}
      </div>
    </div>
  )
}
