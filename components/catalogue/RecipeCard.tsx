import type { CatalogueEntry } from '@/lib/types'
import { RESOURCE_CONFIG } from '@/lib/types'

interface Props {
  entry: CatalogueEntry
}

export default function RecipeCard({ entry }: Props) {
  const ingredients = entry.metadata?.ingredients ?? []
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
        RC
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: 'oklch(0.93 0.006 260)' }}>
          {entry.name}
        </div>
        {entry.description && (
          <div style={{ fontSize: '11.5px', color: 'oklch(0.6 0.02 260)' }}>{entry.description}</div>
        )}
        {ingredients.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            {ingredients.map((ing, i) => {
              const res = RESOURCE_CONFIG.find(r => r.key === ing.resource)
              return (
                <span key={i} style={{
                  fontSize: '10.5px',
                  fontFamily: 'ui-monospace, monospace',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: `${res?.color ?? 'oklch(0.3 0 0)'}22`,
                  color: res?.color ?? 'oklch(0.7 0 0)',
                }}>
                  {ing.amount}× {res?.code ?? ing.resource.toUpperCase()}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
