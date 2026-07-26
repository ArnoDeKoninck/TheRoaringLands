'use client'
import { useRef, useEffect, useMemo, useState } from 'react'
import { useGameStore } from '@/lib/store/game-store'
import HexTile from './HexTile'
import HexTooltip from './HexTooltip'
import MiniMap from './MiniMap'
import PlacingPill from './PlacingPill'
import { hexToPixel, gridPixelSize, colRowToKey, hexDistance } from '@/lib/hex-math'
import { placeTile } from '@/actions/map'
import type { MapTile, TileType } from '@/lib/types'

interface TooltipData { key: string; clientX: number; clientY: number }

interface Props {
  tiles: MapTile[]
  setTiles: React.Dispatch<React.SetStateAction<MapTile[]>>
  tileTypes: TileType[]
  onTileInspect: (key: string | null) => void
  inspectedKey: string | null
}

export default function HexGrid({ tiles, setTiles, tileTypes, onTileInspect, inspectedKey }: Props) {
  const role = useGameStore(s => s.role)
  const activeMap = useGameStore(s => s.activeMap)
  const selectedTileId = useGameStore(s => s.selectedTileTypeId)
  const setSelectedTileId = useGameStore(s => s.setSelectedTileTypeId)
  const zoom = useGameStore(s => s.zoom)
  const setZoom = useGameStore(s => s.setZoom)
  const pan = useGameStore(s => s.pan)
  const setPan = useGameStore(s => s.setPan)
  const isDm = role === 'dm'
  if (!activeMap) return null
  const { grid_cols: cols, grid_rows: rows, hex_radius: radius } = activeMap
  const { width: gridW, height: gridH } = gridPixelSize(cols, rows, radius)

  const tileMap = useMemo(() => new Map(tiles.map(t => [colRowToKey(t.col, t.row), t])), [tiles])
  const tileTypeMap = useMemo(() => new Map(tileTypes.map(t => [t.id, t])), [tileTypes])

  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null)

  // Drag state — all refs to avoid re-renders during drag
  const dragging = useRef(false)
  const moved = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })

  // Saves the element the pointer went down on; read in onPointerUp for click detection
  // (setPointerCapture redirects compat click events away from SVG children, so we
  //  detect clicks here instead of relying on onClick on SVG elements)
  const pointerDownTarget = useRef<Element | null>(null)

  // Double-click detection without a timer: two rapid pointer-ups on same hex
  const lastClick = useRef<{ time: number; key: string }>({ time: 0, key: '' })

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

  // --- Pointer handlers (plain functions — always use fresh closure, no stale deps) ---

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    pointerDownTarget.current = e.target as Element
    dragging.current = true
    moved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...localPan.current }
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true
    const newPan = { x: panStart.current.x + dx, y: panStart.current.y + dy }
    localPan.current = newPan
    applyTransform(newPan)
  }

  function onPointerUp() {
    if (!dragging.current) return
    dragging.current = false
    if (containerRef.current) containerRef.current.style.cursor = 'grab'
    setPan(localPan.current)

    if (moved.current) return  // was a drag, not a click

    // Identify what was clicked from the pointer-down target
    const target = pointerDownTarget.current
    if (!target) return

    const svgEl = target.closest('[data-col]')
    if (!svgEl) {
      // Background click — deselect and close tooltip
      onTileInspect(null)
      setTooltipData(null)
      lastClick.current = { time: 0, key: '' }
      return
    }

    const col = parseInt(svgEl.getAttribute('data-col')!)
    const row = parseInt(svgEl.getAttribute('data-row')!)
    const key = colRowToKey(col, row)
    const now = Date.now()

    // Double-click: two rapid clicks on the same hex within 350ms
    if (now - lastClick.current.time < 350 && lastClick.current.key === key) {
      lastClick.current = { time: 0, key: '' }
      handleHexDoubleClick(col, row)
    } else {
      lastClick.current = { time: now, key }
      handleHexClick(col, row)
    }
  }

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

  // --- Click handlers ---

  async function handleHexClick(col: number, row: number, overrideTileTypeId?: string) {
    const key = colRowToKey(col, row)
    const tileId = overrideTileTypeId ?? selectedTileId

    setTooltipData(null)

    if (tileId && isDm) {
      const result = await placeTile({ mapId: activeMap?.id ?? '', col, row, tileTypeId: tileId })
      if (result.tile) {
        setTiles(prev => {
          const next = prev.filter(t => !(t.col === col && t.row === row))
          return [...next, result.tile!]
        })
      }
      return
    }

    const existing = tileMap.get(key)
    onTileInspect(existing ? key : null)
  }

  function handleHexDoubleClick(col: number, row: number) {
    const key = colRowToKey(col, row)
    const tile = tileMap.get(key)
    if (!tile || (!isDm && !tile.revealed)) return

    const { x: hexX, y: hexY } = hexToPixel(col, row, radius)
    const hexW = radius * Math.sqrt(3)
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const clientX = rect.left + (hexX + hexW / 2) * localZoom.current + localPan.current.x
    const clientY = rect.top + hexY * localZoom.current + localPan.current.y

    setTooltipData(prev => prev?.key === key ? null : { key, clientX, clientY })
  }

  function handleDrop(e: React.DragEvent, col: number, row: number) {
    e.preventDefault()
    if (!isDm) return
    const tileId = e.dataTransfer.getData('tileTypeId')
    if (!tileId) return
    setSelectedTileId(tileId)
    handleHexClick(col, row, tileId)
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

  const tooltipTile = tooltipData ? (tileMap.get(tooltipData.key) ?? null) : null
  const tooltipType = tooltipTile ? (tileTypeMap.get(tooltipTile.tile_type_id) ?? null) : null

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
              inPlacementMode={!!selectedTileId}
              isDm={isDm}
              onDrop={e => handleDrop(e, col, row)}
              onDragOver={e => e.preventDefault()}
            />
          )
        })}
      </div>

      {tooltipData && tooltipTile && tooltipType && (
        <HexTooltip
          tile={tooltipTile}
          tileType={tooltipType}
          col={tooltipTile.col}
          row={tooltipTile.row}
          clientX={tooltipData.clientX}
          clientY={tooltipData.clientY}
          isDm={isDm}
        />
      )}

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
