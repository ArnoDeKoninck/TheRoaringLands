'use client'
import { useGameStore } from '@/lib/store/game-store'

export default function CatalogueToggle() {
  const catalogueOpen = useGameStore(s => s.catalogueOpen)
  const setCatalogueOpen = useGameStore(s => s.setCatalogueOpen)
  return (
    <button
      onClick={() => setCatalogueOpen(!catalogueOpen)}
      style={{
        height: '32px',
        padding: '0 14px',
        borderRadius: '8px',
        border: '1px solid oklch(1 0 0 / 0.1)',
        background: catalogueOpen ? 'oklch(0.78 0.15 85 / 0.12)' : 'transparent',
        color: 'oklch(0.9 0.006 260)',
        cursor: 'pointer',
        fontSize: '12.5px',
        fontWeight: 600,
      }}
    >
      Catalogue
    </button>
  )
}
