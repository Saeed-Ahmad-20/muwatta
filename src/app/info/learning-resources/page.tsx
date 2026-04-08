'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'  // ← add useRouter
import { loginAction, logoutAction } from '@/app/actions'

// ==========================================
// 🚫 DISABLED ROUTES
//    These features are not yet available.
//    Users navigating here directly will be
//    redirected to the home page.
// ==========================================
const DISABLED_ROUTES = [
  '/info/schedule',
  '/info/learning-resources',
  '/attendee/check-in',
  '/attendee/ijazah-collection',
] as const
// ==========================================

// ==========================================
// 🔒 CLIENT-SIDE BRUTE FORCE UX
//    Convenience layer only — real enforcement
//    is server-side in actions.ts
// ==========================================
const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION_MS = 300000
const ATTEMPT_DELAY_MS = 1000
// ==========================================

export default function NavigationShell({
  isAuthenticated,
  children
}: {
  isAuthenticated: boolean
  children: React.ReactNode
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [isEventExpanded, setIsEventExpanded] = useState(true)
  const [isLuminariesExpanded, setIsLuminariesExpanded] = useState(true)
  const [isAttendeeExpanded, setIsAttendeeExpanded] = useState(true)
  const [isAdminExpanded, setIsAdminExpanded] = useState(true)

  const [failedAttempts, setFailedAttempts] = useState(0)
  const [lockedUntil, setLockedUntil] = useState<number | null>(null)
  const [lockCountdown, setLockCountdown] = useState(0)
  const [isBlockedRoute, setIsBlockedRoute] = useState(false) // ← NEW

  const pathname = usePathname()
  const router = useRouter()  // ← NEW
  const lastTitleTapRef = useRef(0)
  const formRef = useRef<HTMLFormElement>(null)

  // 🚫 REDIRECT GUARD: Block disabled routes
  useEffect(() => {
    const normalizedPath = pathname.replace(/\/+$/, '') // strip trailing slashes
    if (DISABLED_ROUTES.some(route => normalizedPath === route || normalizedPath.startsWith(route + '/'))) {
      setIsBlockedRoute(true)
      router.replace('/')
    } else {
      setIsBlockedRoute(false)
    }
  }, [pathname, router])

  // ... (all your existing useEffects remain unchanged)

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
    }
  }, [isMobileMenuOpen])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('admin_login_lockout')
      if (stored) {
        const { until, attempts } = JSON.parse(stored)
        if (until && Date.now() < until) {
          setLockedUntil(until)
          setFailedAttempts(attempts || MAX_ATTEMPTS)
        } else {
          localStorage.removeItem('admin_login_lockout')
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  useEffect(() => {
    if (!lockedUntil) {
      setLockCountdown(0)
      return
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000))
      setLockCountdown(remaining)
      if (remaining <= 0) {
        setLockedUntil(null)
        setFailedAttempts(0)
        localStorage.removeItem('admin_login_lockout')
      }
    }
    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [lockedUntil])

  // ... (all your existing handlers remain unchanged)

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      '/': 'Home',
      '/info/announcements': 'Announcements',
      '/info/purpose': 'Purpose of the Majlis',
      '/info/etiquettes': 'Etiquettes & Adab',
      // REMOVED - disabled routes should not have title mappings
      '/info/muwatta': 'The Muwatta',
      '/info/imam-malik': 'Imam Malik',
      '/info/shaykh-yaqoubi': 'Shaykh Al-Yaqoubi',
      '/info/guidance-hub': 'Guidance Hub',
      '/attendee/register': 'Register Attendance',
      '/attendee/my-details': 'My Details',
      '/attendee/fawaat': 'Fawaat Noticeboard',
      '/admin/attendees': 'Attendees Database',
      '/admin/statistics': 'Dashboard & Stats',
      '/admin/approvals': 'Detail Approvals',
      '/admin/attendance-approvals': 'Attendance Approvals',
      '/admin/ijazah-list': 'Ijazah List',
      '/admin/manual-register': 'Manual Registration',
      '/admin/table-creator': 'Table Creator',
      '/admin/announcements': 'Manage Announcements',
      '/admin/ijazah-station': 'Ijazah Distribution',
    }

    if (titles[pathname]) return titles[pathname]
    if (pathname.startsWith('/attendee/')) return 'Attendee Portal'
    if (pathname.startsWith('/admin/')) return 'Admin Portal'
    if (pathname.startsWith('/info/')) return 'Event Information'
    return 'Muwatta Event'
  }

  // 🚫 While redirecting from a blocked route, show nothing (or a loading state)
  if (isBlockedRoute) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-400 text-sm">Redirecting...</p>
      </div>
    )
  }

  // ... rest of your return JSX is completely unchanged
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ... everything else stays the same ... */}
    </div>
  )
}