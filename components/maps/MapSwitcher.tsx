'use client'
import { useGame } from '@/components/providers/GameProvider'
import type { GameMap } from '@/lib/types'

export default function MapSwitcher() {
  const { maps, activeMap, setActiveMap, role } = useGame()
  if (maps.length <= 1 && role !== 'dm') return null
  return (
    <select
      value={activeMap.id}
      onChange={e => {
        const m = maps.find((m: GameMap) => m.id === e.target.value)
        if (m) setActiveMap(m)
      }}
      style={{
        height: '32px',
        padding: '0 8px',
        borderRadius: '8px',
        border: '1px solid oklch(1 0 0 / 0.1)',
        background: 'oklch(0.22 0.015 260)',
        color: 'oklch(0.93 0.006 260)',
        fontSize: '12px',
        cursor: 'pointer',
      }}
    >
      {maps.map((m: GameMap) => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>
  )
}
