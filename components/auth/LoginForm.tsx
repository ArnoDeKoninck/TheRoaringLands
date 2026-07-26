'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      setError('Enter an email to continue')
      return
    }
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError(authError.message)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        position: 'relative',
        width: '380px',
        background: 'oklch(0.19 0.014 260)',
        border: '1px solid oklch(1 0 0 / 0.08)',
        borderRadius: '14px',
        padding: '40px 36px 32px',
        boxShadow: '0 30px 60px -20px rgba(0,0,0,0.6)',
        animation: 'hf-fadein 0.4s ease both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <svg width="26" height="30" viewBox="0 0 30 34" style={{ flex: 'none' }}>
          <polygon points="15,0 30,8.5 30,25.5 15,34 0,25.5 0,8.5" fill="oklch(0.78 0.15 85)" />
        </svg>
        <div style={{ fontSize: '19px', fontWeight: 700, letterSpacing: '0.5px', color: 'oklch(0.93 0.006 260)' }}>
          HEXFORGE
        </div>
      </div>
      <div style={{ fontSize: '13px', color: 'oklch(0.6 0.02 260)', marginBottom: '30px' }}>
        Sign in to continue your civilization
      </div>

      <label style={{ display: 'block', fontSize: '12px', color: 'oklch(0.65 0.02 260)', marginBottom: '6px' }}>
        Email
      </label>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="you@example.com"
        style={{
          width: '100%',
          boxSizing: 'border-box' as const,
          background: 'oklch(0.16 0.012 260)',
          border: '1px solid oklch(1 0 0 / 0.1)',
          borderRadius: '8px',
          padding: '11px 12px',
          color: 'oklch(0.93 0.006 260)',
          fontSize: '14px',
          marginBottom: '18px',
          outline: 'none',
        }}
      />

      <label style={{ display: 'block', fontSize: '12px', color: 'oklch(0.65 0.02 260)', marginBottom: '6px' }}>
        Password
      </label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="••••••••"
        style={{
          width: '100%',
          boxSizing: 'border-box' as const,
          background: 'oklch(0.16 0.012 260)',
          border: '1px solid oklch(1 0 0 / 0.1)',
          borderRadius: '8px',
          padding: '11px 12px',
          color: 'oklch(0.93 0.006 260)',
          fontSize: '14px',
          marginBottom: '8px',
          outline: 'none',
        }}
      />

      {error && (
        <div style={{ color: 'oklch(0.7 0.15 25)', fontSize: '12px', marginBottom: '10px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 24px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: 'oklch(0.6 0.02 260)', cursor: 'pointer' }}>
          <input type="checkbox" style={{ accentColor: 'oklch(0.78 0.15 85)' }} />
          Remember me
        </label>
        <a href="#" style={{ fontSize: '12px', color: 'oklch(0.78 0.15 200)', textDecoration: 'none' }}>
          Forgot password?
        </a>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          background: 'oklch(0.78 0.15 85)',
          border: 'none',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '14px',
          fontWeight: 700,
          color: 'oklch(0.16 0.02 85)',
          cursor: loading ? 'not-allowed' : 'pointer',
          letterSpacing: '0.3px',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'ENTERING…' : 'ENTER THE REALM'}
      </button>
    </form>
  )
}
