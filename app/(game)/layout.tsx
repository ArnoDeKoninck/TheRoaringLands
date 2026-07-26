import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GameProvider } from '@/components/providers/GameProvider'
import type { Profile, GameMap, Role } from '@/lib/types'

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: maps }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single<Profile>(),
    supabase.from('maps').select('*').order('created_at'),
  ])

  const role: Role = (profile?.role ?? 'player') as Role
  const mapList: GameMap[] = (maps ?? []) as GameMap[]
  const initialMap = mapList[0]

  if (!initialMap) {
    return (
      <div style={{ padding: '32px', color: 'oklch(0.6 0.02 260)', fontFamily: 'system-ui' }}>
        No maps created yet. Ask the DM to set up the database and create the first map.
      </div>
    )
  }

  return (
    <GameProvider role={role} initialMap={initialMap} maps={mapList}>
      {children}
    </GameProvider>
  )
}
