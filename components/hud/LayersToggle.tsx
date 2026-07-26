'use client'
import { useGameStore } from '@/lib/store/game-store'

export default function LayersToggle() {
  const layerPanelOpen = useGameStore(s => s.layerPanelOpen)
  const setLayerPanelOpen = useGameStore(s => s.setLayerPanelOpen)
  const activeLayerIds = useGameStore(s => s.activeLayerIds)
  const mapLayers = useGameStore(s => s.mapLayers)
  const hasLayers = mapLayers.length > 0

  return (
    <button
      onClick={() => setLayerPanelOpen(!layerPanelOpen)}
      style={{
        height: '32px',
        padding: '0 14px',
        borderRadius: '8px',
        border: '1px solid oklch(1 0 0 / 0.1)',
        background: layerPanelOpen ? 'oklch(0.78 0.15 200 / 0.12)' : 'transparent',
        color: layerPanelOpen ? 'oklch(0.78 0.15 200)' : 'oklch(0.9 0.006 260)',
        cursor: 'pointer',
        fontSize: '12.5px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      <span>Layers</span>
      {hasLayers && (
        <span style={{
          width: '16px', height: '16px', borderRadius: '4px',
          background: 'oklch(0.78 0.15 200 / 0.2)',
          color: 'oklch(0.78 0.15 200)',
          fontSize: '10px', fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {activeLayerIds.size}
        </span>
      )}
    </button>
  )
}
