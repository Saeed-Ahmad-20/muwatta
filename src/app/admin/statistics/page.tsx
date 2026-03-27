'use client'

import { useState, useEffect, useRef } from 'react'
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-50m.json"

const MICRO_STATES: Record<string, [number, number]> = {
  'Singapore': [103.8198, 1.3521],
  'Isle of Man': [-4.4799, 54.2361],
  'Luxembourg': [6.1296, 49.8153]
}

type StatsData = {
  totalAttendees: number
  arrivedAttendees: number
  countriesCount: number
  citiesCount: number
  overallSplits: Record<string, number>
  countryBreakdown: Record<string, number> 
  cityBreakdown: Record<string, number> 
  countryCityBreakdown: Record<string, Record<string, number>>
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

// ==========================================
// THE INTERACTIVE 2D WORLD MAP
// ==========================================
function WorldMap({ 
  countryBreakdown, 
  countryCityBreakdown 
}: { 
  countryBreakdown: Record<string, number>
  countryCityBreakdown: Record<string, Record<string, number>>
}) {
  // Map State for Panning (X, Y) and Zoom (Scale)
  const [center, setCenter] = useState<[number, number]>([0, 20])
  const [scale, setScale] = useState(130) // Base scale for Mercator
  
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState([0, 0])
  const [tooltip, setTooltip] = useState({ show: false, content: '', x: 0, y: 0 })
  
  const [selectedCountryInfo, setSelectedCountryInfo] = useState<{name: string, count: number, cities: Record<string, number>} | null>(null)

  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (countryBreakdown && Object.keys(countryBreakdown).length > 0) {
      console.log(`🌍 Map plotting complete! Rendered attendance data for ${Object.keys(countryBreakdown).length} countries.`)
    }
  }, [countryBreakdown])

  // Scroll lock for zoom
  useEffect(() => {
    const element = mapContainerRef.current
    if (!element) return

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault() 
      // Zoom limits for Mercator projection
      setScale(prev => Math.min(Math.max(prev - e.deltaY * 0.5, 100), 800))
    }

    element.addEventListener('wheel', handleNativeWheel, { passive: false })
    return () => element.removeEventListener('wheel', handleNativeWheel)
  }, [])

  // --- PANNING LOGIC ---
  const handleDrag = (clientX: number, clientY: number) => {
    if (isDragging) {
      const dx = clientX - dragStart[0]
      const dy = clientY - dragStart[1]
      
      // Calculate how much to pan based on the current zoom scale
      const panFactor = 100 / scale
      setCenter(prev => [
        Math.max(-180, Math.min(180, prev[0] - dx * panFactor)),
        Math.max(-80, Math.min(80, prev[1] + dy * panFactor))
      ])
      
      setDragStart([clientX, clientY])
      setTooltip(prev => ({ ...prev, show: false }))
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart([e.clientX, e.clientY])
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDrag(e.clientX, e.clientY)
    if (!isDragging) {
      setTooltip(prev => ({ ...prev, x: e.clientX, y: e.clientY }))
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    setDragStart([e.touches[0].clientX, e.touches[0].clientY])
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDrag(e.touches[0].clientX, e.touches[0].clientY)
  }

  const handleInteractionEnd = () => setIsDragging(false)

  const getCountryData = (geoName: string) => {
    if (!countryBreakdown || !countryCityBreakdown) return { count: 0, cities: {} as Record<string, number> }
    const name = geoName.toLowerCase()
    let count = 0
    const cities: Record<string, number> = {}

    const addCities = (dbCountry: string) => {
      const cCities = countryCityBreakdown[dbCountry] || {}
      Object.entries(cCities).forEach(([city, cCount]) => {
        cities[city] = (cities[city] || 0) + cCount
      })
    }

    Object.entries(countryBreakdown).forEach(([dbCountry, dbCount]) => {
      const c = dbCountry.toLowerCase()
      if (name === 'united kingdom' && ['england', 'scotland', 'wales', 'northern ireland', 'isle of man', 'uk', 'united kingdom'].includes(c)) {
        count += dbCount; addCities(dbCountry)
      } 
      else if (name === 'united states of america' && ['usa', 'united states', 'us'].includes(c)) {
        count += dbCount; addCities(dbCountry)
      } 
      else if (name === 'united arab emirates' && ['uae', 'united arab emirates'].includes(c)) {
        count += dbCount; addCities(dbCountry)
      } 
      else if ((name === 'israel' || name === 'palestine') && c === 'palestine') {
        count += dbCount; addCities(dbCountry)
      }
      else if (c === name) {
        count += dbCount; addCities(dbCountry)
      }
    })
    return { count, cities }
  }

  const getColor = (count: number) => {
    if (count === 0) return "#E2E8F0" // <-- Darkened from #F3F4F6 to stand out from the ocean
    if (count <= 2) return "#eab3b3"  
    if (count <= 10) return "#c76464" 
    if (count <= 50) return "#a62d2d" 
    return "#800000"                  
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-brand-burgundy/10 shadow-sm p-6 md:p-8 relative select-none">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-brand-burgundy flex items-center">
          <svg className="w-6 h-6 mr-2 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.204 11h9.592L8 15.192V8.808L12.796 11H20.79a9.001 9.001 0 00-17.58 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Global Attendee Heatmap
        </h2>
        <div className="text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-100 hidden sm:block">
          Scroll to Zoom • Drag to Pan • Click for Details
        </div>
      </div>
      
      <div 
        ref={mapContainerRef} 
        className={`w-full h-[400px] flex justify-center items-center relative overflow-hidden rounded-xl bg-[#f8fafc] border border-gray-100 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ touchAction: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleInteractionEnd}
        onMouseLeave={() => { handleInteractionEnd(); setTooltip({ ...tooltip, show: false }); }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleInteractionEnd}
      >
        <ComposableMap 
          projection="geoMercator" // Changed to 2D Mercator
          projectionConfig={{ center: center, scale: scale }} // Uses pan center instead of rotation
          width={800} 
          height={400}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const { count, cities } = getCountryData(geo.properties.name)
                const fillColor = getColor(count)
                
                let displayName = geo.properties.name
                if (displayName.toLowerCase() === 'israel') {
                  displayName = 'Palestine'
                }

                return (
                  <Geography 
                    key={geo.rsmKey} 
                    geography={geo} 
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: { 
                        fill: fillColor, 
                        outline: "none", 
                        transition: "fill 250ms" 
                      },
                      hover: { 
                        fill: count > 0 && !isDragging ? "#D4AF37" : fillColor, 
                        outline: "none",
                        cursor: count > 0 ? "pointer" : "default"
                      }, 
                      pressed: { 
                        fill: count > 0 ? "#D4AF37" : fillColor, 
                        outline: "none" 
                      },
                    }}
                    onMouseEnter={() => {
                      if (count > 0 && !isDragging) {
                        setTooltip({ show: true, content: `${displayName}: ${count} Attendee${count > 1 ? 's' : ''}`, x: tooltip.x, y: tooltip.y })
                      }
                    }}
                    onMouseLeave={() => setTooltip({ ...tooltip, show: false })}
                    onClick={() => {
                      if (count > 0 && !isDragging) {
                        setSelectedCountryInfo({ name: displayName, count, cities })
                        setTooltip({ ...tooltip, show: false })
                      }
                    }}
                  />
                )
              })
            }
          </Geographies>

          {Object.entries(MICRO_STATES).map(([name, coords]) => {
            const { count, cities } = getCountryData(name)
            if (count === 0) return null
            const fillColor = getColor(count)

            return (
              <Marker key={name} coordinates={coords}>
                <circle 
                  r={6} 
                  fill={fillColor} 
                  stroke="#ffffff" 
                  strokeWidth={1.5}
                  style={{ cursor: "pointer", transition: "fill 250ms" }}
                  onMouseEnter={() => {
                    if (!isDragging) {
                      setTooltip({ show: true, content: `${name}: ${count} Attendee${count > 1 ? 's' : ''}`, x: tooltip.x, y: tooltip.y })
                    }
                  }}
                  onMouseLeave={() => setTooltip({ ...tooltip, show: false })}
                  onClick={() => {
                    if (!isDragging) {
                      setSelectedCountryInfo({ name, count, cities })
                      setTooltip({ ...tooltip, show: false })
                    }
                  }}
                />
              </Marker>
            )
          })}
        </ComposableMap>

        {tooltip.show && !isDragging && (
          <div 
            className="fixed bg-gray-900 text-white text-xs font-bold px-3 py-2 rounded shadow-xl pointer-events-none z-50 transition-opacity"
            style={{ top: tooltip.y - 40, left: tooltip.x + 10 }}
          >
            {tooltip.content}
          </div>
        )}
      </div>
      
      <div className="flex justify-center items-center gap-4 mt-6 text-xs font-bold text-gray-500 flex-wrap">
        {/* Updated the background color for the '0' indicator to match the map */}
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#E2E8F0] mr-2 border border-gray-300"></span>0</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#eab3b3] mr-2"></span>1 - 2</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#c76464] mr-2"></span>3 - 10</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#a62d2d] mr-2"></span>11 - 50</div>
        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-[#800000] mr-2"></span>50+</div>
      </div>

      {selectedCountryInfo && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 backdrop-blur-sm"
          onClick={() => setSelectedCountryInfo(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[70vh] overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-brand-burgundy flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-brand-burgundy flex justify-between items-center bg-brand-burgundy text-brand-gold">
              <div>
                <h2 className="text-lg font-bold leading-tight">{selectedCountryInfo.name}</h2>
                <p className="text-xs font-medium text-brand-gold-light opacity-80">{selectedCountryInfo.count} Total Attendees</p>
              </div>
              <button 
                onClick={() => setSelectedCountryInfo(null)}
                className="text-brand-gold hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-full hover:bg-brand-burgundy-dark transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              <table className="w-full text-left border-collapse">
                <tbody>
                  {Object.entries(selectedCountryInfo.cities)
                    .sort((a, b) => b[1] - a[1]) 
                    .map(([city, count], idx) => (
                      <tr key={city} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="py-2.5 px-4 text-sm font-bold text-gray-700">
                          {city}
                        </td>
                        <td className="py-2.5 px-4 text-sm font-black text-brand-burgundy text-right">
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

// ==========================================
// THE MAIN DASHBOARD PAGE
// ==========================================
export default function InsightsDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  
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

      <WorldMap 
        countryBreakdown={stats.countryBreakdown} 
        countryCityBreakdown={stats.countryCityBreakdown} 
      />

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
                    .sort((a, b) => b[1] - a[1]) 
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