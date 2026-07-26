'use client'
import { createPortal } from 'react-dom'
import type { MapTile, TileType } from '@/lib/types'

interface Props {
  tile: MapTile
  tileType: TileType
  col: number
  row: number
  clientX: number
  clientY: number
  isDm: boolean
}

export default function HexTooltip({ tile, tileType, col, row, clientX, clientY, isDm }: Props) {
  const content = (
    <div
      style={{
        position: 'fixed',
        left: clientX,
        top: clientY - 10,
        transform: 'translateX(-50%) translateY(-100%)',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        background: 'oklch(0.22 0.015 260)',
        border: '1px solid oklch(1 0 0 / 0.14)',
        borderRadius: '10px',
        padding: '11px 14px',
        minWidth: '170px',
        maxWidth: '230px',
        boxShadow: '0 8px 24px oklch(0 0 0 / 0.45)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
          <div style={{
            width: '12px', height: '12px', borderRadius: '3px',
            background: tileType.color, flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '13px', fontWeight: 600,
            color: 'oklch(0.93 0.006 260)',
          }}>
            {tileType.name}
          </span>
          <span style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: '11px',
            color: 'oklch(0.45 0.015 260)',
            marginLeft: 'auto',
          }}>
            {tileType.code}
          </span>
        </div>

        {/* Description */}
        {tileType.description && (
          <p style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            color: 'oklch(0.58 0.02 260)',
            margin: '0 0 8px 0',
            lineHeight: '1.45',
          }}>
            {tileType.description}
          </p>
        )}

        {/* Produces */}
        {tileType.produces && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: 'oklch(0.78 0.15 85 / 0.12)',
            border: '1px solid oklch(0.78 0.15 85 / 0.28)',
            borderRadius: '5px',
            padding: '2px 8px',
            marginBottom: isDm ? '9px' : '0',
          }}>
            <span style={{ fontSize: '11px', color: 'oklch(0.78 0.15 85)', fontFamily: 'system-ui' }}>
              Produces {tileType.produces}
            </span>
          </div>
        )}

        {/* DM row */}
        {isDm && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            paddingTop: (tileType.description || tileType.produces) ? '8px' : '0',
            borderTop: (tileType.description || tileType.produces) ? '1px solid oklch(1 0 0 / 0.07)' : 'none',
          }}>
            <span style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: '11px', color: 'oklch(0.45 0.015 260)',
            }}>
              {col},{row}
            </span>
            <span style={{
              fontSize: '11px', fontFamily: 'system-ui',
              marginLeft: 'auto',
              color: tile.revealed ? 'oklch(0.65 0.12 145)' : 'oklch(0.55 0.02 260)',
            }}>
              {tile.revealed ? 'revealed' : 'hidden'}
            </span>
          </div>
        )}
      </div>

      {/* Arrow pointing down toward the hex */}
      <div style={{
        width: 0, height: 0,
        margin: '0 auto',
        borderLeft: '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop: '6px solid oklch(0.22 0.015 260)',
      }} />
    </div>
  )

  return createPortal(content, document.body)
}
