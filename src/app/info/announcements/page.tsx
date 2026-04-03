'use client'

import { useState, useEffect } from 'react'

type Announcement = {
  id: number
  subject: string
  message: string
  created_at: string
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await fetch('/api/announcements')
        const result = await res.json()
        if (result.success) {
          setAnnouncements(result.data)
        }
      } catch (err) {
        console.error('Failed to load announcements')
      } finally {
        setLoading(false)
      }
    }

    fetchAnnouncements()
  }, [])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 px-4 md:px-8">
      
      <div className="max-w-3xl mx-auto mb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-brand-burgundy uppercase tracking-wider mb-3">
          Event Announcements
        </h1>
        <p className="text-gray-600 text-lg">
          Stay up to date with the latest schedules, updates, and notices for the Majlis.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-burgundy border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 p-16 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
            <p className="text-xl font-medium text-gray-700 mb-1">No Announcements Yet</p>
            <p>Check back later for updates from the organizers.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {announcements.map((announcement) => {
              const dateObj = new Date(announcement.created_at)
              return (
                <div key={announcement.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300">
                  <div className="p-6 md:p-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{announcement.subject}</h3>
                    
                    <div className="flex items-center gap-3 text-sm font-bold text-brand-burgundy/80 mb-6 uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {dateObj.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg">
                      {announcement.message}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}