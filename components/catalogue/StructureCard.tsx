import type { CatalogueEntry } from '@/lib/types'

const TAG_COLORS: Record<string, string> = {
  Core:     'oklch(0.78 0.15 85)',
  Economy:  'oklch(0.78 0.15 145)',
  Military: 'oklch(0.75 0.15 25)',
  Unit:     'oklch(0.78 0.15 200)',
}

interface Props {
  entry: CatalogueEntry
}

export default function StructureCard({ entry }: Props) {
  const tagColor = entry.tag ? TAG_COLORS[entry.tag] : null
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '10px',
      borderRadius: '10px',
      border: '1px solid oklch(1 0 0 / 0.08)',
      background: 'oklch(0.22 0.015 260)',
    }}>
      <div style={{
        width: '34px',
        height: '34px',
        borderRadius: '8px',
        background: 'oklch(0.26 0.015 260)',
        flex: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '11px',
        fontWeight: 700,
        fontFamily: 'ui-monospace, monospace',
        color: 'oklch(0.6 0.02 260)',
      }}>
        BL
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: 'oklch(0.93 0.006 260)' }}>
            {entry.name}
          </div>
          {tagColor && (
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '100px',
              background: `${tagColor}22`,
              color: tagColor,
            }}>
              {entry.tag}
            </span>
          )}
        </div>
        {entry.description && (
          <div style={{ fontSize: '11.5px', color: 'oklch(0.6 0.02 260)', marginTop: '2px' }}>
            {entry.description}
          </div>
        )}
      </div>
    </div>
  )
}
