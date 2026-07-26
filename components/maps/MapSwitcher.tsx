'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGameStore } from '@/lib/store/game-store'
import CreateMapModal from './CreateMapModal'
import { deleteMap } from '@/actions/map'
import type { GameMap } from '@/lib/types'

export default function MapSwitcher() {
  const router = useRouter()
  const maps = useGameStore(s => s.maps)
  const activeMap = useGameStore(s => s.activeMap)
  const setActiveMap = useGameStore(s => s.setActiveMap)
  const removeMap = useGameStore(s => s.removeMap)
  const role = useGameStore(s => s.role)
  const [showCreate, setShowCreate] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const isDm = role === 'dm'

  if (!isDm && maps.length <= 1) return null

  function handleMapChange(mapId: string) {
    const m = maps.find((m: GameMap) => m.id === mapId)
    if (m) {
      setActiveMap(m)
      router.push(`/?mapId=${mapId}`)
    }
  }

  function handleCreated(map: GameMap) {
    setActiveMap(map)
    router.push(`/?mapId=${map.id}`)
    setShowCreate(false)
  }

  async function handleDelete() {
    if (!activeMap) return
    if (!window.confirm(`Delete "${activeMap.name}"? This cannot be undone.`)) return
    setDeleting(true)
    const result = await deleteMap({ mapId: activeMap.id })
    setDeleting(false)
    if (result.error) { alert(result.error); return }
    removeMap(activeMap.id)
    const next = maps.find(m => m.id !== activeMap.id)
    if (next) { setActiveMap(next); router.push(`/?mapId=${next.id}`) }
    else router.push('/')
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
          value={activeMap?.id ?? ''}
          onChange={e => handleMapChange(e.target.value)}
          style={selectStyle}
        >
          {Array.from(
            maps.reduce((acc, m) => {
              const group = m.campaign ?? 'Maps'
              if (!acc.has(group)) acc.set(group, [])
              acc.get(group)!.push(m)
              return acc
            }, new Map<string, GameMap[]>())
          ).map(([campaign, groupMaps]) => (
            <optgroup key={campaign} label={campaign}>
              {groupMaps.map((m: GameMap) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {isDm && (
          <>
            <button
              onClick={() => setShowCreate(true)}
              title="Create map"
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
                lineHeight: '1',
              }}
            >
              +
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting || maps.length <= 1}
              title="Delete active map"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid oklch(1 0 0 / 0.1)',
                background: 'oklch(0.22 0.015 260)',
                color: maps.length <= 1 ? 'oklch(0.3 0.01 260)' : 'oklch(0.65 0.15 25)',
                fontSize: '14px',
                cursor: maps.length <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </>
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
