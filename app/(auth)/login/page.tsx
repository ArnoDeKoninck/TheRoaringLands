import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 50% 20%, oklch(0.19 0.02 260) 0%, oklch(0.12 0.01 260) 70%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.5,
          pointerEvents: 'none',
          backgroundImage: [
            'repeating-linear-gradient(120deg, transparent 0 82px, oklch(1 0 0 / 0.03) 82px 84px)',
            'repeating-linear-gradient(60deg, transparent 0 82px, oklch(1 0 0 / 0.03) 82px 84px)',
          ].join(', '),
        }}
      />
      <LoginForm />
    </div>
  )
}
