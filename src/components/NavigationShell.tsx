'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { loginAction, logoutAction } from '@/app/actions'

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
  
  // Tab Expand/Collapse States
  const [isEventExpanded, setIsEventExpanded] = useState(true)
  const [isAttendeeExpanded, setIsAttendeeExpanded] = useState(true)
  const [isAdminExpanded, setIsAdminExpanded] = useState(true)
  
  const pathname = usePathname()

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const res = await loginAction(formData)
    
    if (res.success) {
      setIsModalOpen(false)
      window.location.href = '/admin/attendees'
    } else {
      setError(res.error || 'Login failed')
      setLoading(false)
    }
  }

  const publicLinks = [
    { name: 'Home', href: '/' },
  ]

  // ==========================================
  // UPDATED: THE EVENT LINKS
  // ==========================================
  const eventLinks = [
    { name: 'Event Details & Schedule', href: '/info/event-details' },
    { name: 'The Muwatta', href: '/info/muwatta' },
    { name: 'Imam Malik', href: '/info/imam-malik' },
    { name: 'Shaykh Al-Yaqoubi', href: '/info/shaykh-yaqoubi' },
    { name: 'Guidance Hub', href: '/info/guidance-hub' },
  ]

  const attendeeLinks = [
    { name: 'Event Arrival', href: '/attendee/check-in' }, 
    { name: 'Register Attendance', href: '/attendee/register' },
    { name: 'My Details', href: '/attendee/my-details' },
  ]

  const adminLinks = [
    { name: 'Attendees DB', href: '/admin/attendees' },
    { name: 'Detail Approvals', href: '/admin/approvals' },
    { name: 'Attendance Approvals', href: '/admin/attendance-approvals' },
  ]

  const renderLink = (link: { name: string, href: string }, isNested: boolean = false) => {
    const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
    
    return (
      <Link 
        key={link.name} 
        href={link.href}
        prefetch={false} 
        onClick={() => setIsMobileMenuOpen(false)}
        title={isCollapsed ? link.name : ''} 
        className={`flex items-center py-3 rounded transition-colors duration-200 
          ${isActive ? 'bg-brand-burgundy-dark text-brand-gold' : 'text-gray-300 hover:bg-brand-burgundy-dark hover:text-brand-gold'} 
          ${isCollapsed ? 'md:justify-center px-4 md:px-0' : (isNested ? 'pl-8 pr-4' : 'px-4')}
        `}
      >
        <span className={`hidden md:block font-bold text-lg leading-none ${!isCollapsed ? 'md:hidden' : ''}`}>
          {link.name.charAt(0)}
        </span>
        <span className={`whitespace-nowrap text-sm font-medium ${isCollapsed ? 'md:hidden' : ''}`}>
          {link.name}
        </span>
      </Link>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`bg-brand-burgundy text-white flex flex-col fixed h-full z-40 transition-all duration-300 ease-in-out 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 ${isCollapsed ? 'md:w-16' : 'md:w-64'} 
        w-64`}
      >
        <div className={`p-6 flex items-center h-16 border-b border-brand-burgundy-dark ${isCollapsed ? 'md:justify-center px-4 md:px-0' : ''}`}>
          <h2 className={`text-xl font-bold tracking-wider overflow-hidden whitespace-nowrap text-brand-gold ${isCollapsed ? 'md:hidden' : ''}`}>
            Muwatta
          </h2>
          <h2 className={`hidden font-bold tracking-wider text-brand-gold text-xl ${isCollapsed ? 'md:block' : ''}`}>
            M
          </h2>
        </div>
        
        <nav className="flex-1 px-3 mt-4 overflow-y-auto overflow-x-hidden">
          
          <div className="space-y-2">
            {publicLinks.map(link => renderLink(link, false))}
          </div>

          {/* ========================================== */}
          {/* THE EVENT TAB DROPDOWN                     */}
          {/* ========================================== */}
          <div className="mt-6 pt-4 border-t border-brand-burgundy-dark">
            <button
              onClick={() => {
                if (isCollapsed && window.innerWidth >= 768) {
                  setIsCollapsed(false)
                  setIsEventExpanded(true)
                } else {
                  setIsEventExpanded(!isEventExpanded)
                }
              }}
              className={`w-full flex items-center py-2 text-gray-300 hover:text-brand-gold transition-colors duration-200 rounded ${isCollapsed ? 'md:justify-center px-4 md:px-0' : 'px-4 hover:bg-brand-burgundy-dark'}`}
            >
              <span className={`hidden md:block font-bold text-lg leading-none text-brand-gold ${!isCollapsed ? 'md:hidden' : ''}`}>
                E
              </span>
              <div className={`flex items-center justify-between w-full ${isCollapsed ? 'md:hidden' : ''}`}>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold">The Event</span>
                <svg className={`w-4 h-4 transition-transform duration-300 ${isEventExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isEventExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'} ${isCollapsed ? 'md:hidden' : ''}`}>
              <div className="space-y-2">
                {eventLinks.map(link => renderLink(link, true))}
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* ATTENDEE TAB DROPDOWN                      */}
          {/* ========================================== */}
          <div className="mt-4 pt-4 border-t border-brand-burgundy-dark">
            <button
              onClick={() => {
                if (isCollapsed && window.innerWidth >= 768) {
                  setIsCollapsed(false)
                  setIsAttendeeExpanded(true)
                } else {
                  setIsAttendeeExpanded(!isAttendeeExpanded)
                }
              }}
              className={`w-full flex items-center py-2 text-gray-300 hover:text-brand-gold transition-colors duration-200 rounded ${isCollapsed ? 'md:justify-center px-4 md:px-0' : 'px-4 hover:bg-brand-burgundy-dark'}`}
            >
              <span className={`hidden md:block font-bold text-lg leading-none text-brand-gold ${!isCollapsed ? 'md:hidden' : ''}`}>
                U
              </span>
              <div className={`flex items-center justify-between w-full ${isCollapsed ? 'md:hidden' : ''}`}>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold">Attendee</span>
                <svg className={`w-4 h-4 transition-transform duration-300 ${isAttendeeExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isAttendeeExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'} ${isCollapsed ? 'md:hidden' : ''}`}>
              <div className="space-y-2">
                {attendeeLinks.map(link => renderLink(link, true))}
              </div>
            </div>
          </div>

          {/* ========================================== */}
          {/* ADMIN TAB DROPDOWN                         */}
          {/* ========================================== */}
          {isAuthenticated && (
            <div className="mt-4 pt-4 border-t border-brand-burgundy-dark">
              <button
                onClick={() => {
                  if (isCollapsed) {
                    setIsCollapsed(false)
                    setIsAdminExpanded(true)
                  } else {
                    setIsAdminExpanded(!isAdminExpanded)
                  }
                }}
                className={`w-full flex items-center py-2 text-gray-300 hover:text-brand-gold transition-colors duration-200 rounded ${isCollapsed ? 'md:justify-center px-4 md:px-0' : 'px-4 hover:bg-brand-burgundy-dark'}`}
              >
                <span className={`hidden md:block font-bold text-lg leading-none text-brand-gold ${!isCollapsed ? 'md:hidden' : ''}`}>
                  A
                </span>
                <div className={`flex items-center justify-between w-full ${isCollapsed ? 'md:hidden' : ''}`}>
                  <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold">Admin</span>
                  <svg className={`w-4 h-4 transition-transform duration-300 ${isAdminExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>

              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isAdminExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'} ${isCollapsed ? 'md:hidden' : ''}`}>
                <div className="space-y-2">
                  {adminLinks.map(link => renderLink(link, true))}
                </div>
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-brand-burgundy-dark hidden md:block">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 text-brand-gold hover:text-white hover:bg-brand-burgundy-dark rounded transition-colors duration-200"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <div className="flex items-center justify-between w-full px-2">
                <span className="text-sm font-medium whitespace-nowrap">Collapse Menu</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </div>
            )}
          </button>
        </div>
      </aside>

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <header className="w-full bg-white shadow-sm h-16 flex items-center justify-between md:justify-end px-4 md:px-8 sticky top-0 z-10">
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-brand-burgundy hover:text-brand-burgundy-dark focus:outline-none p-2 -ml-2"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="ml-2 font-bold text-brand-burgundy text-lg">Muwatta</h1>
          </div>

          {!isAuthenticated ? (
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="px-6 py-2 bg-brand-burgundy text-brand-gold rounded font-bold hover:bg-brand-burgundy-dark transition text-sm md:text-base"
            >
              Login
            </button>
          ) : (
            <form action={logoutAction}>
              <button 
                type="submit" 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 transition text-sm md:text-base"
              >
                Log Out
              </button>
            </form>
          )}
        </header>

        <main className="flex-1 w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {isModalOpen && !isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border-2 border-brand-burgundy">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-brand-burgundy text-brand-gold">
              <h2 className="text-xl font-bold">Sign In</h2>
              <button 
                onClick={() => { setIsModalOpen(false); setError(''); }}
                className="text-brand-gold hover:text-white text-2xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm text-center">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-1">Username</label>
                <input type="text" name="username" required className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-burgundy"/>
              </div>
              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-1">Password</label>
                <input type="password" name="password" required className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-burgundy"/>
              </div>
              <button type="submit" disabled={loading} className="w-full py-3 px-4 bg-brand-burgundy text-brand-gold rounded hover:bg-brand-burgundy-dark transition font-bold mt-2 disabled:opacity-50">
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}