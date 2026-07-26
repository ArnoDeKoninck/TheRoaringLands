'use client'
import { useState } from 'react'
import { createMap } from '@/actions/map'
import type { GameMap } from '@/lib/types'

interface Props {
  onCreated: (map: GameMap) => void
  onClose: () => void
}

export default function CreateMapModal({ onCreated, onClose }: Props) {
  const [name, setName] = useState('')
  const [type, setType] = useState<'world' | 'city' | 'base' | 'custom'>('custom')
  const [cols, setCols] = useState(20)
  const [rows, setRows] = useState(16)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Enter a map name'); return }
    setSaving(true)
    const result = await createMap({ name, type, gridCols: cols, gridRows: rows })
    setSaving(false)
    if (result.error) { setError(result.error); return }
    if (result.map) onCreated(result.map)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'oklch(0.16 0.012 260)',
    border: '1px solid oklch(1 0 0 / 0.1)',
    borderRadius: '8px',
    padding: '6px 10px',
    color: 'oklch(0.93 0.006 260)',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    }}>
      <form
        onSubmit={submit}
        style={{
          width: '320px',
          borderRadius: '12px',
          border: '1px solid oklch(1 0 0 / 0.08)',
          padding: '24px',
          background: 'oklch(0.22 0.015 260)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ fontSize: '15px', fontWeight: 700, color: 'oklch(0.93 0.006 260)', marginBottom: '16px' }}>
          Create Map
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'oklch(0.6 0.02 260)', marginBottom: '4px' }}>Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'oklch(0.6 0.02 260)', marginBottom: '4px' }}>Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as typeof type)}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="world">World</option>
              <option value="city">City</option>
              <option value="base">Base</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'oklch(0.6 0.02 260)', marginBottom: '4px' }}>Columns</label>
              <input type="number" min="5" max="100" value={cols} onChange={e => setCols(Number(e.target.value))} style={inputStyle} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'oklch(0.6 0.02 260)', marginBottom: '4px' }}>Rows</label>
              <input type="number" min="5" max="100" value={rows} onChange={e => setRows(Number(e.target.value))} style={inputStyle} />
            </div>
          </div>
        </div>
        {error && <div style={{ fontSize: '11.5px', color: 'oklch(0.7 0.15 25)', marginBottom: '12px' }}>{error}</div>}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: '8px',
              border: '1px solid oklch(1 0 0 / 0.1)',
              background: 'transparent',
              color: 'oklch(0.6 0.02 260)',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: '8px',
              border: 'none',
              background: 'oklch(0.78 0.15 85)',
              color: 'oklch(0.16 0.02 85)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </form>
    </div>
  )
}
