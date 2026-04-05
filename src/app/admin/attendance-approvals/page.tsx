'use client'

import { useEffect, useState } from 'react'

export default function AttendanceApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [bulkProcessing, setBulkProcessing] = useState(false)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/approvals/attendance-approvals')

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textStr = await response.text()
        console.error('Server returned HTML:', textStr)
        throw new Error('API Route not found or returned an HTML page. Check the console for details.')
      }

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch requests')
      }

      setRequests(result.data || [])
    } catch (error: any) {
      console.error(error)
      alert('Error loading queue: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // ─── Selection helpers ───────────────────────────────
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === requests.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(requests.map(r => r.id)))
    }
  }

  const isAllSelected = requests.length > 0 && selectedIds.size === requests.length

  // ─── Bulk action ─────────────────────────────────────
  const handleBulkAction = async (action: 'approve' | 'reject') => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    const label = action === 'approve' ? 'approve' : 'reject'
    if (!confirm(`Are you sure you want to ${label} ${ids.length} selected request${ids.length > 1 ? 's' : ''}?`)) return

    setBulkProcessing(true)
    try {
      const res = await fetch('/api/approvals/attendance-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestIds: ids, action })
      })

      const result = await res.json()
      if (result.success) {
        setRequests(prev => prev.filter(r => !ids.includes(r.id)))
        setSelectedIds(new Set())
      } else {
        alert('Failed to process requests: ' + result.error)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setBulkProcessing(false)
  }

  // ─── Single action (kept for convenience) ────────────
  const handleAction = async (requestId: number, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this retroactive attendance request?`)) return

    setProcessingId(requestId)
    try {
      const res = await fetch('/api/approvals/attendance-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestIds: [requestId], action })
      })

      const result = await res.json()
      if (result.success) {
        setRequests(prev => prev.filter(r => r.id !== requestId))
        setSelectedIds(prev => {
          const next = new Set(prev)
          next.delete(requestId)
          return next
        })
      } else {
        alert('Failed to process request: ' + result.error)
      }
    } catch (err: any) {
      alert('Error: ' + err.message)
    }
    setProcessingId(null)
  }

  const formatDisplayDate = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleDateString('en-GB', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-burgundy rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-brand-burgundy mb-6">Retroactive Attendance Queue</h1>
      <p className="text-gray-600 mb-8">Review attendance logs submitted by users for past event days.</p>

      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center flex flex-col items-center">
          <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-gray-500 font-medium text-lg">You're all caught up!</span>
          <span className="text-gray-400 text-sm mt-1">There are no pending retroactive attendance requests.</span>
        </div>
      ) : (
        <>
          {/* ─── Bulk toolbar ──────────────────────────────── */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-brand-burgundy rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {isAllSelected ? 'Deselect All' : 'Select All'}
              </span>
              {selectedIds.size > 0 && (
                <span className="ml-1 text-xs bg-brand-burgundy text-white px-2 py-0.5 rounded-full">
                  {selectedIds.size} selected
                </span>
              )}
            </label>

            <div className="flex gap-3">
              <button
                onClick={() => handleBulkAction('reject')}
                disabled={selectedIds.size === 0 || bulkProcessing}
                className="px-4 py-2 text-sm font-bold text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {bulkProcessing ? 'Processing…' : `Reject Selected (${selectedIds.size})`}
              </button>
              <button
                onClick={() => handleBulkAction('approve')}
                disabled={selectedIds.size === 0 || bulkProcessing}
                className="px-4 py-2 text-sm font-bold text-white bg-brand-burgundy rounded-lg hover:bg-brand-burgundy/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {bulkProcessing ? 'Processing…' : `Approve Selected (${selectedIds.size})`}
              </button>
            </div>
          </div>

          {/* ─── Cards grid ────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {requests.map(req => {
              const isSelected = selectedIds.has(req.id)

              return (
                <div
                  key={req.id}
                  className={`bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col transition-all ${
                    isSelected ? 'border-brand-burgundy ring-2 ring-brand-burgundy/30' : 'border-brand-burgundy'
                  }`}
                >
                  <div className="p-5 flex-1 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(req.id)}
                          className="w-4 h-4 accent-brand-burgundy rounded cursor-pointer"
                        />
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded border border-yellow-200 uppercase tracking-wide">
                          Pending
                        </span>
                      </div>
                      <span className="text-xs font-bold text-gray-400 uppercase">ID: #{req.attendee_id}</span>
                    </div>

                    <h2 className="text-xl font-bold text-brand-burgundy mb-4">{req.attendee_name}</h2>

                    <div className="bg-gray-50 rounded p-3 flex justify-between items-center border border-gray-100">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-500 uppercase">Event Day</span>
                        <span className="text-sm font-bold text-gray-900">{formatDisplayDate(req.event_date)}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-gray-500 uppercase">Session</span>
                        <span
                          className={`text-sm font-bold px-2 py-0.5 rounded ${
                            req.session_type === 'am' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {req.session_type.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 flex divide-x divide-gray-200 border-t border-brand-burgundy-light">
                    <button
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={processingId === req.id || bulkProcessing}
                      className="flex-1 py-3 text-red-600 font-bold hover:bg-red-50 transition text-sm disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={processingId === req.id || bulkProcessing}
                      className="flex-1 py-3 text-brand-burgundy font-bold hover:bg-brand-gold-light transition text-sm disabled:opacity-50"
                    >
                      {processingId === req.id ? 'Saving...' : 'Approve'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}