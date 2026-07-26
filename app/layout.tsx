import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Hexforge',
  description: 'The Roaring Lands campaign map',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
