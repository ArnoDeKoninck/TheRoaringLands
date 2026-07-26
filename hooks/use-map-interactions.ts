import { useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '@/lib/store/game-store'
import { colRowToKey } from '@/lib/hex-math'
import { placeTile } from '@/actions/map'

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
  const tiles = useGameStore(s => s.tiles)

  const isDm = role === 'dm'

  const dragging = useRef(false)
  const moved = useRef(false)
  const isMiddleMouse = useRef(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })
  const pointerDownTarget = useRef<Element | null>(null)
  const lastClick = useRef<{ time: number; key: string }>({ time: 0, key: '' })
  const shiftHeld = useRef(false)

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
    if (e.button === 2) return
    isMiddleMouse.current = false
    pointerDownTarget.current = e.target as Element
    dragging.current = true
    moved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY }
    panStart.current = { ...localPan.current }
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
  }, [containerRef, localPan])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved.current = true

    if (isMiddleMouse.current || (moved.current && !shiftHeld.current)) {
      const newPan = { x: panStart.current.x + dx, y: panStart.current.y + dy }
      localPan.current = newPan
      applyTransform(newPan)
    }

    if (shiftHeld.current && !isMiddleMouse.current) {
      const el = document.elementFromPoint(e.clientX, e.clientY)
      if (el) {
        const key = getHexKeyFromElement(el)
        if (key) paintSelect(key)
      }
    }
  }, [localPan, applyTransform, paintSelect])

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    dragging.current = false
    const wasMid = isMiddleMouse.current
    isMiddleMouse.current = false
    if (containerRef.current) containerRef.current.style.cursor = 'crosshair'
    setPan(localPan.current)

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

    if (selectedTileTypeId && isDm && activeMap) {
      placeTile({ mapId: activeMap.id, col, row, tileTypeId: selectedTileTypeId }).then(result => {
        if (result.tile) {
          setTiles(prev => [...prev.filter(t => !(t.col === col && t.row === row)), result.tile!])
        }
      })
      return
    }

    selectHex(key, ctrl)
  }, [containerRef, localPan, setPan, clearSelection, setInspectedKey, selectHex, selectedTileTypeId, isDm, activeMap, setTiles, tiles])

  const onContextMenu = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const target = e.target as Element
    const key = getHexKeyFromElement(target)
    if (!key) { setContextMenu(null); return }
    const [colStr, rowStr] = key.split(',')
    setContextMenu({ col: parseInt(colStr), row: parseInt(rowStr), clientX: e.clientX, clientY: e.clientY })
  }, [setContextMenu])

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
