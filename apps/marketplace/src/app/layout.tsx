import type { Metadata, Viewport } from 'next'
import { Geist_Mono } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Providers } from '@/components/providers'
import './globals.css'

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: {
    default: 'AgentBay — AI assistants for everything',
    template: '%s | AgentBay',
  },
  description: 'Discover and use AI assistants built by creators worldwide.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
        ? process.env.NEXT_PUBLIC_APP_URL
        : `https://${process.env.NEXT_PUBLIC_APP_URL}`
      : 'http://localhost:3000'
  ),
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistMono.variable} antialiased`}>
        <Providers>
          <TooltipProvider>{children}</TooltipProvider>
        </Providers>
      </body>
    </html>
  )
}
