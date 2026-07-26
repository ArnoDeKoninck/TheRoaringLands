'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { GameMap, Role } from '@/lib/types'

interface GameState {
  role: Role
  activeMap: GameMap
  maps: GameMap[]
  setActiveMap: (map: GameMap) => void
  selectedTileId: string | null
  setSelectedTileId: (id: string | null) => void
  catalogueOpen: boolean
  setCatalogueOpen: (open: boolean) => void
  zoom: number
  setZoom: (z: number) => void
  pan: { x: number; y: number }
  setPan: (p: { x: number; y: number }) => void
}

const GameContext = createContext<GameState | null>(null)

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}

interface Props {
  role: Role
  initialMap: GameMap
  maps: GameMap[]
  children: React.ReactNode
}

export function GameProvider({ role, initialMap, maps: initialMaps, children }: Props) {
  const [activeMap, setActiveMap] = useState<GameMap>(initialMap)
  const [maps] = useState<GameMap[]>(initialMaps)
  const [selectedTileId, setSelectedTileIdState] = useState<string | null>(null)
  const [catalogueOpen, setCatalogueOpen] = useState(true)
  const [zoom, setZoomState] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  const setSelectedTileId = useCallback((id: string | null) => {
    setSelectedTileIdState(id)
  }, [])

  const setZoom = useCallback((z: number) => {
    setZoomState(Math.min(2.5, Math.max(0.4, z)))
  }, [])

  return (
    <GameContext.Provider value={{
      role, activeMap, maps, setActiveMap,
      selectedTileId, setSelectedTileId,
      catalogueOpen, setCatalogueOpen,
      zoom, setZoom, pan, setPan,
    }}>
      {children}
    </GameContext.Provider>
  )
}
