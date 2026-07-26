import { useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/store/game-store'

const SPEED = 8

export function getPanDelta(key: string, speed: number): { dx: number; dy: number } {
  switch (key) {
    case 'ArrowLeft': case 'a': return { dx: speed, dy: 0 }
    case 'ArrowRight': case 'd': return { dx: -speed, dy: 0 }
    case 'ArrowUp': case 'w': return { dx: 0, dy: speed }
    case 'ArrowDown': case 's': return { dx: 0, dy: -speed }
    default: return { dx: 0, dy: 0 }
  }
}

interface Options {
  localPan: React.MutableRefObject<{ x: number; y: number }>
  applyTransform: (pan?: { x: number; y: number }) => void
}

export function useKeyboardPan({ localPan, applyTransform }: Options) {
  const setPan = useGameStore(s => s.setPan)
  const keysHeld = useRef(new Set<string>())
  const rafId = useRef<number | null>(null)

  useEffect(() => {
    const PAN_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'a', 's', 'd', 'w'])

    function tick() {
      if (keysHeld.current.size === 0) { rafId.current = null; return }
      let dx = 0; let dy = 0
      for (const key of keysHeld.current) {
        const delta = getPanDelta(key, SPEED)
        dx += delta.dx
        dy += delta.dy
      }
      const newPan = { x: localPan.current.x + dx, y: localPan.current.y + dy }
      localPan.current = newPan
      applyTransform(newPan)
      rafId.current = requestAnimationFrame(tick)
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!PAN_KEYS.has(e.key)) return
      if ((e.target as Element).tagName === 'INPUT' || (e.target as Element).tagName === 'TEXTAREA') return
      e.preventDefault()
      keysHeld.current.add(e.key)
      if (!rafId.current) rafId.current = requestAnimationFrame(tick)
    }

    function onKeyUp(e: KeyboardEvent) {
      keysHeld.current.delete(e.key)
      if (keysHeld.current.size === 0) {
        setPan(localPan.current)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      if (rafId.current) cancelAnimationFrame(rafId.current)
    }
  }, [localPan, applyTransform, setPan])
}
