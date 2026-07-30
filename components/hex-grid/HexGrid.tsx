'use client'
import { useRef, useEffect, useMemo, useState } from 'react'
import { useGameStore } from '@/lib/store/game-store'
import HexTile, { type LayerOverlay, type BorderLine } from './HexTile'
import HexTooltip from './HexTooltip'
import HexContextMenu from './HexContextMenu'
import MiniMap from './MiniMap'
import PlacingPill from './PlacingPill'
import PaintPreviewOverlay from './PaintPreviewOverlay'
import { hexToPixel, gridPixelSize, colRowToKey, hexDistance, neighborsOf } from '@/lib/hex-math'
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
  const mapLayers = useGameStore(s => s.mapLayers)
  const layerRegions = useGameStore(s => s.layerRegions)
  const hexLayerData = useGameStore(s => s.hexLayerData)
  const activeLayerIds = useGameStore(s => s.activeLayerIds)
  const isDm = role === 'dm'
  const cols = activeMap?.grid_cols ?? 0
  const rows = activeMap?.grid_rows ?? 0
  const radius = activeMap?.hex_radius ?? 48
  const { width: gridW, height: gridH } = gridPixelSize(cols, rows, radius)

  const tileMap = useMemo(() => new Map(tiles.map(t => [colRowToKey(t.col, t.row), t])), [tiles])
  const tileTypeMap = useMemo(() => new Map(tileTypes.map(t => [t.id, t])), [tileTypes])

  // Build region lookup: regionId → LayerRegion
  const regionMap = useMemo(() => new Map(layerRegions.map(r => [r.id, r])), [layerRegions])

  // Active layers in display order
  const activeLayers = useMemo(
    () => mapLayers.filter(l => activeLayerIds.has(l.id)).sort((a, b) => a.order_index - b.order_index),
    [mapLayers, activeLayerIds],
  )

  // Per-hex overlay + border data — recomputed when layer data changes
  const hexLayerMeta = useMemo(() => {
    const out = new Map<string, { overlays: LayerOverlay[]; borderLines: BorderLine[] }>()

    for (const layer of activeLayers) {
      const layerData = hexLayerData.get(layer.id)
      if (!layerData) continue

      for (const [key, regionId] of layerData) {
        if (!regionId) continue
        const region = regionMap.get(regionId)
        if (!region) continue

        if (!out.has(key)) out.set(key, { overlays: [], borderLines: [] })
        const meta = out.get(key)!

        meta.overlays.push({ color: region.color, opacity: region.opacity })

        // Compute border lines: check 6 neighbors
        const [colStr, rowStr] = key.split(',')
        const col = parseInt(colStr)
        const row = parseInt(rowStr)
        const neighbors = neighborsOf(col, row)
        neighbors.forEach(([nc, nr], neighborIdx) => {
          const nKey = colRowToKey(nc, nr)
          const nRegionId = layerData.get(nKey) ?? null
          // Border when neighbor has a different region (including no region)
          if (nRegionId !== regionId) {
            meta.borderLines.push({ neighborIdx, color: region.color })
          }
        })
      }
    }

    return out
  }, [activeLayers, hexLayerData, regionMap])

  const [tooltipPos, setTooltipPos] = useState<{ clientX: number; clientY: number } | null>(null)
  const [dragOverKey, setDragOverKey] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const gridDivRef = useRef<HTMLDivElement>(null)
  const localPan = useRef(pan)
  const localZoom = useRef(zoom)

  function applyTransform(p = localPan.current, z = localZoom.current) {
    if (gridDivRef.current) {
      gridDivRef.current.style.transform = `translate(${p.x}px, ${p.y}px) scale(${z})`
    }
  }

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

  if (!activeMap) return (
    <div style={{ flex: 1, background: 'oklch(0.115 0.01 260)' }} />
  )

  function handleDrop(e: React.DragEvent, col: number, row: number) {
    e.preventDefault()
    setDragOverKey(null)
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

  function handleContainerDragLeave(e: React.DragEvent) {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setDragOverKey(null)
    }
  }

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
      onDragLeave={handleContainerDragLeave}
    >

      <div
        ref={(el) => {
          gridDivRef.current = el
          if (el) el.style.transform = `translate(${localPan.current.x}px, ${localPan.current.y}px) scale(${localZoom.current})`
        }}
        style={{ position: 'absolute', left: 0, top: 0, width: gridW, height: gridH, transformOrigin: '0 0' }}
      >
        {hexes.map(({ col, row, key }) => {
          const { x, y } = hexToPixel(col, row, radius)
          const tile = tileMap.get(key) ?? null
          const tileType = tile ? (tileTypeMap.get(tile.tile_type_id) ?? null) : null
          const meta = hexLayerMeta.get(key)
          return (
            <HexTile
              key={key}
              x={x} y={y} col={col} row={row} radius={radius}
              tileType={tileType}
              revealed={tile?.revealed ?? false}
              isInspected={key === inspectedKey}
              isSelected={selectedKeys.has(key)}
              inPlacementMode={!!selectedTileId}
              isDm={isDm}
              layerOverlays={meta?.overlays ?? []}
              borderLines={meta?.borderLines ?? []}
              isDragOver={dragOverKey === key}
              dragPreviewColor={dragOverKey === key ? (tileTypeMap.get(selectedTileId ?? '')?.color ?? null) : null}
              onDrop={e => handleDrop(e, col, row)}
              onDragOver={e => e.preventDefault()}
              onDragEnter={() => setDragOverKey(key)}
            />
          )
        })}
        <PaintPreviewOverlay />
      </div>

      {inspectedKey && tooltipPos && (() => {
        const tile = tileMap.get(inspectedKey) ?? null
        const type = tile ? (tileTypeMap.get(tile.tile_type_id) ?? null) : null
        if (!tile || !type) return null
        return (
          <HexTooltip
            tile={tile} tileType={type}
            col={tile.col} row={tile.row}
            clientX={tooltipPos.clientX} clientY={tooltipPos.clientY}
            isDm={isDm}
          />
        )
      })()}

      <HexContextMenu />

      <MiniMap
        activeMap={activeMap} tiles={tiles} tileTypeMap={tileTypeMap}
        pan={pan} zoom={zoom} containerRef={containerRef} onPanTo={setPan} isDm={isDm}
      />

      <PlacingPill tileTypes={tileTypes} />
    </div>
  )
}
