'use client'
import { useRef, useEffect, useMemo, useState } from 'react'
import { useGameStore } from '@/lib/store/game-store'
import HexTile from './HexTile'
import HexTooltip from './HexTooltip'
import HexContextMenu from './HexContextMenu'
import MiniMap from './MiniMap'
import PlacingPill from './PlacingPill'
import { hexToPixel, gridPixelSize, colRowToKey, hexDistance } from '@/lib/hex-math'
import { placeTile } from '@/actions/map'
import { useMapInteractions } from '@/hooks/use-map-interactions'
import { useKeyboardPan } from '@/hooks/use-keyboard-pan'

export default function HexGrid() {
  const role = useGameStore(s => s.role)
  const activeMap = useGameStore(s => s.activeMap)
  const tiles = useGameStore(s => s.tiles)
  const setTiles = useGameStore(s => s.setTiles)
  const tileTypes = useGameStore(s => s.tileTypes)
  const inspectedKey = useGameStore(s => s.inspectedKey)
  const setInspectedKey = useGameStore(s => s.setInspectedKey)
  const selectedKeys = useGameStore(s => s.selectedKeys)
  const selectedTileId = useGameStore(s => s.selectedTileTypeId)
  const setSelectedTileId = useGameStore(s => s.setSelectedTileTypeId)
  const zoom = useGameStore(s => s.zoom)
  const pan = useGameStore(s => s.pan)
  const setPan = useGameStore(s => s.setPan)
  const isDm = role === 'dm'
  const cols = activeMap?.grid_cols ?? 0
  const rows = activeMap?.grid_rows ?? 0
  const radius = activeMap?.hex_radius ?? 48
  const { width: gridW, height: gridH } = gridPixelSize(cols, rows, radius)

  const tileMap = useMemo(() => new Map(tiles.map(t => [colRowToKey(t.col, t.row), t])), [tiles])
  const tileTypeMap = useMemo(() => new Map(tileTypes.map(t => [t.id, t])), [tileTypes])

  const [tooltipPos, setTooltipPos] = useState<{ clientX: number; clientY: number } | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const gridDivRef = useRef<HTMLDivElement>(null)
  const localPan = useRef(pan)
  const localZoom = useRef(zoom)

  function applyTransform(p = localPan.current, z = localZoom.current) {
    if (gridDivRef.current) {
      gridDivRef.current.style.transform = `translate(${p.x}px, ${p.y}px) scale(${z})`
    }
  }

  // Sync external changes (minimap click, map switch, zoom buttons) to DOM
  useEffect(() => {
    localPan.current = pan
    localZoom.current = zoom
    applyTransform(pan, zoom)
  }, [pan, zoom])

  const { onPointerDown, onPointerMove, onPointerUp, onContextMenu } = useMapInteractions({
    containerRef,
    localPan,
    localZoom,
    applyTransform,
  })

  useKeyboardPan({ localPan, applyTransform })

  // Compute tooltip position when inspectedKey changes
  useEffect(() => {
    if (!inspectedKey || !activeMap) { setTooltipPos(null); return }
    const [colStr, rowStr] = inspectedKey.split(',')
    const col = parseInt(colStr)
    const row = parseInt(rowStr)
    const { x: hexX, y: hexY } = hexToPixel(col, row, radius)
    const hexW = radius * Math.sqrt(3)
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltipPos({
      clientX: rect.left + (hexX + hexW / 2) * localZoom.current + localPan.current.x,
      clientY: rect.top + hexY * localZoom.current + localPan.current.y,
    })
  }, [inspectedKey, radius])

  if (!activeMap) return null

  function handleDrop(e: React.DragEvent, col: number, row: number) {
    e.preventDefault()
    if (!isDm) return
    const tileId = e.dataTransfer.getData('tileTypeId')
    if (!tileId) return
    setSelectedTileId(tileId)
    placeTile({ mapId: activeMap?.id ?? '', col, row, tileTypeId: tileId }).then(result => {
      if (result.tile) {
        setTiles(prev => {
          const next = prev.filter(t => !(t.col === col && t.row === row))
          return [...next, result.tile!]
        })
      }
    })
  }

  // Build cell list — filter to circle for maps with radius_hexes
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
        cursor: 'crosshair',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onContextMenu={onContextMenu}
    >
      <div
        ref={(el) => {
          gridDivRef.current = el
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
              col={col}
              row={row}
              radius={radius}
              tileType={tileType}
              revealed={tile?.revealed ?? false}
              isInspected={key === inspectedKey}
              isSelected={selectedKeys.has(key)}
              inPlacementMode={!!selectedTileId}
              isDm={isDm}
              onDrop={e => handleDrop(e, col, row)}
              onDragOver={e => e.preventDefault()}
            />
          )
        })}
      </div>

      {inspectedKey && tooltipPos && (() => {
        const tile = tileMap.get(inspectedKey) ?? null
        const type = tile ? (tileTypeMap.get(tile.tile_type_id) ?? null) : null
        if (!tile || !type) return null
        return (
          <HexTooltip
            tile={tile}
            tileType={type}
            col={tile.col}
            row={tile.row}
            clientX={tooltipPos.clientX}
            clientY={tooltipPos.clientY}
            isDm={isDm}
          />
        )
      })()}

      <HexContextMenu />

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
