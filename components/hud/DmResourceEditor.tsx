'use client'
import { useState } from 'react'
import { RESOURCE_CONFIG, type PartyResources, type ResourceKey } from '@/lib/types'
import { updateResources } from '@/actions/resources'

interface Props {
  resources: PartyResources
  mapId: string
}

export default function DmResourceEditor({ resources, mapId }: Props) {
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<ResourceKey, number>>({
    gold:  resources.gold,
    wood:  resources.wood,
    stone: resources.stone,
    food:  resources.food,
    iron:  resources.iron,
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    await updateResources(mapId, values)
    setSaving(false)
    setOpen(false)
  }

  const inputStyle: React.CSSProperties = {
    flex: 1,
    background: 'oklch(0.16 0.012 260)',
    border: '1px solid oklch(1 0 0 / 0.1)',
    borderRadius: '8px',
    padding: '6px 10px',
    color: 'oklch(0.93 0.006 260)',
    fontSize: '14px',
    outline: 'none',
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Edit resources (DM)"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'oklch(0.55 0.02 260)',
          cursor: 'pointer',
          fontSize: '14px',
          padding: '2px 4px',
          lineHeight: 1,
        }}
      >
        ✎
      </button>

      {open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: '288px',
            borderRadius: '12px',
            border: '1px solid oklch(1 0 0 / 0.08)',
            padding: '24px',
            background: 'oklch(0.22 0.015 260)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'oklch(0.93 0.006 260)', marginBottom: '16px' }}>
              Edit Resources
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {RESOURCE_CONFIG.map(r => (
                <div key={r.key} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: r.color,
                    flex: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 700,
                    fontFamily: 'ui-monospace, monospace',
                    color: 'oklch(0.14 0.02 260)',
                  }}>
                    {r.code}
                  </div>
                  <input
                    type="number"
                    min="0"
                    value={values[r.key]}
                    onChange={e => setValues(prev => ({ ...prev, [r.key]: Number(e.target.value) }))}
                    style={inputStyle}
                  />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setOpen(false)}
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
                onClick={save}
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
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
