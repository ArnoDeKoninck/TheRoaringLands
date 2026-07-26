import { hexPolygonPoints } from '@/lib/hex-math'
import { HEX_ICON_CODES } from '@/lib/hex-icons'
import type { TileType } from '@/lib/types'

export interface LayerOverlay {
  color: string
  opacity: number
}

export interface BorderLine {
  neighborIdx: number
  color: string
}

interface Props {
  x: number
  y: number
  col: number
  row: number
  radius: number
  tileType: TileType | null
  revealed: boolean
  isInspected: boolean
  isSelected: boolean
  inPlacementMode: boolean
  isDm: boolean
  layerOverlays: LayerOverlay[]
  borderLines: BorderLine[]
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
}

// For each neighbor index (order from neighborsOf: E,W,NE,NW,SE,SW),
// the two vertex indices of the shared edge.
const NEIGHBOR_EDGE_VERTS: [number, number][] = [
  [1, 2], // E
  [4, 5], // W
  [0, 1], // NE
  [5, 0], // NW
  [2, 3], // SE
  [3, 4], // SW
]

export default function HexTile({
  x, y, col, row, radius, tileType, revealed, isInspected, isSelected,
  inPlacementMode, isDm, layerOverlays, borderLines, onDrop, onDragOver,
}: Props) {
  const w = radius * Math.sqrt(3)
  const h = 2 * radius
  const points = hexPolygonPoints(radius)

  // Precompute the 6 vertex positions
  const verts: [number, number][] = [
    [w / 2, 0],
    [w, h / 4],
    [w, 3 * h / 4],
    [w / 2, h],
    [0, 3 * h / 4],
    [0, h / 4],
  ]

  let fill = 'transparent'
  let stroke = 'oklch(1 0 0 / 0.14)'
  let strokeWidth = 1

  if (tileType) {
    if (isDm || revealed) fill = tileType.color
  } else if (inPlacementMode && isDm) {
    fill = 'oklch(0.78 0.15 85 / 0.08)'
  }

  if (isSelected && !isInspected) {
    stroke = 'oklch(0.78 0.15 200 / 0.7)'
    strokeWidth = 2
  }
  if (isInspected) {
    stroke = 'oklch(0.78 0.15 200)'
    strokeWidth = 3
  }

  const isDmFogged = isDm && tileType !== null && !revealed

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      data-col={col}
      data-row={row}
      style={{ position: 'absolute', left: x, top: y, cursor: 'inherit', userSelect: 'none' }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {/* Base terrain polygon */}
      <polygon
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={isDmFogged ? 0.4 : 1}
      />

      {/* Layer overlay polygons (stacked, semi-transparent) */}
      {layerOverlays.map((overlay, i) => (
        <polygon
          key={i}
          points={points}
          fill={overlay.color}
          opacity={overlay.opacity}
          stroke="none"
          style={{ pointerEvents: 'none' }}
        />
      ))}

      {/* Region border lines */}
      {borderLines.map((bl, i) => {
        const [vi1, vi2] = NEIGHBOR_EDGE_VERTS[bl.neighborIdx]
        const [x1, y1] = verts[vi1]
        const [x2, y2] = verts[vi2]
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={bl.color}
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{ pointerEvents: 'none' }}
          />
        )
      })}

      {/* Terrain icon or code */}
      {tileType && (isDm || revealed) && (
        HEX_ICON_CODES.has(tileType.code) ? (
          <use
            href={`#hex-${tileType.code}`}
            x={w * 0.25}
            y={h * 0.25}
            width={w * 0.5}
            height={h * 0.5}
            color="oklch(0.12 0.01 260)"
            opacity={isDmFogged ? 0.6 : 1}
            style={{ pointerEvents: 'none' }}
          />
        ) : (
          <text
            x={w / 2}
            y={h / 2 + 5}
            textAnchor="middle"
            fontFamily="ui-monospace, monospace"
            fontSize="15"
            fontWeight="700"
            fill="oklch(0.12 0.01 260)"
            opacity={isDmFogged ? 0.6 : 1}
            style={{ pointerEvents: 'none' }}
          >
            {tileType.code}
          </text>
        )
      )}
    </svg>
  )
}
