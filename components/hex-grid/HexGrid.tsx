'use client'
import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import { useGame } from '@/components/providers/GameProvider'
import HexTile from './HexTile'
import PlacingPill from './PlacingPill'
import { hexToPixel, gridPixelSize, colRowToKey, hexDistance } from '@/lib/hex-math'
import { placeTile } from '@/actions/map'
import type { MapTile, TileType } from '@/lib/types'

interface Props {
  tiles: MapTile[]
  setTiles: React.Dispatch<React.SetStateAction<MapTile[]>>
  tileTypes: TileType[]
  onTileInspect: (key: string | null) => void
  inspectedKey: string | null
}

export default function HexGrid({ tiles, setTiles, tileTypes, onTileInspect, inspectedKey }: Props) {
  const { role, activeMap, selectedTileId, setSelectedTileId, zoom, setZoom, pan, setPan } = useGame()
  const isDm = role === 'dm'
  const { grid_cols: cols, grid_rows: rows, hex_radius: radius } = activeMap
  const { width: gridW, height: gridH } = gridPixelSize(cols, rows, radius)

  const tileMap = useMemo(() => new Map(tiles.map(t => [colRowToKey(t.col, t.row), t])), [tiles])
  const tileTypeMap = useMemo(() => new Map(tileTypes.map(t => [t.id, t])), [tileTypes])

  // Pan drag state — use refs to avoid re-renders during drag
  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })
  const moved = useRef(false)

  // Separate state for cursor so it triggers re-renders
  const [isDragging, setIsDragging] = useState(false)
  const zoomRef = useRef(zoom)
  useEffect(() => { zoomRef.current = zoom }, [zoom])

  const containerRef = useRef<HTMLDivElement>(null)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Only start drag on the background, not on SVG hex elements
    if ((e.target as Element).closest('svg')) return
    dragging.current = true
    setIsDragging(true)
    moved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = pan
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
  }, [pan])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy })
  }, [setPan])

  const onPointerUp = useCallback(() => {
    dragging.current = false
    setIsDragging(false)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      setZoom(zoomRef.current + (e.deltaY > 0 ? -0.1 : 0.1))
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [setZoom])

  async function handleHexClick(col: number, row: number, overrideTileTypeId?: string) {
    if (moved.current) return
    const key = colRowToKey(col, row)
    const tileId = overrideTileTypeId ?? selectedTileId

    if (tileId && isDm) {
      const result = await placeTile({ mapId: activeMap.id, col, row, tileTypeId: tileId })
      if (result.tile) {
        setTiles(prev => {
          const next = prev.filter(t => !(t.col === col && t.row === row))
          return [...next, result.tile!]
        })
      }
      return
    }

    const existing = tileMap.get(key)
    if (existing) {
      onTileInspect(key === inspectedKey ? null : key)
    } else {
      onTileInspect(null)
    }
  }

  function handleDrop(e: React.DragEvent, col: number, row: number) {
    e.preventDefault()
    if (!isDm) return
    const tileId = e.dataTransfer.getData('tileTypeId')
    if (!tileId) return
    setSelectedTileId(tileId)
    handleHexClick(col, row, tileId)
  }

  // Build cell list — for circular maps filter to radius_hexes from center
  const circRadius = activeMap.radius_hexes
  const circCenterCol = Math.floor(cols / 2)
  const circCenterRow = Math.floor(rows / 2)
  const hexes: Array<{ col: number; row: number; key: string }> = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (circRadius != null && hexDistance(col, row, circCenterCol, circCenterRow) > circRadius) continue
      hexes.push({ col, row, key: colRowToKey(col, row) })
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: 'oklch(0.115 0.01 260)',
        backgroundImage: 'radial-gradient(oklch(1 0 0 / 0.045) 1px, transparent 1px)',
        backgroundSize: '26px 26px',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: gridW,
          height: gridH,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {hexes.map(({ col, row, key }) => {
          const { x, y } = hexToPixel(col, row, radius)
          const tile = tileMap.get(key) ?? null
          const tileType = tile ? (tileTypeMap.get(tile.tile_type_id) ?? null) : null
          return (
            <HexTile
              key={key}
              x={x}
              y={y}
              radius={radius}
              tileType={tileType}
              revealed={tile?.revealed ?? false}
              isInspected={key === inspectedKey}
              inPlacementMode={!!selectedTileId}
              isDm={isDm}
              onClick={() => handleHexClick(col, row)}
              onDrop={e => handleDrop(e, col, row)}
              onDragOver={e => e.preventDefault()}
            />
          )
        })}
      </div>

      <PlacingPill tileTypes={tileTypes} />
    </div>
  )
}
