'use client'
import { useMemo } from 'react'
import { hexToPixel, gridPixelSize } from '@/lib/hex-math'
import type { GameMap, MapTile, TileType } from '@/lib/types'

const MM_WIDTH = 160

interface Props {
  activeMap: GameMap
  tiles: MapTile[]
  tileTypeMap: Map<string, TileType>
  pan: { x: number; y: number }
  zoom: number
  containerRef: React.RefObject<HTMLDivElement | null>
  onPanTo: (pan: { x: number; y: number }) => void
  isDm: boolean
}

export default function MiniMap({ activeMap, tiles, tileTypeMap, pan, zoom, containerRef, onPanTo, isDm }: Props) {
  const { grid_cols: cols, grid_rows: rows, hex_radius: radius } = activeMap
  const { width: gridW, height: gridH } = gridPixelSize(cols, rows, radius)
  const hexW = radius * Math.sqrt(3)
  const hexH = 2 * radius
  const scale = MM_WIDTH / gridW
  const mmH = Math.round(gridH * scale)

  const visibleTiles = useMemo(
    () => tiles.filter(t => isDm || t.revealed),
    [tiles, isDm],
  )

  function handleClick(e: React.MouseEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const gridX = (e.clientX - rect.left) / scale
    const gridY = (e.clientY - rect.top) / scale
    const cw = containerRef.current?.clientWidth ?? 800
    const ch = containerRef.current?.clientHeight ?? 600
    onPanTo({ x: cw / 2 - gridX * zoom, y: ch / 2 - gridY * zoom })
  }

  const vx = (-pan.x / zoom) * scale
  const vy = (-pan.y / zoom) * scale
  const vw = ((containerRef.current?.clientWidth ?? 800) / zoom) * scale
  const vh = ((containerRef.current?.clientHeight ?? 600) / zoom) * scale

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '12px',
        right: '12px',
        borderRadius: '8px',
        border: '1px solid oklch(1 0 0 / 0.12)',
        background: 'oklch(0.14 0.012 260 / 0.9)',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}
      onPointerDown={e => e.stopPropagation()}
    >
      <svg
        width={MM_WIDTH}
        height={mmH}
        style={{ display: 'block', cursor: 'crosshair' }}
        onClick={handleClick}
      >
        <rect width={MM_WIDTH} height={mmH} fill="oklch(0.115 0.01 260)" />

        {visibleTiles.map(tile => {
          const tileType = tileTypeMap.get(tile.tile_type_id)
          if (!tileType) return null
          const { x, y } = hexToPixel(tile.col, tile.row, radius)
          return (
            <rect
              key={tile.id}
              x={x * scale}
              y={y * scale}
              width={Math.ceil(hexW * scale) + 1}
              height={Math.ceil(hexH * scale) + 1}
              fill={tileType.color}
            />
          )
        })}

        <rect
          x={vx}
          y={vy}
          width={vw}
          height={vh}
          fill="oklch(0.78 0.15 200 / 0.12)"
          stroke="oklch(0.78 0.15 200)"
          strokeWidth={1}
        />
      </svg>
    </div>
  )
}
