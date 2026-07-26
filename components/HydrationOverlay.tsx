'use client'
import { useState, useEffect } from 'react'

// Renders a full-screen cover on the server and first client paint,
// then removes itself after React hydration completes (useEffect).
// This hides the brief flash where the store is empty before hydration.
export default function HydrationOverlay() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (ready) return null
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'oklch(0.14 0.012 260)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <svg width="28" height="32" viewBox="0 0 30 34">
          <polygon points="15,0 30,8.5 30,25.5 15,34 0,25.5 0,8.5" fill="oklch(0.78 0.15 85 / 0.8)" />
        </svg>
        <div style={{
          fontFamily: 'system-ui, sans-serif',
          fontSize: '12px',
          letterSpacing: '0.08em',
          color: 'oklch(0.45 0.015 260)',
          textTransform: 'uppercase',
        }}>
          Loading
        </div>
      </div>
    </div>
  )
}
