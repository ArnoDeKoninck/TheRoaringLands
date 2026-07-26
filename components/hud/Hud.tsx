import ResourcePill from './ResourcePill'
import ZoomControls from './ZoomControls'
import CatalogueToggle from './CatalogueToggle'
import MapSwitcher from '@/components/maps/MapSwitcher'
import DmResourceEditor from './DmResourceEditor'
import { RESOURCE_CONFIG, type PartyResources } from '@/lib/types'

interface Props {
  resources: PartyResources
  mapId: string
  isDm: boolean
}

export default function Hud({ resources, mapId, isDm }: Props) {
  return (
    <div style={{
      height: '56px',
      flex: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '22px',
      padding: '0 20px',
      background: 'oklch(0.17 0.013 260)',
      borderBottom: '1px solid oklch(1 0 0 / 0.08)',
      zIndex: 5,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '6px' }}>
        <svg width="18" height="21" viewBox="0 0 30 34" style={{ flex: 'none' }}>
          <polygon points="15,0 30,8.5 30,25.5 15,34 0,25.5 0,8.5" fill="oklch(0.78 0.15 85)" />
        </svg>
        <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.4px', color: 'oklch(0.93 0.006 260)' }}>
          HEXFORGE
        </div>
      </div>
      <div style={{ width: '1px', height: '26px', background: 'oklch(1 0 0 / 0.08)' }} />

      {/* Resources */}
      {RESOURCE_CONFIG.map(r => (
        <ResourcePill
          key={r.key}
          code={r.code}
          color={r.color}
          amount={resources[r.key as keyof PartyResources] as number}
        />
      ))}
      {isDm && <DmResourceEditor resources={resources} mapId={mapId} />}

      <div style={{ flex: 1 }} />
      <MapSwitcher />
      <ZoomControls />
      <div style={{ width: '1px', height: '26px', background: 'oklch(1 0 0 / 0.08)' }} />
      <CatalogueToggle />
      {/* Avatar placeholder */}
      <div style={{
        width: '30px',
        height: '30px',
        borderRadius: '50%',
        background: 'oklch(0.3 0.02 260)',
        border: '1px solid oklch(1 0 0 / 0.1)',
      }} />
    </div>
  )
}
