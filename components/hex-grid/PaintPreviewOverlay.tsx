'use client'
import { useGameStore } from '@/lib/store/game-store'
import { hexPolygonPoints, gridPixelSize } from '@/lib/hex-math'

export default function PaintPreviewOverlay() {
  const paintPreview = useGameStore(s => s.paintPreview)
  const activeMap = useGameStore(s => s.activeMap)

  if (!paintPreview || paintPreview.hexes.length === 0) return null

  const radius = activeMap?.hex_radius ?? 48
  const cols = activeMap?.grid_cols ?? 0
  const rows = activeMap?.grid_rows ?? 0
  const { width, height } = gridPixelSize(cols, rows, radius)
  const points = hexPolygonPoints(radius)

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {paintPreview.hexes.map(({ key, x, y }) => (
        <polygon
          key={key}
          points={points}
          transform={`translate(${x}, ${y})`}
          fill={paintPreview.color}
          fillOpacity={0.5}
          stroke={paintPreview.color}
          strokeWidth={1.5}
          strokeOpacity={0.8}
        />
      ))}
    </svg>
  )
}
