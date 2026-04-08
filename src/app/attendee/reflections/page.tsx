'use client'

import { useState, useEffect } from 'react'

type Reflection = {
  id: number
  name: string | null
  location: string | null
  message: string
  is_anonymous: boolean
  created_at: string
}

export default function ReflectionsWallPage() {
  const [reflections, setReflections] = useState<Reflection[]>([])
  const [loading, setLoading] = useState(true)
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Form State
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [message, setMessage] = useState('')
  const [isAnon, setIsAnon] = useState(false)

  useEffect(() => {
    fetchReflections()
  }, [])

  const fetchReflections = async () => {
    try {
      const res = await fetch('/api/reflections')
      const result = await res.json()
      if (result.success) setReflections(result.data)
    } catch (err) {
      console.error('Failed to load reflections')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, location, message, is_anonymous: isAnon })
      })
      const result = await res.json()
      
      if (result.success) {
        setSubmitSuccess(true)
        setTimeout(() => {
          setIsModalOpen(false)
          setSubmitSuccess(false)
          setName('')
          setLocation('')
          setMessage('')
          setIsAnon(false)
        }, 3000) // Close modal after showing success for 3 seconds
      }
    } catch (err) {
      alert('Failed to submit reflection. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 px-4 md:px-8">
      
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-brand-burgundy uppercase tracking-wider mb-2">
            Reflections Wall
          </h1>
          <p className="text-gray-600 max-w-2xl text-lg">
            Read thoughts, takeaways, and experiences shared by attendees of the Majlis.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-brand-burgundy text-brand-gold font-black rounded-lg hover:bg-brand-burgundy-dark hover:scale-105 transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Share a Reflection
        </button>
      </div>

      {/* REFLECTIONS GRID */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-brand-burgundy border-t-transparent rounded-full animate-spin"></div></div>
        ) : reflections.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 p-16 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {reflections.map((ref) => (
              <div key={ref.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 relative">
                <svg className="absolute top-4 left-4 w-8 h-8 text-gray-100" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" /></svg>
                <div className="relative z-10 pt-4">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg mb-6">"{ref.message}"</p>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-bold text-brand-burgundy-dark">
                      {ref.is_anonymous ? 'Anonymous Attendee' : ref.name}
                    </p>
                    {!ref.is_anonymous && ref.location && (
                      <p className="text-xs font-bold text-brand-gold uppercase tracking-wider mt-1">{ref.location}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SUBMIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in border-2 border-brand-burgundy" onClick={e => e.stopPropagation()}>
            
            <div className="bg-brand-burgundy px-6 py-4 flex justify-between items-center text-brand-gold">
              <h2 className="text-xl font-bold">Share Your Reflection</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-2xl hover:text-white transition-colors">&times;</button>
            </div>

            <div className="p-6">
              {submitSuccess ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank you!</h3>
                  <p className="text-gray-600">Your reflection has been submitted and is awaiting approval by the moderators.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  <div className="bg-brand-burgundy/5 border border-brand-burgundy/20 rounded-lg p-4 mb-4">
                    <label className="flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isAnon} 
                        onChange={(e) => setIsAnon(e.target.checked)}
                        className="w-5 h-5 text-brand-burgundy border-gray-300 rounded focus:ring-brand-burgundy"
                      />
                      <span className="ml-3 font-bold text-brand-burgundy">Remain Anonymous</span>
                    </label>
                  </div>

                  {!isAnon && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Your Name</label>
                        <input 
                          type="text" 
                          value={name} 
                          onChange={e => setName(e.target.value)}
                          required={!isAnon}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-burgundy focus:border-brand-burgundy"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase mb-1">City / Country</label>
                        <input 
                          type="text" 
                          value={location} 
                          onChange={e => setLocation(e.target.value)}
                          placeholder="e.g. London, UK"
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-burgundy focus:border-brand-burgundy"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Your Message</label>
                    <textarea 
                      value={message} 
                      onChange={e => setMessage(e.target.value)}
                      required
                      rows={5}
                      placeholder="What was your main takeaway? How did you find the event?"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-burgundy focus:border-brand-burgundy resize-none"
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting || !message.trim()}
                    className="w-full py-3 bg-brand-gold text-brand-burgundy-dark font-black rounded-lg hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Reflection'}
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  )
}