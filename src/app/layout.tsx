import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cookies } from 'next/headers'
import NavigationShell from '@/components/NavigationShell'
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Muwatta Hadith Recital 2026',
  description: 'Join us for a monumental 4-day Majlis reading the entire Al-Muwatta of Imam Malik with Shaykh Muhammad Al-Yaqoubi at Ashton Central Mosque.',
  
  // ==========================================
  // ADDED: EXPLICIT ICON CONFIGURATION
  // Make sure icon.png and apple-icon.png are inside your public/ folder
  // ==========================================
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },

  // OPEN GRAPH META TAGS (For WhatsApp, iMessage, Facebook, LinkedIn)
  openGraph: {
    title: 'Muwatta Hadith Recital 2026',
    description: 'Join us for a monumental 4-day Majlis reading the entire Al-Muwatta of Imam Malik with Shaykh Muhammad Al-Yaqoubi.',
    url: 'https://muwatta.co.uk/', 
    siteName: 'Muwatta Recital',
    images: [
      {
        url: '/images/muwatta-recital.png', // Path to the image file in your public folder
        width: 1200,
        height: 630,
        alt: 'Muwatta Hadith Recital 2026 Event Banner',
      },
    ],
    locale: 'en_GB',
    type: 'website',
  },
  
  // TWITTER META TAGS (For Twitter/X specifically)
  twitter: {
    card: 'summary_large_image',
    title: 'Muwatta Hadith Recital 2026',
    description: 'Join us for a monumental 4-day Majlis reading the entire Al-Muwatta of Imam Malik.',
    images: ['/images/muwatta-recital.png'], // Same image path
  },
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
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}