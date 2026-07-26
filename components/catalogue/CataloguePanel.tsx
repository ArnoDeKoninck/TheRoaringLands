'use client'
import { useState } from 'react'
import { useGame } from '@/components/providers/GameProvider'
import TileCard from './TileCard'
import RecipeCard from './RecipeCard'
import StructureCard from './StructureCard'
import DmEntryToggle from './DmEntryToggle'
import type { TileType, CatalogueEntry } from '@/lib/types'

type Tab = 'tiles' | 'recipes' | 'resources' | 'buildings'

const TABS: { id: Tab; label: string }[] = [
  { id: 'tiles',     label: 'Hex Tiles' },
  { id: 'recipes',   label: 'Recipes' },
  { id: 'resources', label: 'Resources' },
  { id: 'buildings', label: 'Buildings' },
]

interface Props {
  tileTypes: TileType[]
  catalogueEntries: CatalogueEntry[]
}

export default function CataloguePanel({ tileTypes, catalogueEntries }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('tiles')
  const [entries, setEntries] = useState<CatalogueEntry[]>(catalogueEntries)
  const { role } = useGame()
  const isDm = role === 'dm'

  const recipes    = entries.filter(e => e.type === 'recipe')
  const structures = entries.filter(e => e.type === 'structure')

  function handleEntryToggle(id: string, unlocked: boolean) {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, unlocked } : e))
  }

  const emptyMsg = (text: string) => (
    <div style={{ fontSize: '12px', color: 'oklch(0.45 0.01 260)', textAlign: 'center', padding: '32px 0' }}>
      {text}
    </div>
  )

  return (
    <div style={{
      width: '320px',
      display: 'flex',
      flexDirection: 'column',
      borderLeft: '1px solid oklch(1 0 0 / 0.08)',
      flex: 'none',
      overflow: 'hidden',
      background: 'oklch(0.19 0.014 260)',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid oklch(1 0 0 / 0.08)', flex: 'none' }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              padding: '12px 0',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '11.5px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: activeTab === tab.id ? 'oklch(0.93 0.006 260)' : 'oklch(0.55 0.02 260)',
              borderBottom: activeTab === tab.id ? '2px solid oklch(0.78 0.15 85)' : '2px solid transparent',
              transition: 'color 0.1s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {activeTab === 'tiles' && tileTypes.map(t => (
          <TileCard key={t.id} tile={t} isDm={isDm} />
        ))}

        {activeTab === 'recipes' && (
          recipes.length > 0
            ? recipes.map(e => (
                <div key={e.id} style={{ position: 'relative' }}>
                  <RecipeCard entry={e} />
                  {isDm && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      <DmEntryToggle
                        entryId={e.id}
                        unlocked={e.unlocked}
                        onToggle={u => handleEntryToggle(e.id, u)}
                      />
                    </div>
                  )}
                </div>
              ))
            : emptyMsg('No recipes unlocked yet')
        )}

        {activeTab === 'resources' && emptyMsg('Resource details coming soon')}

        {activeTab === 'buildings' && (
          structures.length > 0
            ? structures.map(e => (
                <div key={e.id} style={{ position: 'relative' }}>
                  <StructureCard entry={e} />
                  {isDm && (
                    <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                      <DmEntryToggle
                        entryId={e.id}
                        unlocked={e.unlocked}
                        onToggle={u => handleEntryToggle(e.id, u)}
                      />
                    </div>
                  )}
                </div>
              ))
            : emptyMsg('No buildings unlocked yet')
        )}
      </div>
    </div>
  )
}
