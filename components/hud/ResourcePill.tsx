import { RESOURCE_ICON_MAP } from '@/lib/hex-icons'

interface Props {
  code: string
  color: string
  amount: number
}

export default function ResourcePill({ code, color, amount }: Props) {
  const iconPath = RESOURCE_ICON_MAP[code]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
      {iconPath ? (
        <img
          src={iconPath}
          width={22}
          height={22}
          style={{ flex: 'none', borderRadius: '4px' }}
          alt={code}
        />
      ) : (
        <div style={{
          width: '20px',
          height: '20px',
          borderRadius: '5px',
          background: color,
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 700,
          fontFamily: 'ui-monospace, monospace',
          color: 'oklch(0.14 0.02 260)',
        }}>
          {code}
        </div>
      )}
      <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'ui-monospace, monospace', color: 'oklch(0.88 0.006 260)' }}>
        {amount}
      </div>
    </div>
  )
}
