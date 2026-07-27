'use client'
import { useState, useMemo } from 'react'
import { useGameStore } from '@/lib/store/game-store'
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

const CATEGORY_ORDER = ['Terrain', 'Settlements', 'Encounters', 'Military', 'Production', 'Economy', 'Knowledge']

interface Props {
  tileTypes: TileType[]
  catalogueEntries: CatalogueEntry[]
}

export default function CataloguePanel({ tileTypes, catalogueEntries }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('tiles')
  const [entries, setEntries] = useState<CatalogueEntry[]>(catalogueEntries)
  const [openDrawers, setOpenDrawers] = useState<Set<string>>(() => new Set(CATEGORY_ORDER))
  const role = useGameStore(s => s.role)
  const isDm = role === 'dm'

  const recipes    = entries.filter(e => e.type === 'recipe')
  const structures = entries.filter(e => e.type === 'structure')

  const grouped = useMemo(() => {
    const map = new Map<string, TileType[]>()
    for (const t of tileTypes) {
      const cat = t.category ?? 'Terrain'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(t)
    }
    // Sort categories by CATEGORY_ORDER, unknown categories at end
    return [...map.entries()].sort(([a], [b]) => {
      const ai = CATEGORY_ORDER.indexOf(a)
      const bi = CATEGORY_ORDER.indexOf(b)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
  }, [tileTypes])

  function toggleDrawer(cat: string) {
    setOpenDrawers(prev => {
      const next = new Set(prev)
      next.has(cat) ? next.delete(cat) : next.add(cat)
      return next
    })
  }

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
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 10px 16px' }}>

        {/* ── Tiles tab with category drawers ── */}
        {activeTab === 'tiles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {grouped.map(([cat, tiles]) => {
              const isOpen = openDrawers.has(cat)
              return (
                <div key={cat}>
                  <button
                    onClick={() => toggleDrawer(cat)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 10px',
                      marginBottom: isOpen ? '6px' : 0,
                      background: 'oklch(0.215 0.015 260)',
                      border: '1px solid oklch(1 0 0 / 0.1)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: 'oklch(0.72 0.02 260)',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    <span>{cat}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: 'oklch(0.45 0.01 260)', fontWeight: 400, fontSize: '10px' }}>
                        {tiles.length}
                      </span>
                      <span style={{
                        fontSize: '8px',
                        display: 'inline-block',
                        transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.15s',
                        color: 'oklch(0.5 0.01 260)',
                      }}>
                        ▼
                      </span>
                    </span>
                  </button>

                  {isOpen && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingBottom: '4px' }}>
                      {tiles.map(t => <TileCard key={t.id} tile={t} isDm={isDm} />)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── Recipes tab ── */}
        {activeTab === 'recipes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recipes.length > 0
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
              : emptyMsg('No recipes unlocked yet')}
          </div>
        )}

        {/* ── Resources tab ── */}
        {activeTab === 'resources' && emptyMsg('Resource details coming soon')}

        {/* ── Buildings tab ── */}
        {activeTab === 'buildings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {structures.length > 0
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
              : emptyMsg('No buildings unlocked yet')}
          </div>
        )}
      </div>
    </div>
  )
}
