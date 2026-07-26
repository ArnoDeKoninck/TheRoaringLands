'use client'
import { createPortal } from 'react-dom'
import { useGameStore } from '@/lib/store/game-store'
import { colRowToKey } from '@/lib/hex-math'
import { revealTile } from '@/actions/map'

export default function HexContextMenu() {
  const contextMenu = useGameStore(s => s.contextMenu)
  const setContextMenu = useGameStore(s => s.setContextMenu)
  const setInspectedKey = useGameStore(s => s.setInspectedKey)
  const setTiles = useGameStore(s => s.setTiles)
  const tiles = useGameStore(s => s.tiles)
  const role = useGameStore(s => s.role)

  if (!contextMenu) return null

  const { col, row, clientX, clientY } = contextMenu
  const key = colRowToKey(col, row)
  const tile = tiles.find(t => t.col === col && t.row === row) ?? null
  const isDm = role === 'dm'

  function close() { setContextMenu(null) }

  function handleInspect() {
    setInspectedKey(key)
    close()
  }

  async function handleReveal() {
    if (!tile) return
    const result = await revealTile({ tileId: tile.id, revealed: !tile.revealed })
    if (result.tile) {
      setTiles(prev => prev.map(t => t.id === tile.id ? result.tile! : t))
    }
    close()
  }

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: clientX,
    top: clientY,
    zIndex: 9999,
    background: 'oklch(0.22 0.015 260)',
    border: '1px solid oklch(1 0 0 / 0.14)',
    borderRadius: '8px',
    padding: '4px',
    minWidth: '160px',
    boxShadow: '0 8px 24px oklch(0 0 0 / 0.45)',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '13px',
  }

  const itemStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '7px 12px',
    background: 'none',
    border: 'none',
    borderRadius: '5px',
    color: 'oklch(0.93 0.006 260)',
    cursor: 'pointer',
    textAlign: 'left',
  }

  const content = (
    <>
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
        onClick={close}
        onContextMenu={e => { e.preventDefault(); close() }}
      />
      <div style={{ ...menuStyle, zIndex: 9999 }}>
        {tile && (
          <button style={itemStyle} onClick={handleInspect}>
            Inspect
          </button>
        )}
        {isDm && tile && (
          <button style={itemStyle} onClick={handleReveal}>
            {tile.revealed ? 'Hide from players' : 'Reveal to players'}
          </button>
        )}
        {!tile && (
          <div style={{ ...itemStyle, color: 'oklch(0.45 0.015 260)', cursor: 'default' }}>
            Empty hex
          </div>
        )}
      </div>
    </>
  )

  return createPortal(content, document.body)
}
