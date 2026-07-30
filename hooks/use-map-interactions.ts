import { useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '@/lib/store/game-store'
import { colRowToKey, hexToPixel } from '@/lib/hex-math'
import { placeTile } from '@/actions/map'
import type { PaintPreview } from '@/lib/store/game-store'

export function getHexKeyFromElement(el: Element): string | null {
  const svgEl = el.closest('[data-col]')
  if (!svgEl) return null
  const col = svgEl.getAttribute('data-col')
  const row = svgEl.getAttribute('data-row')
  if (col === null || row === null) return null
  return colRowToKey(parseInt(col), parseInt(row))
}

interface Options {
  containerRef: React.RefObject<HTMLDivElement | null>
  localPan: React.MutableRefObject<{ x: number; y: number }>
  localZoom: React.MutableRefObject<number>
  applyTransform: (pan?: { x: number; y: number }, zoom?: number) => void
}

export function useMapInteractions({ containerRef, localPan, localZoom, applyTransform }: Options) {
  const selectHex = useGameStore(s => s.selectHex)
  const paintSelect = useGameStore(s => s.paintSelect)
  const clearSelection = useGameStore(s => s.clearSelection)
  const setInspectedKey = useGameStore(s => s.setInspectedKey)
  const setContextMenu = useGameStore(s => s.setContextMenu)
  const setTiles = useGameStore(s => s.setTiles)
  const setPan = useGameStore(s => s.setPan)
  const setZoom = useGameStore(s => s.setZoom)
  const activeMap = useGameStore(s => s.activeMap)
  const role = useGameStore(s => s.role)
  const selectedTileTypeId = useGameStore(s => s.selectedTileTypeId)
  const selectedLayerId = useGameStore(s => s.selectedLayerId)
  const selectedRegionId = useGameStore(s => s.selectedRegionId)
  const layerRegions = useGameStore(s => s.layerRegions)
  const upsertHexLayerAssignment = useGameStore(s => s.upsertHexLayerAssignment)
  const upsertBatchHexLayerAssignments = useGameStore(s => s.upsertBatchHexLayerAssignments)
  const setPaintPreview = useGameStore(s => s.setPaintPreview)
  const markDirty = useGameStore(s => s.markDirty)

  const isDm = role === 'dm'

  const dragging = useRef(false)
  const moved = useRef(false)
  const isMiddleMouse = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })
  const pointerDownTarget = useRef<Element | null>(null)
  const lastClick = useRef<{ time: number; key: string }>({ time: 0, key: '' })
  const shiftHeld = useRef(false)
  const lastPaintedKey = useRef<string | null>(null)
  const pendingBrushHexes = useRef<{ col: number; row: number }[]>([])
  const pendingBrushKeys = useRef<Set<string>>(new Set())
  const pendingBrushPreview = useRef<PaintPreview['hexes']>([])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Shift') shiftHeld.current = true
      if (e.key === 'Escape') { clearSelection(); setContextMenu(null) }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === 'Shift') shiftHeld.current = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [clearSelection, setContextMenu])

  function doPaintHex(col: number, row: number) {
    if (!isDm || !activeMap || !selectedLayerId || !selectedRegionId) return
    upsertHexLayerAssignment({ map_id: activeMap.id, layer_id: selectedLayerId, col, row, region_id: selectedRegionId })
    markDirty()
  }

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button === 1) {
      isMiddleMouse.current = true
      dragging.current = true
      moved.current = false
      dragStart.current = { x: e.clientX, y: e.clientY }
      panStart.current = { ...localPan.current }
      if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
      ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
      e.preventDefault()
      return
    }
    if (e.button === 2) {
      if (selectedRegionId) {
        // Pan with right-click while in paint mode
        isMiddleMouse.current = true
        dragging.current = true
        moved.current = false
        dragStart.current = { x: e.clientX, y: e.clientY }
        panStart.current = { ...localPan.current }
        if (containerRef.current) containerRef.current.style.cursor = 'grabbing'
        ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
        e.preventDefault()
      }
      return
    }
    isMiddleMouse.current = false
    pointerDownTarget.current = e.target as Element
    dragging.current = true
    moved.current = false
    lastPaintedKey.current = null
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...localPan.current }
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
  }, [containerRef, localPan, selectedRegionId])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true

    if (isMiddleMouse.current || (moved.current && !shiftHeld.current && !selectedRegionId)) {
      const newPan = { x: panStart.current.x + dx, y: panStart.current.y + dy }
      localPan.current = newPan
      applyTransform(newPan)
    }

    if (shiftHeld.current && !isMiddleMouse.current && !selectedRegionId) {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (el) {
        const key = getHexKeyFromElement(el)
        if (key) paintSelect(key)
      }
    }

    // Layer paint brush: shift+drag — accumulate into pending batch, show preview overlay
    if (shiftHeld.current && !isMiddleMouse.current && selectedRegionId && moved.current) {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (el) {
        const key = getHexKeyFromElement(el)
        if (key && !pendingBrushKeys.current.has(key)) {
          lastPaintedKey.current = key
          const [colStr, rowStr] = key.split(',')
          const col = parseInt(colStr)
          const row = parseInt(rowStr)
          pendingBrushKeys.current.add(key)
          pendingBrushHexes.current.push({ col, row })
          const radius = activeMap?.hex_radius ?? 48
          const pos = hexToPixel(col, row, radius)
          pendingBrushPreview.current.push({ key, x: pos.x, y: pos.y })
          const region = layerRegions.find(r => r.id === selectedRegionId)
          if (region) {
            setPaintPreview({ color: region.color, hexes: pendingBrushPreview.current.slice() })
          }
        }
      }
    }
  }, [localPan, applyTransform, paintSelect, selectedRegionId, layerRegions, setPaintPreview, activeMap])

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    dragging.current = false
    const wasMid = isMiddleMouse.current
    isMiddleMouse.current = false
    if (containerRef.current) containerRef.current.style.cursor = 'crosshair'
    setPan(localPan.current)

    // Flush batched brush stroke
    if (pendingBrushHexes.current.length > 0 && selectedLayerId && selectedRegionId && activeMap && isDm) {
      const hexes = pendingBrushHexes.current.slice()
      pendingBrushHexes.current.length = 0
      pendingBrushKeys.current.clear()
      pendingBrushPreview.current.length = 0
      const entries = hexes.map(({ col, row }) => ({
        map_id: activeMap.id, layer_id: selectedLayerId, col, row, region_id: selectedRegionId,
      }))
      upsertBatchHexLayerAssignments(entries)
      setPaintPreview(null)
      markDirty()
    }

    if (wasMid || moved.current) return

    const target = pointerDownTarget.current
    if (!target) return

    const key = getHexKeyFromElement(target)
    if (!key) {
      clearSelection()
      setInspectedKey(null)
      lastClick.current = { time: 0, key: '' }
      return
    }

    const [colStr, rowStr] = key.split(',')
    const col = parseInt(colStr)
    const row = parseInt(rowStr)
    const ctrl = e.ctrlKey || e.metaKey

    const now = Date.now()
    if (now - lastClick.current.time < 350 && lastClick.current.key === key && !ctrl) {
      lastClick.current = { time: 0, key: '' }
      setInspectedKey(key)
      return
    }
    lastClick.current = { time: now, key }

    // Layer paint click (takes priority over tile placement when active)
    if (selectedRegionId && selectedLayerId && isDm && activeMap) {
      doPaintHex(col, row)
      return
    }

    if (selectedTileTypeId && isDm && activeMap) {
      placeTile({ mapId: activeMap.id, col, row, tileTypeId: selectedTileTypeId }).then(result => {
        if (result.tile) {
          setTiles(prev => [...prev.filter(t => !(t.col === col && t.row === row)), result.tile!])
        }
      })
      return
    }

    selectHex(key, ctrl)
  }, [containerRef, localPan, setPan, clearSelection, setInspectedKey, selectHex, selectedTileTypeId, selectedRegionId, selectedLayerId, isDm, activeMap, setTiles, upsertHexLayerAssignment, upsertBatchHexLayerAssignments, setPaintPreview, markDirty])

  const onContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (selectedRegionId) return  // right-click pans in paint mode; no context menu
    const target = e.target as Element
    const key = getHexKeyFromElement(target)
    if (!key) { setContextMenu(null); return }
    const [colStr, rowStr] = key.split(',')
    setContextMenu({ col: parseInt(colStr), row: parseInt(rowStr), clientX: e.clientX, clientY: e.clientY })
  }, [setContextMenu, selectedRegionId])

  const onWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const newZoom = Math.min(2.5, Math.max(0.4, localZoom.current + (e.deltaY > 0 ? -0.1 : 0.1)))
    localZoom.current = newZoom
    applyTransform(localPan.current, newZoom)
    setZoom(newZoom)
  }, [localZoom, localPan, applyTransform, setZoom])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [onWheel, containerRef])

  return { onPointerDown, onPointerMove, onPointerUp, onContextMenu }
}
