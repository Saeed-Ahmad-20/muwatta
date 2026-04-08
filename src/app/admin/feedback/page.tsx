'use client'

import { useState, useEffect } from 'react'

type Feedback = {
  id: number
  name: string | null
  message: string
  created_at: string
}

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    try {
      const res = await fetch('/api/admin/feedback')
      const result = await res.json()
      if (result.success) setFeedback(result.data)
    } catch (err) {
      console.error('Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  const handleDismiss = async (id: number) => {
    if (!confirm('Are you sure you want to dismiss this feedback?')) return
    
    try {
      const res = await fetch('/api/admin/feedback', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const result = await res.json()
      if (result.success) {
        setFeedback(prev => prev.filter(s => s.id !== id))
      }
    } catch (err) {
      alert('Failed to dismiss feedback.')
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-[calc(100vh-4rem)]">
      <h1 className="text-3xl font-black text-brand-burgundy uppercase tracking-wider mb-2">Feedback Box</h1>
      <p className="text-gray-600 mb-8">Private feedback, ideas, and issues submitted by attendees.</p>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-brand-burgundy border-t-transparent rounded-full animate-spin"></div></div>
      ) : feedback.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
          <p className="font-medium text-lg">Your inbox is empty.</p>
          <p className="text-sm">No pending feedback at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {feedback.map((sug) => (
            <div key={sug.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col relative group">
              
              <button 
                onClick={() => handleDismiss(sug.id)}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors md:opacity-0 group-hover:opacity-100"
                title="Dismiss Feedback"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>

              <div className="flex-1">
                <p className="text-gray-800 whitespace-pre-wrap leading-relaxed mb-6">"{sug.message}"</p>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-1">
                <p className="font-bold text-brand-burgundy-dark text-sm">
                  {sug.name || 'Anonymous Attendee'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(sug.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}