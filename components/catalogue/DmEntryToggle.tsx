'use client'
import { useState } from 'react'
import { setEntryUnlocked } from '@/actions/catalogue'

interface Props {
  entryId: string
  unlocked: boolean
  onToggle: (unlocked: boolean) => void
}

export default function DmEntryToggle({ entryId, unlocked, onToggle }: Props) {
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const result = await setEntryUnlocked(entryId, !unlocked)
    setLoading(false)
    if (result.entry) onToggle(result.entry.unlocked)
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        fontSize: '10px',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: '100px',
        border: `1px solid ${unlocked ? 'oklch(0.78 0.15 145 / 0.4)' : 'oklch(0.55 0.02 260 / 0.4)'}`,
        background: unlocked ? 'oklch(0.78 0.15 145 / 0.15)' : 'oklch(0.55 0.02 260 / 0.15)',
        color: unlocked ? 'oklch(0.78 0.15 145)' : 'oklch(0.55 0.02 260)',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1,
      }}
    >
      {unlocked ? 'Unlocked' : 'Locked'}
    </button>
  )
}
