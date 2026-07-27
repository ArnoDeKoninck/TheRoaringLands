import { hexPolygonPoints } from '@/lib/hex-math'
import { HEX_ICON_MAP } from '@/lib/hex-icons'
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
  isDragOver: boolean
  dragPreviewColor: string | null
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDragEnter: (e: React.DragEvent) => void
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
  inPlacementMode, isDm, layerOverlays, borderLines,
  isDragOver, dragPreviewColor, onDrop, onDragOver, onDragEnter,
}: Props) {
  const w = radius * Math.sqrt(3)
  const h = 2 * radius
  const points = hexPolygonPoints(radius)

  const verts: [number, number][] = [
    [w / 2, 0],
    [w, h / 4],
    [w, 3 * h / 4],
    [w / 2, h],
    [0, 3 * h / 4],
    [0, h / 4],
  ]

  const iconPath = tileType ? (HEX_ICON_MAP[tileType.code] ?? null) : null
  const isDmFogged = isDm && tileType !== null && !revealed
  const showIcon = iconPath !== null && (isDm || revealed)

  // Base polygon fill: only shown for empty hexes in placement mode
  let baseFill = 'transparent'
  if (inPlacementMode && isDm && !showIcon && !isDragOver) {
    baseFill = 'oklch(0.78 0.15 85 / 0.08)'
  }

  // Selection/inspection stroke
  let selectionStroke = 'none'
  let selectionWidth = 0
  if (!isDragOver) {
    if (isInspected) { selectionStroke = 'oklch(0.78 0.15 200)'; selectionWidth = 3 }
    else if (isSelected) { selectionStroke = 'oklch(0.78 0.15 200 / 0.7)'; selectionWidth = 2 }
  }

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
      onDragEnter={onDragEnter}
    >
      {/* 1. Base fill (placement mode tint for empty hexes) */}
      <polygon points={points} fill={baseFill} stroke="none" />

      {/* 2. Tile icon — self-contained hex SVG, sliced to fill exact tile bounds */}
      {showIcon && (
        <image
          href={iconPath!}
          x={0} y={0}
          width={w} height={h}
          preserveAspectRatio="xMidYMid slice"
          opacity={isDmFogged ? 0.4 : 1}
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* 3. Layer overlays (semi-transparent colored regions) */}
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

      {/* 4. Region border lines */}
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

      {/* 5. Drag-over: color overlay + teal ring */}
      {isDragOver && dragPreviewColor && (
        <polygon
          points={points}
          fill={dragPreviewColor}
          fillOpacity={0.45}
          stroke="none"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* 6. Grid border (always visible, sits on top of image) */}
      <polygon
        points={points}
        fill="none"
        stroke={isDragOver ? 'oklch(0.78 0.15 200)' : 'oklch(1 0 0 / 0.14)'}
        strokeWidth={isDragOver ? 3 : 1}
        style={{ pointerEvents: 'none' }}
      />

      {/* 7. Selection / inspection ring */}
      {(selectionWidth > 0) && (
        <polygon
          points={points}
          fill="none"
          stroke={selectionStroke}
          strokeWidth={selectionWidth}
          style={{ pointerEvents: 'none' }}
        />
      )}
    </svg>
  )
}
