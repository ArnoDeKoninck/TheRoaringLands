'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useGameStore } from '@/lib/store/game-store'
import type { MapTile, HexLayerData } from '@/lib/types'

export function useRealtimeSync() {
  const activeMap = useGameStore(s => s.activeMap)
  const setTiles = useGameStore(s => s.setTiles)
  const upsertHexLayerAssignment = useGameStore(s => s.upsertHexLayerAssignment)
  const removeHexLayerAssignment = useGameStore(s => s.removeHexLayerAssignment)

  useEffect(() => {
    if (!activeMap) return
    const supabase = createClient()

    const tilesChannel = supabase
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

    const layerChannel = supabase
      .channel(`hex_layer_data:${activeMap.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hex_layer_data', filter: `map_id=eq.${activeMap.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            upsertHexLayerAssignment(payload.new as HexLayerData)
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { layer_id: string; col: number; row: number }
            removeHexLayerAssignment({ layer_id: old.layer_id, col: old.col, row: old.row })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(tilesChannel)
      supabase.removeChannel(layerChannel)
    }
  }, [activeMap?.id, setTiles, upsertHexLayerAssignment, removeHexLayerAssignment])
}
