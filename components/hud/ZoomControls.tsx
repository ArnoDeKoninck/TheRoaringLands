'use client'
import { useGame } from '@/components/providers/GameProvider'

export default function ZoomControls() {
  const { zoom, setZoom } = useGame()
  const btnStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    borderRadius: '7px',
    border: '1px solid oklch(1 0 0 / 0.1)',
    background: 'oklch(0.22 0.015 260)',
    color: 'oklch(0.85 0.006 260)',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{ fontSize: '12px', color: 'oklch(0.6 0.02 260)' }}>
        Zoom <span style={{ color: 'oklch(0.85 0.006 260)', fontFamily: 'ui-monospace, monospace' }}>
          {Math.round(zoom * 100)}%
        </span>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button onClick={() => setZoom(zoom - 0.15)} style={btnStyle}>−</button>
        <button onClick={() => setZoom(zoom + 0.15)} style={btnStyle}>+</button>
      </div>
    </div>
  )
}
