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
  
  const [isEventExpanded, setIsEventExpanded] = useState(true)
  const [isLuminariesExpanded, setIsLuminariesExpanded] = useState(false)
  const [isAttendeeExpanded, setIsAttendeeExpanded] = useState(true)
  const [isAdminExpanded, setIsAdminExpanded] = useState(true)
  
  const pathname = usePathname()

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
    { 
      name: 'Home', 
      href: '/',
      icon: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    },
  ]

  const eventInfoLinks = [
    { name: 'Purpose of the Majlis', href: '/info/purpose' },
    { name: 'Etiquettes & Adab', href: '/info/etiquettes' },
    { name: 'Daily Schedule', href: '/info/schedule' },
  ]

  const luminariesLinks = [
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
    { name: 'Dashboard & Stats', href: '/admin/statistics' },
    { name: 'Attendees DB', href: '/admin/attendees' },
    { name: 'Detail Approvals', href: '/admin/approvals' },
    { name: 'Attendance Approvals', href: '/admin/attendance-approvals' },
    { name: 'Ijazah List', href: '/admin/ijazah-list' },
  ]

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      '/': 'Home',
      '/info/purpose': 'Purpose of the Majlis',
      '/info/etiquettes': 'Etiquettes & Adab',
      '/info/schedule': 'Daily Schedule',
      '/info/muwatta': 'The Muwatta',
      '/info/imam-malik': 'Imam Malik',
      '/info/shaykh-yaqoubi': 'Shaykh Al-Yaqoubi',
      '/info/guidance-hub': 'Guidance Hub',
      '/attendee/check-in': 'Event Arrival',
      '/attendee/register': 'Register Attendance',
      '/attendee/my-details': 'My Details',
      '/admin/statistics': 'Dashboard & Statistics',
      '/admin/attendees': 'Attendees Database',
      '/admin/approvals': 'Detail Approvals',
      '/admin/attendance-approvals': 'Attendance Approvals',
      '/admin/ijazah-list': 'Ijazah List'
    }

    if (titles[pathname]) return titles[pathname]
    
    if (pathname.startsWith('/attendee/')) return 'Attendee Portal'
    if (pathname.startsWith('/admin/')) return 'Admin Portal'
    if (pathname.startsWith('/info/')) return 'Event Information'
    
    return 'Muwatta Event'
  }

  const renderLink = (link: { name: string, href: string, icon?: React.ReactNode }, isNested: boolean = false) => {
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
        <div className={`hidden md:flex justify-center items-center ${!isCollapsed ? 'md:hidden' : ''}`}>
          {link.icon ? link.icon : <span className="font-bold text-lg leading-none">{link.name.charAt(0)}</span>}
        </div>
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

      <aside className={`bg-brand-burgundy text-white flex flex-col fixed h-[100dvh] z-40 transition-all duration-300 ease-in-out 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 ${isCollapsed ? 'md:w-16' : 'md:w-64'} 
        w-64`}
      >
        <div 
          className={`p-6 flex items-center h-16 border-b border-brand-burgundy-dark select-none ${isCollapsed ? 'md:justify-center px-0' : ''}`}
          onDoubleClick={() => !isAuthenticated && setIsModalOpen(true)}
        >
          <h2 className={`text-xl font-bold tracking-wider overflow-hidden whitespace-nowrap text-brand-gold ${isCollapsed ? 'md:hidden' : ''}`}>
            Muwatta Recital
          </h2>
          <div className={`hidden text-brand-gold ${isCollapsed ? 'md:block' : ''}`}>
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
        
        <nav className="flex-1 px-3 mt-4 overflow-y-auto overflow-x-hidden overscroll-contain pb-20">
          
          <div className="space-y-2">
            {publicLinks.map(link => renderLink(link, false))}
          </div>

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
              className={`w-full flex items-center py-2 text-gray-300 hover:text-brand-gold transition-colors duration-200 rounded ${isCollapsed ? 'md:justify-center px-0' : 'px-4 hover:bg-brand-burgundy-dark'}`}
            >
              <div className={`hidden md:flex justify-center items-center text-brand-gold ${!isCollapsed ? 'md:hidden' : ''}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div className={`flex items-center justify-between w-full ${isCollapsed ? 'md:hidden' : ''}`}>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold">The Event</span>
                <svg className={`w-4 h-4 transition-transform duration-300 ${isEventExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isEventExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'} ${isCollapsed ? 'md:hidden' : ''}`}>
              <div className="space-y-2">
                {eventInfoLinks.map(link => renderLink(link, true))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-brand-burgundy-dark">
            <button
              onClick={() => {
                if (isCollapsed && window.innerWidth >= 768) {
                  setIsCollapsed(false)
                  setIsLuminariesExpanded(true)
                } else {
                  setIsLuminariesExpanded(!isLuminariesExpanded)
                }
              }}
              className={`w-full flex items-center py-2 text-gray-300 hover:text-brand-gold transition-colors duration-200 rounded ${isCollapsed ? 'md:justify-center px-0' : 'px-4 hover:bg-brand-burgundy-dark'}`}
            >
              <div className={`hidden md:flex justify-center items-center text-brand-gold ${!isCollapsed ? 'md:hidden' : ''}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <div className={`flex items-center justify-between w-full ${isCollapsed ? 'md:hidden' : ''}`}>
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-gold">Texts & Luminaries</span>
                <svg className={`w-4 h-4 transition-transform duration-300 ${isLuminariesExpanded ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </button>

            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isLuminariesExpanded ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'} ${isCollapsed ? 'md:hidden' : ''}`}>
              <div className="space-y-2">
                {luminariesLinks.map(link => renderLink(link, true))}
              </div>
            </div>
          </div>

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
              className={`w-full flex items-center py-2 text-gray-300 hover:text-brand-gold transition-colors duration-200 rounded ${isCollapsed ? 'md:justify-center px-0' : 'px-4 hover:bg-brand-burgundy-dark'}`}
            >
              <div className={`hidden md:flex justify-center items-center text-brand-gold ${!isCollapsed ? 'md:hidden' : ''}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
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
                className={`w-full flex items-center py-2 text-gray-300 hover:text-brand-gold transition-colors duration-200 rounded ${isCollapsed ? 'md:justify-center px-0' : 'px-4 hover:bg-brand-burgundy-dark'}`}
              >
                <div className={`hidden md:flex justify-center items-center text-brand-gold ${!isCollapsed ? 'md:hidden' : ''}`}>
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </div>
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

        <div className="p-4 border-t border-brand-burgundy-dark hidden md:block bg-brand-burgundy mt-auto">
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

      {/* ========================================== */}
      {/* UPDATED: flex-1 handling for sticky        */}
      {/* ========================================== */}
      <div className={`flex flex-col min-h-screen w-full transition-all duration-300 ease-in-out ${isCollapsed ? 'md:pl-16' : 'md:pl-64'}`}>
        
        <header className="w-full bg-white shadow-sm h-16 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50 border-b border-gray-100">
          
          <div className="flex items-center flex-1">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="text-brand-burgundy hover:text-brand-burgundy-dark focus:outline-none p-2 -ml-2 md:hidden"
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            {/* Mobile Title */}
            <h1 
              className="ml-2 font-black text-brand-burgundy text-xl select-none md:hidden leading-tight"
              onDoubleClick={() => !isAuthenticated && setIsModalOpen(true)}
            >
              {getPageTitle()}
            </h1>
            
            {/* Desktop Title */}
            <h1 className="hidden md:block font-black text-brand-burgundy text-2xl tracking-tight select-none">
              {getPageTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <div className="w-8"></div> 
            ) : (
              <form action={logoutAction}>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded font-medium hover:bg-gray-200 transition text-sm md:text-base shadow-sm border border-gray-200"
                >
                  Log Out
                </button>
              </form>
            )}
          </div>
        </header>

        {/* Removed overflow-x-hidden here as it breaks sticky */}
        <main className="flex-1 w-full">
          {children}
        </main>
      </div>

      {isModalOpen && !isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border-2 border-brand-burgundy">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-brand-burgundy text-brand-gold">
              <h2 className="text-xl font-bold">Admin Sign In</h2>
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