'use client'

import { useState, useEffect, useRef, useMemo } from 'react'

type IjazahRecord = {
  ID: number
  english_name: string | null
  arabic_name: string | null
  collection_station: string | null
  received: boolean
}

type StationStats = {
  total: number
  collected: number
  remaining: number
}

type Stats = {
  total: number
  collected: number
  remaining: number
  stationsAssigned: boolean
  stationCount: number
  stationStats: Record<string, StationStats>
}

export default function IjazahAdmin() {
  const [records, setRecords] = useState<IjazahRecord[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [searchValue, setSearchValue] = useState('')
  const [markLoading, setMarkLoading] = useState(false)
  const [markResult, setMarkResult] = useState<{ success: boolean; message: string; record?: IjazahRecord; alreadyCollected?: boolean; matches?: any[] } | null>(null)
  const [lastCollected, setLastCollected] = useState<IjazahRecord | null>(null)
  const [undoLoading, setUndoLoading] = useState(false)

  const [stationCount, setStationCount] = useState(4)
  const [assignLoading, setAssignLoading] = useState(false)
  const [assignResult, setAssignResult] = useState<any>(null)
  const [showAssignConfirm, setShowAssignConfirm] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [clearLoading, setClearLoading] = useState(false)

  const [tableSearch, setTableSearch] = useState('')
  const [filterStation, setFilterStation] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'collected' | 'pending'>('all')
  const [showTable, setShowTable] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // ✅ Correct API endpoint matching the route folder name
  const API_URL = '/api/admin/ijazah-station'

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    if (markResult?.success) {
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [markResult])

  const fetchData = async () => {
    setFetchError(null)
    try {
      const response = await fetch(API_URL)
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || 'Failed to fetch data')
      setRecords(Array.isArray(result.records) ? result.records : [])
      setStats(result.stats ?? null)
    } catch (error: any) {
      console.error('Failed to load ijazah data:', error)
      setFetchError(error.message || 'Failed to load data')
      setRecords([])
      setStats(null)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkReceived = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchValue.trim()) return
    setMarkLoading(true)
    setMarkResult(null)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-received', searchValue: searchValue.trim() }),
      })
      const result = await response.json()

      if (!response.ok || !result.success) {
        setMarkResult({ success: false, message: result.error || 'Failed.', alreadyCollected: result.alreadyCollected, record: result.record, matches: result.matches })
      } else {
        setMarkResult({ success: true, message: result.message, record: result.record })
        setLastCollected(result.record)
        setSearchValue('')
        setRecords(prev => prev.map(r => (r.ID === result.record.ID ? { ...r, received: true } : r)))
        setStats(prev => prev ? { ...prev, collected: prev.collected + 1, remaining: prev.remaining - 1 } : prev)
      }
    } catch (error: any) {
      setMarkResult({ success: false, message: error.message || 'Network error.' })
    } finally {
      setMarkLoading(false)
    }
  }

  const handleUndo = async () => {
    if (!lastCollected) return
    setUndoLoading(true)
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark-unreceived', id: lastCollected.ID }),
      })
      const result = await response.json()
      if (result.success) {
        setRecords(prev => prev.map(r => (r.ID === lastCollected.ID ? { ...r, received: false } : r)))
        setStats(prev => prev ? { ...prev, collected: prev.collected - 1, remaining: prev.remaining + 1 } : prev)
        setMarkResult({ success: true, message: result.message })
        setLastCollected(null)
      } else {
        setMarkResult({ success: false, message: result.error })
      }
    } catch (error: any) {
      setMarkResult({ success: false, message: error.message })
    } finally {
      setUndoLoading(false)
    }
  }

  const handleAssignStations = async () => {
    setAssignLoading(true)
    setAssignResult(null)
    setShowAssignConfirm(false)
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign-stations', stationCount }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error)
      setAssignResult(result)
      await fetchData()
    } catch (error: any) {
      setAssignResult({ success: false, error: error.message })
    } finally {
      setAssignLoading(false)
    }
  }

  const handleClearStations = async () => {
    setClearLoading(true)
    setShowClearConfirm(false)
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-stations' }),
      })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error)
      setAssignResult({ success: true, message: result.message })
      await fetchData()
    } catch (error: any) {
      setAssignResult({ success: false, error: error.message })
    } finally {
      setClearLoading(false)
    }
  }

  const filteredRecords = useMemo(() => {
    if (!Array.isArray(records)) return []
    return records.filter(r => {
      const matchesSearch = !tableSearch || r.ID.toString().includes(tableSearch) || (r.english_name && r.english_name.toLowerCase().includes(tableSearch.toLowerCase())) || (r.arabic_name && r.arabic_name.toLowerCase().includes(tableSearch.toLowerCase()))
      const matchesStation = filterStation === 'all' || r.collection_station === filterStation
      const matchesStatus = filterStatus === 'all' || (filterStatus === 'collected' && r.received) || (filterStatus === 'pending' && !r.received)
      return matchesSearch && matchesStation && matchesStatus
    })
  }, [records, tableSearch, filterStation, filterStatus])

  const stationOptions = useMemo(() => {
    if (!Array.isArray(records)) return []
    const stations = new Set(records.map(r => r.collection_station).filter(Boolean))
    return Array.from(stations).sort()
  }, [records])

  const readyCount = useMemo(() => (Array.isArray(records) ? records : []).filter(r => r.received).length, [records])
  const notReadyCount = useMemo(() => (Array.isArray(records) ? records : []).filter(r => !r.received).length, [records])
  const collectedPercentage = stats ? Math.round((stats.collected / Math.max(stats.total, 1)) * 100) : 0

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-burgundy rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-black text-brand-burgundy mb-2 uppercase tracking-wide">Ijazah Distribution</h1>
        <p className="text-gray-600 font-medium flex items-center justify-center md:justify-start">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          Mark collection, assign stations, and track progress
        </p>
      </div>

      {/* Fetch Error Banner */}
      {fetchError && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <div className="flex-1">
            <p className="font-bold text-red-800 text-sm">Failed to load data</p>
            <p className="text-red-600 text-xs">{fetchError}</p>
          </div>
          <button onClick={() => { setLoading(true); fetchData() }} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition">
            Retry
          </button>
        </div>
      )}

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-brand-burgundy p-5 rounded-2xl shadow-md text-brand-gold text-center">
            <span className="text-4xl font-black">{stats.total.toLocaleString()}</span>
            <span className="block text-sm font-bold uppercase tracking-widest text-brand-gold-light mt-1">Total Ijazahs</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-green-200 shadow-sm text-center">
            <span className="text-4xl font-black text-green-600">{readyCount.toLocaleString()}</span>
            <span className="block text-sm font-bold uppercase tracking-widest text-gray-500 mt-1">Ready (Received)</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-amber-200 shadow-sm text-center">
            <span className="text-4xl font-black text-amber-600">{notReadyCount.toLocaleString()}</span>
            <span className="block text-sm font-bold uppercase tracking-widest text-gray-500 mt-1">Not Ready</span>
          </div>
          <div className="bg-white p-5 rounded-2xl border-2 border-brand-burgundy/10 shadow-sm text-center">
            <span className="text-4xl font-black text-brand-burgundy">{collectedPercentage}%</span>
            <span className="block text-sm font-bold uppercase tracking-widest text-gray-500 mt-1">Ready Rate</span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {stats && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-600">Ijazahs Received & Ready</span>
            <span className="text-sm font-black text-brand-burgundy">{readyCount} / {stats.total}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div className="bg-green-500 h-full rounded-full transition-all duration-1000" style={{ width: `${collectedPercentage}%` }}></div>
          </div>
        </div>
      )}

      {/* ==========================================
          MARK AS RECEIVED
          ========================================== */}
      <div className="bg-white rounded-xl border-2 border-brand-burgundy shadow-sm overflow-hidden">
        <div className="bg-brand-burgundy p-5 text-brand-gold">
          <h2 className="text-xl font-bold flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mark Ijazah as Received
          </h2>
          <p className="text-sm text-brand-gold-light mt-1">Mark that a printed Ijazah has been received and is ready for collection</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleMarkReceived} className="flex gap-3">
            <div className="flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchValue}
                onChange={(e) => { setSearchValue(e.target.value); setMarkResult(null) }}
                placeholder="Enter ID number or full English name..."
                autoFocus
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:border-transparent focus:bg-white transition-all text-lg"
              />
            </div>
            <button type="submit" disabled={markLoading || !searchValue.trim()} className="px-6 py-3 bg-brand-burgundy text-brand-gold rounded-lg font-bold hover:bg-brand-burgundy-dark transition disabled:opacity-50 shadow-sm whitespace-nowrap">
              {markLoading ? <div className="w-5 h-5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div> : 'Mark Received'}
            </button>
          </form>

          {markResult && (
            <div className={`mt-4 p-4 rounded-lg border-2 animate-in fade-in slide-in-from-top-2 ${markResult.success ? 'bg-green-50 border-green-300' : markResult.alreadyCollected ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${markResult.success ? 'bg-green-100 text-green-600' : markResult.alreadyCollected ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                  {markResult.success ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : markResult.alreadyCollected ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-bold text-sm ${markResult.success ? 'text-green-800' : markResult.alreadyCollected ? 'text-yellow-800' : 'text-red-800'}`}>{markResult.message}</p>
                  {markResult.record && (
                    <div className="mt-2 text-sm space-y-1">
                      <p className="text-gray-700"><span className="font-bold">ID:</span> #{markResult.record.ID}</p>
                      <p className="text-gray-700"><span className="font-bold">Name:</span> {markResult.record.english_name}</p>
                      {markResult.record.arabic_name && <p className="text-gray-700 text-lg font-bold" dir="rtl">{markResult.record.arabic_name}</p>}
                      {markResult.record.collection_station && <p className="text-gray-700"><span className="font-bold">Station:</span> {markResult.record.collection_station}</p>}
                    </div>
                  )}
                  {markResult.matches && markResult.matches.length > 1 && (
                    <div className="mt-3 space-y-1">
                      <p className="text-xs font-bold text-gray-500 uppercase">Matching records:</p>
                      {markResult.matches.map((m: any) => (
                        <button key={m.ID} onClick={() => { setSearchValue(String(m.ID)); setMarkResult(null) }} className="block w-full text-left p-2 bg-white rounded border border-gray-200 hover:border-brand-burgundy hover:bg-brand-burgundy/5 transition-colors text-sm">
                          <span className="font-bold text-brand-burgundy">#{m.ID}</span> — {m.english_name}
                          {m.arabic_name && <span className="text-gray-400 ml-2" dir="rtl">{m.arabic_name}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {markResult.success && lastCollected && (
                <div className="mt-3 pt-3 border-t border-green-200 flex justify-end">
                  <button onClick={handleUndo} disabled={undoLoading} className="text-sm font-bold text-green-700 hover:text-red-600 transition-colors flex items-center gap-1 disabled:opacity-50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    {undoLoading ? 'Undoing...' : 'Undo'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          STATION ASSIGNMENT
          ========================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gray-50 p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-brand-burgundy flex items-center">
            <svg className="w-6 h-6 mr-2 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Station Assignment
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Ready ijazahs are distributed across stations 1–{stationCount > 1 ? stationCount - 1 : 1}. {stationCount > 1 ? `Not-ready ijazahs go to the last station (Station ${String.fromCharCode(64 + stationCount)}).` : 'All go to Station A.'}
          </p>
        </div>

        <div className="p-6">
          {/* Current station overview */}
          {stats && stats.stationsAssigned && stats.stationStats && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Current Station Allocation</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.entries(stats.stationStats)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([station, s]) => {
                    const sortedStations = Object.keys(stats.stationStats).sort()
                    const isLastStation = station === sortedStations[sortedStations.length - 1] && sortedStations.length > 1

                    return (
                      <div key={station} className={`rounded-lg p-4 border ${isLastStation ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-brand-burgundy text-sm">{station}</h4>
                          {isLastStation && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">NOT READY</span>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-500">Total</span>
                            <span className="font-bold text-gray-800">{s.total}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-green-600">Received</span>
                            <span className="font-bold text-green-700">{s.collected}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-amber-600">Not Received</span>
                            <span className="font-bold text-amber-700">{s.remaining}</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                          <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${s.total > 0 ? (s.collected / s.total) * 100 : 0}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-bold text-brand-burgundy mb-2">Number of Stations</label>
              <div className="flex items-center gap-3">
                <input type="range" min={1} max={10} value={stationCount} onChange={(e) => setStationCount(parseInt(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-burgundy" />
                <span className="text-2xl font-black text-brand-burgundy w-10 text-center">{stationCount}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                {stationCount === 1 ? (
                  <p>All {stats?.total.toLocaleString()} ijazahs → Station A</p>
                ) : (
                  <>
                    <p>
                      <span className="text-green-600 font-bold">{readyCount} ready</span> → distributed across Stations A–{String.fromCharCode(64 + stationCount - 1)} (~{readyCount > 0 ? Math.ceil(readyCount / (stationCount - 1)) : 0} each)
                    </p>
                    <p>
                      <span className="text-amber-600 font-bold">{notReadyCount} not ready</span> → all go to Station {String.fromCharCode(64 + stationCount)}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowAssignConfirm(true)} disabled={assignLoading} className="px-5 py-3 bg-brand-burgundy text-brand-gold rounded-lg font-bold hover:bg-brand-burgundy-dark transition disabled:opacity-50 shadow-sm">
                {assignLoading ? 'Assigning...' : 'Assign Stations'}
              </button>
              {stats?.stationsAssigned && (
                <button onClick={() => setShowClearConfirm(true)} disabled={clearLoading} className="px-5 py-3 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-red-50 hover:text-red-700 transition disabled:opacity-50 border border-gray-200">
                  {clearLoading ? 'Clearing...' : 'Clear All'}
                </button>
              )}
            </div>
          </div>

          {assignResult && (
            <div className={`mt-4 p-4 rounded-lg border ${assignResult.success || assignResult.message ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <p className="font-bold text-sm">{assignResult.message || assignResult.error}</p>
              {assignResult.stationSummary && (
                <div className="mt-2 text-xs space-y-1">
                  {Object.entries(assignResult.stationSummary)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([station, info]: [string, any]) => (
                      <p key={station} className="flex items-center gap-1.5">
                        <span className="font-bold">{station}:</span>
                        {info.count > 0 ? (
                          <>
                            IDs #{info.from} – #{info.to} ({info.count} ijazahs)
                            {info.type === 'not-ready' && (
                              <span className="text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[10px] font-bold border border-amber-200 ml-1">NOT READY</span>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400">0 ijazahs</span>
                        )}
                      </p>
                    ))}
                </div>
              )}
              {assignResult.lastStation && (
                <p className="mt-2 text-xs text-amber-700 font-medium border-t border-green-200 pt-2">
                  ⚠️ Attendees whose ijazah is not ready will be directed to <strong>{assignResult.lastStation}</strong> on the public page.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==========================================
          FULL TABLE
          ========================================== */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <button onClick={() => setShowTable(!showTable)} className="w-full p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
          <h2 className="text-xl font-bold text-brand-burgundy flex items-center">
            <svg className="w-6 h-6 mr-2 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            Full Record Table
          </h2>
          <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showTable ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>

        {showTable && (
          <div className="border-t border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" value={tableSearch} onChange={(e) => setTableSearch(e.target.value)} placeholder="Search ID, name, or Arabic name..." className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy text-sm" />
              </div>
              <select value={filterStation} onChange={(e) => setFilterStation(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy text-sm font-medium cursor-pointer">
                <option value="all">All Stations</option>
                {stationOptions.map(s => <option key={s} value={s!}>{s}</option>)}
              </select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy text-sm font-medium cursor-pointer">
                <option value="all">All Status</option>
                <option value="collected">Received</option>
                <option value="pending">Not Received</option>
              </select>
              <div className="text-sm font-bold text-gray-500 flex items-center whitespace-nowrap">{filteredRecords.length} records</div>
            </div>

            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-brand-burgundy sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-brand-gold uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-brand-gold uppercase tracking-wider">English Name</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-brand-gold uppercase tracking-wider">Arabic Name</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-brand-gold uppercase tracking-wider">Station</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-brand-gold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.ID} className={`hover:bg-gray-50 transition-colors ${record.received ? 'bg-green-50/30' : ''}`}>
                      <td className="px-4 py-3 text-sm font-bold text-brand-burgundy">#{record.ID}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{record.english_name || '-'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right" dir="rtl">{record.arabic_name || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        {record.collection_station ? <span className="text-xs font-bold bg-brand-burgundy/10 text-brand-burgundy px-2.5 py-1 rounded-full">{record.collection_station}</span> : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {record.received ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            Received
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Not Ready
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredRecords.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500 text-sm">No records match your filters.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modals */}
      {showAssignConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowAssignConfirm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border-2 border-brand-burgundy animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Assign {stationCount} Station{stationCount > 1 ? 's' : ''}?</h3>
              <div className="text-sm text-gray-500 mt-2 space-y-1">
                {stats?.stationsAssigned && <p className="text-red-600 font-bold">⚠️ This will overwrite all existing station assignments.</p>}
                {stationCount === 1 ? (
                  <p>All {stats?.total.toLocaleString()} ijazahs will be assigned to Station A.</p>
                ) : (
                  <>
                    <p><strong className="text-green-700">{readyCount} ready</strong> ijazahs → evenly across Stations A–{String.fromCharCode(64 + stationCount - 1)}</p>
                    <p><strong className="text-amber-700">{notReadyCount} not ready</strong> ijazahs → Station {String.fromCharCode(64 + stationCount)} (queries desk)</p>
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAssignConfirm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleAssignStations} className="flex-1 py-2.5 bg-brand-burgundy text-brand-gold rounded-lg font-bold hover:bg-brand-burgundy-dark transition">Confirm</button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setShowClearConfirm(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 border-2 border-red-300 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">Clear All Stations?</h3>
              <p className="text-sm text-gray-500 mt-2">This will remove all station assignments. Received status will <strong>not</strong> be affected.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)} className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition">Cancel</button>
              <button onClick={handleClearStations} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition">Clear All Stations</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}