'use client'

import { useState, useEffect } from 'react'

type Announcement = {
  id: number
  subject: string
  message: string
  created_at: string
  sort_order: number
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Form State
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/announcements')
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error)
      setAnnouncements(result.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load announcements.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Create OR Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) return

    setIsSubmitting(true)
    setError('')

    try {
      if (editingId) {
        // UPDATE EXISTING
        const res = await fetch('/api/admin/announcements', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'edit', id: editingId, subject, message })
        })
        const result = await res.json()
        if (!res.ok || !result.success) throw new Error(result.error)
        
        setAnnouncements(announcements.map(a => a.id === editingId ? result.data : a))
      } else {
        // CREATE NEW
        const res = await fetch('/api/admin/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject, message, sort_order: announcements.length })
        })
        const result = await res.json()
        if (!res.ok || !result.success) throw new Error(result.error)
        
        setAnnouncements([...announcements, result.data])
      }
      
      cancelEdit()
    } catch (err: any) {
      setError(err.message || 'Failed to save announcement.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditClick = (announcement: Announcement) => {
    setSubject(announcement.subject)
    setMessage(announcement.message)
    setEditingId(announcement.id)
    window.scrollTo({ top: 0, behavior: 'smooth' }) // Scroll up to the form
  }

  const cancelEdit = () => {
    setSubject('')
    setMessage('')
    setEditingId(null)
    setError('')
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement? This cannot be undone.')) return
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error)
      setAnnouncements(announcements.filter(a => a.id !== id))
    } catch (err: any) {
      alert(err.message || 'Failed to delete announcement.')
    }
  }

  // --- REORDERING LOGIC ---
  const moveItem = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === announcements.length - 1) return

    const newArr = [...announcements]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap items
    const temp = newArr[index]
    newArr[index] = newArr[targetIndex]
    newArr[targetIndex] = temp

    // Reassign sort_order based on new array position
    const updatedItems = newArr.map((item, idx) => ({ ...item, sort_order: idx }))
    
    // Optimistic UI update
    setAnnouncements(updatedItems)

    // Save order to DB
    try {
      await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reorder', 
          items: updatedItems.map(a => ({ id: a.id, sort_order: a.sort_order })) 
        })
      })
    } catch (err) {
      alert("Failed to save new order. Please refresh.")
      fetchAnnouncements() // Revert if failed
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 px-4 md:px-8">
      
      <div className="max-w-4xl mx-auto mb-8">
        <h1 className="text-3xl font-black text-brand-burgundy uppercase tracking-wider mb-2">
          Manage Announcements
        </h1>
        <p className="text-gray-600">
          Post updates, edit existing ones, or use the arrows to reorder how they appear to the public.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COMPOSER (Left Column) */}
        <div className="lg:col-span-1">
          <div className={`bg-white rounded-2xl shadow-sm border overflow-hidden sticky top-24 transition-colors ${editingId ? 'border-brand-gold' : 'border-brand-burgundy'}`}>
            <div className={`px-6 py-4 text-brand-gold flex justify-between items-center ${editingId ? 'bg-brand-gold text-brand-burgundy-dark' : 'bg-brand-burgundy'}`}>
              <h2 className="text-lg font-bold">
                {editingId ? 'Edit Announcement' : 'New Announcement'}
              </h2>
              {editingId && (
                <button onClick={cancelEdit} className="text-sm font-bold opacity-80 hover:opacity-100">Cancel</button>
              )}
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Subject</label>
                <input 
                  type="text" 
                  value={subject} 
                  onChange={e => setSubject(e.target.value)} 
                  required
                  placeholder="e.g. Lunch Break Extended"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-brand-burgundy focus:border-brand-burgundy"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Message</label>
                <textarea 
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  required
                  rows={6}
                  placeholder="Type your announcement details here..."
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-brand-burgundy focus:border-brand-burgundy resize-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !subject.trim() || !message.trim()}
                className={`w-full py-3 font-black rounded-lg hover:shadow-md transition-all disabled:opacity-50 flex justify-center items-center gap-2 ${editingId ? 'bg-brand-burgundy text-brand-gold' : 'bg-brand-gold text-brand-burgundy-dark'}`}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : editingId ? (
                  'Update Announcement'
                ) : (
                  'Post Announcement'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* FEED (Right Column) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
            Published Announcements
          </h3>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-brand-burgundy border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : announcements.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
              <p className="font-medium">No announcements have been posted yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement, index) => {
                const dateObj = new Date(announcement.created_at)
                const isEditingThis = editingId === announcement.id

                return (
                  <div key={announcement.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden flex transition-all ${isEditingThis ? 'border-brand-gold ring-2 ring-brand-gold/20' : 'border-gray-200 hover:shadow-md'}`}>
                    
                    {/* Reorder Drag Handle Area */}
                    <div className="bg-gray-50 w-12 flex flex-col justify-center items-center border-r border-gray-100 py-4 gap-2 text-gray-400">
                      <button 
                        onClick={() => moveItem(index, 'up')}
                        disabled={index === 0}
                        className="p-1 hover:text-brand-burgundy disabled:opacity-30 disabled:hover:text-gray-400"
                        title="Move Up"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" /></svg>
                      </button>
                      <span className="text-[10px] font-black">{index + 1}</span>
                      <button 
                        onClick={() => moveItem(index, 'down')}
                        disabled={index === announcements.length - 1}
                        className="p-1 hover:text-brand-burgundy disabled:opacity-30 disabled:hover:text-gray-400"
                        title="Move Down"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="p-6 flex-1 relative group">
                      
                      {/* Action Buttons */}
                      <div className="absolute top-4 right-4 flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditClick(announcement)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-colors"
                          title="Edit Announcement"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button 
                          onClick={() => handleDelete(announcement.id)}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                          title="Delete Announcement"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-1 pr-16">{announcement.subject}</h3>
                      
                      <div className="flex items-center gap-3 text-xs font-bold text-brand-burgundy/70 mb-4 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          {dateObj.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="w-1 h-1 bg-brand-gold rounded-full"></span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {announcement.message}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}