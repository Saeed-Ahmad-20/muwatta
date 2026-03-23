'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
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
  const [isAdminExpanded, setIsAdminExpanded] = useState(true)
  
  const pathname = usePathname()
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const res = await loginAction(formData)
    
    if (res.success) {
      setIsModalOpen(false)
      router.push('/admin/attendees')
      router.refresh()
    } else {
      setError(res.error || 'Login failed')
      setLoading(false)
    }
  }

  // Added "Register Attendance" below Home
  const publicLinks = [
    { name: 'Home', href: '/' },
    { name: 'Register Attendance', href: '/register' },
  ]

  const adminLinks = [
    { name: 'Attendees', href: '/admin/attendees' },
  ]

  const renderLink = (link: { name: string, href: string }, isNested: boolean = false) => {
    const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
    
    return (
      <Link 
        key={link.name} 
        href={link.href}
        title={isCollapsed ? link.name : ''} 
        className={`flex items-center py-3 rounded transition-colors duration-200 
          ${isActive ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'} 
          ${isCollapsed ? 'justify-center px-0' : (isNested ? 'pl-8 pr-4' : 'px-4')}
        `}
      >
        {isCollapsed ? (
          <span className="font-bold text-lg leading-none">{link.name.charAt(0)}</span>
        ) : (
          <span className="whitespace-nowrap text-sm font-medium">{link.name}</span>
        )}
      </Link>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      <aside className={`bg-black text-white flex flex-col fixed h-full z-20 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'}`}>
        
        <div className={`p-6 flex items-center h-20 ${isCollapsed ? 'justify-center px-0' : ''}`}>
          <h2 className="text-xl font-bold tracking-wider overflow-hidden whitespace-nowrap">
            {isCollapsed ? 'M' : 'Muwatta'}
          </h2>
        </div>
        
        <nav className="flex-1 px-3 mt-4 overflow-y-auto overflow-x-hidden">
          <div className="space-y-2">
            {publicLinks.map(link => renderLink(link, false))}
          </div>

          {isAuthenticated && (
            <div className="mt-6 pt-4 border-t border-gray-800">
              <button
                onClick={() => {
                  if (isCollapsed) {
                    setIsCollapsed(false)
                    setIsAdminExpanded(true)
                  } else {
                    setIsAdminExpanded(!isAdminExpanded)
                  }
                }}
                className={`w-full flex items-center py-2 text-gray-400 hover:text-white transition-colors duration-200 rounded ${isCollapsed ? 'justify-center px-0' : 'px-4 justify-between hover:bg-gray-900'}`}
                title={isCollapsed ? "Admin Tools" : ""}
              >
                {isCollapsed ? (
                  <span className="font-bold text-lg leading-none">A</span>
                ) : (
                  <>
                    <span className="text-xs font-semibold uppercase tracking-wider">Admin Tools</span>
                    <svg 
                      className={`w-4 h-4 transition-transform duration-300 ${isAdminExpanded ? 'transform rotate-180' : ''}`} 
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>

              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  (isAdminExpanded && !isCollapsed) ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="space-y-2">
                  {adminLinks.map(link => renderLink(link, true))}
                </div>
              </div>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors duration-200"
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

      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'ml-16' : 'ml-64'}`}>
        <header className="w-full bg-white shadow-sm h-16 flex items-center justify-end px-8 sticky top-0 z-10">
          {!isAuthenticated ? (
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="px-4 py-2 bg-black text-white rounded font-medium hover:bg-gray-800 transition"
            >
              Admin Login
            </button>
          ) : (
            <form action={logoutAction}>
              <button 
                type="submit" 
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 transition"
              >
                Log Out
              </button>
            </form>
          )}
        </header>

        <main className="flex-1">
          {children}
        </main>
      </div>

      {isModalOpen && !isAuthenticated && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Sign In</h2>
              <button 
                onClick={() => { setIsModalOpen(false); setError(''); }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded text-sm text-center">
                  {error}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input 
                  type="text" 
                  name="username" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input 
                  type="password" 
                  name="password" 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2 px-4 bg-black text-white rounded hover:bg-gray-800 transition font-medium mt-2 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}