import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { GameMap } from '@/lib/types'

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: maps } = await supabase.from('maps').select('*').order('created_at')
  const mapList: GameMap[] = (maps ?? []) as GameMap[]

  if (mapList.length === 0) {
    return (
      <div style={{ padding: '32px', color: 'oklch(0.6 0.02 260)', fontFamily: 'system-ui' }}>
        No maps created yet. Ask the DM to set up the database and create the first map.
      </div>
    )
  }

  return <>{children}</>
}
