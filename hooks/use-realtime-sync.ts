'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/store/game-store'
import type { MapTile } from '@/lib/types'

export function useRealtimeSync() {
  const activeMap = useGameStore(s => s.activeMap)
  const setTiles = useGameStore(s => s.setTiles)

  useEffect(() => {
    if (!activeMap) return
    const supabase = createClient()
    const channel = supabase
      .channel(`map_tiles:${activeMap.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'map_tiles', filter: `map_id=eq.${activeMap.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const tile = payload.new as MapTile
            setTiles(prev => [...prev.filter(t => t.id !== tile.id), tile])
          } else if (payload.eventType === 'DELETE') {
            const id = (payload.old as { id: string }).id
            setTiles(prev => prev.filter(t => t.id !== id))
          }
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeMap?.id, setTiles])
}
