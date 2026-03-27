import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cookies } from 'next/headers'
import NavigationShell from '@/components/NavigationShell'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Muwatta Tracking',
  description: 'Event Management System',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const isAuthenticated = cookieStore.has('admin_session')

  return (
    // Add suppressHydrationWarning here to stop browser extensions from breaking React
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <NavigationShell isAuthenticated={isAuthenticated}>
          {children}
        </NavigationShell>
        <Analytics />
      </body>
    </html>
  )
}