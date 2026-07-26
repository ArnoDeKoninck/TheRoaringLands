'use client'
import { useRef, useCallback, useEffect, useMemo } from 'react'
import { useGame } from '@/components/providers/GameProvider'
import HexTile from './HexTile'
import MiniMap from './MiniMap'
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

  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })
  const moved = useRef(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const gridDivRef = useRef<HTMLDivElement>(null)

  // Local refs track pan/zoom without triggering re-renders during drag/zoom
  const localPan = useRef(pan)
  const localZoom = useRef(zoom)

  function applyTransform(p = localPan.current, z = localZoom.current) {
    if (gridDivRef.current) {
      gridDivRef.current.style.transform = `translate(${p.x}px, ${p.y}px) scale(${z})`
    }
  }

  // Sync external pan/zoom changes (minimap click, zoom controls, map switch) to DOM
  useEffect(() => {
    localPan.current = pan
    localZoom.current = zoom
    applyTransform(pan, zoom)
  }, [pan, zoom])

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
    moved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...localPan.current }
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true
    const newPan = { x: panStart.current.x + dx, y: panStart.current.y + dy }
    localPan.current = newPan
    applyTransform(newPan)
  }, [])

  const onPointerUp = useCallback(() => {
    if (!dragging.current) return
    dragging.current = false
    if (containerRef.current) containerRef.current.style.cursor = 'grab'
    setPan(localPan.current)
  }, [setPan])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    function handleWheel(e: WheelEvent) {
      e.preventDefault()
      const newZoom = Math.min(2.5, Math.max(0.4, localZoom.current + (e.deltaY > 0 ? -0.1 : 0.1)))
      localZoom.current = newZoom
      applyTransform(localPan.current, newZoom)
      setZoom(newZoom)
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

  // For circular maps filter to radius_hexes from center
  const circRadius = activeMap.radius_hexes
  const circCenterCol = Math.floor(cols / 2)
  const circCenterRow = Math.floor(rows / 2)
  const hexes: Array<{ col: number; row: number; key: string }> = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (circRadius != null && hexDistance(c, r, circCenterCol, circCenterRow) > circRadius) continue
      hexes.push({ col: c, row: r, key: colRowToKey(c, r) })
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
        cursor: 'grab',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div
        ref={(el) => {
          gridDivRef.current = el
          // Apply transform immediately on mount to avoid a flash at origin
          if (el) el.style.transform = `translate(${localPan.current.x}px, ${localPan.current.y}px) scale(${localZoom.current})`
        }}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: gridW,
          height: gridH,
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

      <MiniMap
        activeMap={activeMap}
        tiles={tiles}
        tileTypeMap={tileTypeMap}
        pan={pan}
        zoom={zoom}
        containerRef={containerRef}
        onPanTo={setPan}
        isDm={isDm}
      />

      <PlacingPill tileTypes={tileTypes} />
    </div>
  )
}
