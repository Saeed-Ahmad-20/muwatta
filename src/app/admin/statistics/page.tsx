'use client'

import { useState, useEffect } from 'react'

type StatsData = {
  totalAttendees: number
  arrivedAttendees: number
  countriesCount: number
  citiesCount: number
  overallSplits: Record<string, number>
  countryBreakdown: Record<string, number> // <-- Add to type
  attendanceBreakdown: Record<string, { 
    am: number, 
    pm: number, 
    totalUnique: number, 
    splits: Record<string, number> 
  }>
}

const EVENT_DATES = [
  { id: '2026-04-04', label: 'Day 1 (Apr 4)' },
  { id: '2026-04-05', label: 'Day 2 (Apr 5)' },
  { id: '2026-04-06', label: 'Day 3 (Apr 6)' },
  { id: '2026-04-07', label: 'Day 4 (Apr 7)' },
]

export default function InsightsDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  
  // NEW: State for the modal
  const [showCountriesModal, setShowCountriesModal] = useState(false)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/statistics')
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error)
      setStats(result.stats)
    } catch (err: any) {
      setError(err.message || "Failed to fetch stats")
    } finally {
      setLoading(false)
    }
  }

  if (loading && !stats) {
    return (
      <div className="p-8 flex justify-center items-center h-full min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-burgundy rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-xl border border-red-200 shadow-sm">
          <h2 className="text-xl font-bold mb-2">Failed to load Dashboard</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  // Overall Percentages
  const malePct = stats.totalAttendees ? Math.round((stats.overallSplits['Male'] / stats.totalAttendees) * 100) : 0
  const femalePct = stats.totalAttendees ? Math.round((stats.overallSplits['Female'] / stats.totalAttendees) * 100) : 0
  const mbPct = stats.totalAttendees ? Math.round((stats.overallSplits['Mother & Baby'] / stats.totalAttendees) * 100) : 0
  const arrivalPercentage = stats.totalAttendees ? Math.round((stats.arrivedAttendees / stats.totalAttendees) * 100) : 0

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
      
      <div className="text-center md:text-left flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-brand-burgundy mb-2 uppercase tracking-wide">Event Insights</h1>
          <p className="text-gray-600 font-medium flex items-center justify-center md:justify-start">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            Live operational & demographic statistics
          </p>
        </div>
      </div>

      {/* TOP ROW: HYBRID METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        <div className="bg-brand-burgundy p-6 rounded-2xl shadow-md text-brand-gold flex flex-col justify-center items-center text-center">
          <span className="text-5xl font-black mb-2">{stats.totalAttendees.toLocaleString()}</span>
          <span className="text-sm font-bold uppercase tracking-widest text-brand-gold-light">Total Registered</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-brand-burgundy/10 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
          {arrivalPercentage === 100 && <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>}
          <span className="text-5xl font-black text-brand-burgundy mb-2">{stats.arrivedAttendees.toLocaleString()}</span>
          <span className="text-sm font-bold uppercase tracking-widest text-gray-500">On-Site Arrivals</span>
        </div>

        {/* CLICKABLE COUNTRIES CARD */}
        <div 
          onClick={() => setShowCountriesModal(true)}
          className="bg-white p-6 rounded-2xl border-2 border-brand-burgundy/10 shadow-sm flex flex-col justify-center items-center text-center cursor-pointer hover:border-brand-burgundy/30 hover:bg-brand-burgundy/5 transition-all group"
        >
          <span className="text-5xl font-black text-brand-burgundy mb-2 group-hover:scale-105 transition-transform">{stats.countriesCount}</span>
          <span className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-1">Countries</span>
          <span className="text-[10px] text-brand-burgundy font-bold bg-brand-burgundy/10 px-2 py-0.5 rounded-full opacity-70 group-hover:opacity-100 transition-opacity">Tap to view</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border-2 border-brand-burgundy/10 shadow-sm flex flex-col justify-center items-center text-center">
          <span className="text-5xl font-black text-brand-burgundy mb-2">{stats.citiesCount}</span>
          <span className="text-sm font-bold uppercase tracking-widest text-gray-500">Unique Cities</span>
        </div>

      </div>

      {/* OVERALL DEMOGRAPHIC SPLIT */}
      <div className="bg-white rounded-2xl border-2 border-brand-burgundy/10 shadow-sm p-6 md:p-8">
        <h2 className="text-xl font-bold text-brand-burgundy mb-6 flex items-center">
          <svg className="w-6 h-6 mr-2 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          Overall Attendee Demographics
        </h2>
        
        <div className="w-full h-8 flex rounded-full overflow-hidden shadow-inner mb-8">
          <div className="bg-blue-500 h-full transition-all duration-1000 flex items-center justify-center text-xs font-bold text-white" style={{ width: `${malePct}%` }}>{malePct > 5 ? `${malePct}%` : ''}</div>
          <div className="bg-pink-500 h-full transition-all duration-1000 flex items-center justify-center text-xs font-bold text-white" style={{ width: `${femalePct}%` }}>{femalePct > 5 ? `${femalePct}%` : ''}</div>
          <div className="bg-purple-500 h-full transition-all duration-1000 flex items-center justify-center text-xs font-bold text-white" style={{ width: `${mbPct}%` }}>{mbPct > 5 ? `${mbPct}%` : ''}</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col border-l-4 border-blue-500 pl-4">
            <span className="text-sm font-bold text-gray-500 uppercase">Brothers</span>
            <span className="text-3xl font-black text-gray-900">{stats.overallSplits['Male'].toLocaleString()}</span>
          </div>
          <div className="flex flex-col border-l-4 border-pink-500 pl-4">
            <span className="text-sm font-bold text-gray-500 uppercase">Sisters</span>
            <span className="text-3xl font-black text-gray-900">{stats.overallSplits['Female'].toLocaleString()}</span>
          </div>
          <div className="flex flex-col border-l-4 border-purple-500 pl-4">
            <span className="text-sm font-bold text-gray-500 uppercase">Mothers & Babies</span>
            <span className="text-3xl font-black text-gray-900">{stats.overallSplits['Mother & Baby'].toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* BOTTOM ROW: INTERACTIVE SESSION ATTENDANCE */}
      <div className="bg-white rounded-xl border border-brand-burgundy shadow-sm overflow-hidden">
        <div className="bg-brand-burgundy p-6 text-brand-gold flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Session Attendance Logs
          </h2>
          <span className="text-sm font-medium bg-brand-burgundy-dark px-3 py-1 rounded-full hidden md:block">Click a day to view splits</span>
        </div>
        
        <div className="p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {EVENT_DATES.map((date) => {
              const dayStats = stats.attendanceBreakdown[date.id] || { am: 0, pm: 0, totalUnique: 0, splits: {} }
              const amPercentage = stats.totalAttendees > 0 ? Math.round((dayStats.am / stats.totalAttendees) * 100) : 0
              const pmPercentage = stats.totalAttendees > 0 ? Math.round((dayStats.pm / stats.totalAttendees) * 100) : 0
              
              const isSelected = selectedDay === date.id

              return (
                <div 
                  key={date.id} 
                  onClick={() => setSelectedDay(isSelected ? null : date.id)}
                  className={`rounded-lg p-5 flex flex-col transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-white border-2 border-brand-burgundy shadow-md ring-1 ring-brand-burgundy' 
                      : 'bg-gray-50 border border-gray-200 hover:border-brand-burgundy/50 hover:bg-white'
                  }`}
                >
                  <h3 className="font-bold text-brand-burgundy mb-4 text-center border-b border-gray-200 pb-2">{date.label}</h3>
                  
                  <div className="space-y-6 flex-1 flex flex-col justify-center">
                    
                    {/* AM Block */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">AM Session</span>
                        <span className="text-sm font-black text-gray-900">{dayStats.am.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-brand-burgundy h-2.5 rounded-full" style={{ width: `${amPercentage}%` }}></div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold block mt-1 text-right">{amPercentage}% of Capacity</span>
                    </div>

                    {/* PM Block */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">PM Session</span>
                        <span className="text-sm font-black text-gray-900">{dayStats.pm.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-brand-gold h-2.5 rounded-full" style={{ width: `${pmPercentage}%` }}></div>
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold block mt-1 text-right">{pmPercentage}% of Capacity</span>
                    </div>

                    {/* EXPANDING SPLIT BLOCK */}
                    {isSelected && (
                      <div className="mt-4 pt-4 border-t border-gray-200 animate-in fade-in slide-in-from-top-2">
                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 text-center">Daily Admission Split</h4>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-gray-700">Brothers</span>
                            <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded border border-blue-100">{dayStats.splits['Male'] || 0}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-gray-700">Sisters</span>
                            <span className="bg-pink-50 text-pink-700 font-bold px-2 py-0.5 rounded border border-pink-100">{dayStats.splits['Female'] || 0}</span>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-gray-700">Mother & Baby</span>
                            <span className="bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-100">{dayStats.splits['Mother & Baby'] || 0}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 text-center">
                          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Attendees: {dayStats.totalUnique}</span>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* COUNTRIES BREAKDOWN MODAL */}
      {showCountriesModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setShowCountriesModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden animate-in fade-in zoom-in duration-200 border-2 border-brand-burgundy flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-brand-burgundy-dark flex justify-between items-center sticky top-0 bg-brand-burgundy text-brand-gold z-10 shadow-sm">
              <h2 className="text-xl font-bold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Country Breakdown
              </h2>
              <button 
                onClick={() => setShowCountriesModal(false)}
                className="text-brand-gold hover:text-white text-3xl leading-none bg-brand-burgundy-dark hover:bg-brand-burgundy h-8 w-8 rounded-full flex items-center justify-center transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              <table className="w-full text-left border-collapse">
                <tbody>
                  {Object.entries(stats.countryBreakdown || {})
                    .sort((a, b) => b[1] - a[1]) // Sorts highest count to lowest
                    .map(([country, count], idx) => (
                      <tr key={country} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4 text-sm font-bold text-gray-700 flex items-center">
                          <span className="w-6 text-gray-400 text-xs font-medium">{idx + 1}.</span>
                          {country}
                        </td>
                        <td className="py-3 px-4 text-sm font-black text-brand-burgundy text-right">
                          {count.toLocaleString()}
                        </td>
                      </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>
      )}

    </div>
  )
}