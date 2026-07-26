'use client'
import { useState } from 'react'
import { useGame } from '@/components/providers/GameProvider'
import CreateMapModal from './CreateMapModal'
import type { GameMap } from '@/lib/types'

export default function MapSwitcher() {
  const { maps: initialMaps, activeMap, setActiveMap, role } = useGame()
  const [maps, setMaps] = useState<GameMap[]>(initialMaps)
  const [showCreate, setShowCreate] = useState(false)
  const isDm = role === 'dm'

  if (!isDm && maps.length <= 1) return null

  function handleCreated(map: GameMap) {
    setMaps(prev => [...prev, map])
    setActiveMap(map)
    setShowCreate(false)
  }

  const selectStyle: React.CSSProperties = {
    height: '32px',
    padding: '0 8px',
    borderRadius: '8px',
    border: '1px solid oklch(1 0 0 / 0.1)',
    background: 'oklch(0.22 0.015 260)',
    color: 'oklch(0.93 0.006 260)',
    fontSize: '12px',
    cursor: 'pointer',
  }

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <select
          value={activeMap.id}
          onChange={e => {
            const m = maps.find((m: GameMap) => m.id === e.target.value)
            if (m) setActiveMap(m)
          }}
          style={selectStyle}
        >
          {maps.map((m: GameMap) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        {isDm && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid oklch(1 0 0 / 0.1)',
              background: 'oklch(0.22 0.015 260)',
              color: 'oklch(0.6 0.02 260)',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
            }}
          >
            +
          </button>
        )}
      </div>
      {showCreate && (
        <CreateMapModal
          onCreated={handleCreated}
          onClose={() => setShowCreate(false)}
        />
      )}
    </>
  )
}
