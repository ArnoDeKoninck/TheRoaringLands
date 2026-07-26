import { hexPolygonPoints } from '@/lib/hex-math'
import type { TileType } from '@/lib/types'

interface Props {
  x: number
  y: number
  radius: number
  tileType: TileType | null
  revealed: boolean
  isInspected: boolean
  inPlacementMode: boolean
  isDm: boolean
  onClick: () => void
  onDrop: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
}

export default function HexTile({
  x, y, radius, tileType, revealed, isInspected,
  inPlacementMode, isDm, onClick, onDrop, onDragOver,
}: Props) {
  const w = radius * Math.sqrt(3)
  const h = 2 * radius
  const points = hexPolygonPoints(radius)

  let fill = 'transparent'
  let stroke = 'oklch(1 0 0 / 0.14)'
  let strokeWidth = 1

  if (tileType) {
    if (isDm || revealed) {
      fill = tileType.color
    }
  } else if (inPlacementMode && isDm) {
    fill = 'oklch(0.78 0.15 85 / 0.08)'
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
      draggable={false}
      style={{ position: 'absolute', left: x, top: y, cursor: 'inherit', userSelect: 'none' }}
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <polygon
        points={points}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        opacity={isDmFogged ? 0.4 : 1}
      />
      {tileType && (isDm || revealed) && (
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
      )}
    </svg>
  )
}
