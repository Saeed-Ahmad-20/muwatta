'use client'

import { useState, useEffect } from 'react'

type Reflection = {
  id: number
  name: string | null
  location: string | null
  message: string
  is_anonymous: boolean
  is_approved: boolean
  created_at: string
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n') || field.includes('\r')) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

function downloadReflectionsCSV(reflections: Reflection[]) {
  const headers = ['ID', 'Name', 'Location', 'Message', 'Anonymous', 'Approved', 'Submitted At']

  const rows = reflections.map((r) => [
    r.id.toString(),
    escapeCSVField(r.is_anonymous ? 'Anonymous' : r.name || ''),
    escapeCSVField(r.is_anonymous ? '' : r.location || ''),
    escapeCSVField(r.message),
    r.is_anonymous ? 'Yes' : 'No',
    r.is_approved ? 'Yes' : 'No',
    new Date(r.created_at).toLocaleString(),
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `reflections_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function AdminReflectionsPage() {
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    fetchReflections()
  }, [])

  const fetchReflections = async () => {
    try {
      const res = await fetch('/api/admin/reflections')
      const result = await res.json()
      if (result.success) setReflections(result.data)
    } catch (err) {
      console.error('Failed to load reflections')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleApproval = async (id: number, currentStatus: boolean) => {
    setProcessingId(id)
    try {
      const res = await fetch('/api/admin/reflections', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_approved: !currentStatus }),
      })
      const result = await res.json()
      if (result.success) {
        setReflections((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, is_approved: !currentStatus } : r
          )
        )
      }
    } catch (err) {
      alert('Failed to update status.')
    }
    setProcessingId(null)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Permanently delete this reflection?')) return
    setProcessingId(id)
    try {
      const res = await fetch('/api/admin/reflections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const result = await res.json()
      if (result.success) {
        setReflections((prev) => prev.filter((r) => r.id !== id))
      }
    } catch (err) {
      alert('Failed to delete.')
    }
    setProcessingId(null)
  }

  const sortedReflections = [...reflections].sort((a, b) => {
    if (a.is_approved === b.is_approved) {
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }
    return a.is_approved ? 1 : -1
  })

  const pendingCount = reflections.filter((r) => !r.is_approved).length
  const publishedCount = reflections.filter((r) => r.is_approved).length

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-brand-burgundy uppercase tracking-wider mb-2">
            Manage Reflections
          </h1>
          <p className="text-gray-600">
            Review attendee submissions before they appear on the public wall.
          </p>
        </div>

        {reflections.length > 0 && (
          <button
            onClick={() => downloadReflectionsCSV(reflections)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm whitespace-nowrap"
            title="Download all reflections as CSV"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Export CSV
          </button>
        )}
      </div>

      {/* Stats Bar */}
      {!loading && reflections.length > 0 && (
        <div className="flex gap-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-sm">
            <span className="font-black text-yellow-700">{pendingCount}</span>{' '}
            <span className="text-yellow-600">Pending</span>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm">
            <span className="font-black text-green-700">{publishedCount}</span>{' '}
            <span className="text-green-600">Published</span>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm">
            <span className="font-black text-gray-700">
              {reflections.length}
            </span>{' '}
            <span className="text-gray-600">Total</span>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-brand-burgundy border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reflections.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          No reflections submitted yet.
        </div>
      ) : (
        <div className="space-y-4">
          {sortedReflections.map((ref) => (
            <div
              key={ref.id}
              className={`bg-white rounded-xl border shadow-sm p-6 transition-colors ${
                ref.is_approved
                  ? 'border-gray-200'
                  : 'border-yellow-400 ring-1 ring-yellow-400/50'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">
                    {ref.is_anonymous ? 'Anonymous Attendee' : ref.name}
                  </h3>
                  {!ref.is_anonymous && ref.location && (
                    <p className="text-sm text-gray-500">{ref.location}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(ref.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                      ref.is_approved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {ref.is_approved ? 'Published' : 'Pending Review'}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 whitespace-pre-wrap mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                &ldquo;{ref.message}&rdquo;
              </p>

              <div className="flex gap-3 border-t border-gray-100 pt-4">
                <button
                  onClick={() =>
                    handleToggleApproval(ref.id, ref.is_approved)
                  }
                  disabled={processingId === ref.id}
                  className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors flex-1 disabled:opacity-50 disabled:cursor-not-allowed ${
                    ref.is_approved
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      : 'bg-brand-burgundy text-brand-gold hover:bg-brand-burgundy-dark'
                  }`}
                >
                  {ref.is_approved ? 'Unpublish (Hide)' : 'Approve & Publish'}
                </button>
                <button
                  onClick={() => handleDelete(ref.id)}
                  disabled={processingId === ref.id}
                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-bold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}