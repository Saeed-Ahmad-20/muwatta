'use client'

import { useState } from 'react'

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    // 1. Save a reference to the form immediately before any async 'await' pauses
    const form = e.currentTarget
    
    setStatus('loading')
    setErrorMessage('')

    const formData = new FormData(form)
    const data = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      subject: formData.get('subject'),
      message: formData.get('message'),
    }

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setStatus('success')
        // 2. Use the saved reference to reset the form safely
        form.reset()
        
        // Auto close after 3 seconds
        setTimeout(() => {
          setIsOpen(false)
          setStatus('idle')
        }, 3000)
      } else {
        throw new Error(result.error || 'Failed to send message')
      }
    } catch (error: any) {
      console.error(error)
      setStatus('error')
      setErrorMessage(error.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <>
      {/* FLOATING SUPPORT BADGE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[100] text-brand-gold py-3 px-5.5 rounded-full shadow-2xl hover:scale-105 transition-all duration-200 focus:outline-none flex items-center justify-center gap-3 border-2 border-brand-gold/30 group bg-gradient-to-r from-brand-burgundy to-brand-burgundy-dark/50 hover:from-brand-burgundy hover:to-brand-burgundy"
        aria-label="Support"
      >
        <span className="text-sm font-bold tracking-wider uppercase text-white drop-shadow-sm group-hover:scale-105 transition-transform duration-200">Help?</span>
        {isOpen ? (
          <svg className="w-5 h-5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        ) : (
          <svg className="w-5 h-5 text-brand-gold-light/90 transition-transform duration-200 group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 18.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13zM12 21a9 9 0 100-18 9 9 0 000 18zM12 9.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" /></svg>
        )}
      </button>

      {/* POP-UP WINDOW */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[100] w-[calc(100vw-3rem)] max-w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200">
          
          <div className="bg-brand-burgundy px-6 py-4 flex justify-between items-center text-brand-gold border-b border-brand-gold/20">
            <h3 className="font-bold tracking-wider uppercase text-sm">Contact Support</h3>
          </div>

          <div className="p-6">
            {status === 'success' ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h4 className="font-bold text-xl text-gray-900">Message Sent!</h4>
                <p className="text-gray-500 text-sm">Our team will get back to you shortly at the email provided.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {status === 'error' && (
                  <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm text-center font-medium">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Full Name</label>
                  <input type="text" name="fullName" required disabled={status === 'loading'} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy transition-colors text-sm" placeholder="Ali Ahmad" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Email</label>
                    <input type="email" name="email" required disabled={status === 'loading'} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy transition-colors text-sm" placeholder="Ali@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                      Phone <span className="text-gray-400 normal-case tracking-normal font-medium text-[10px] ml-0.5">(Inc. Country Code)</span>
                    </label>
                    <input type="tel" name="phone" required disabled={status === 'loading'} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy transition-colors text-sm" placeholder="+123 456 789" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Subject</label>
                  <input type="text" name="subject" required disabled={status === 'loading'} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy transition-colors text-sm" placeholder="How can we help?" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">Message</label>
                  <textarea name="message" required disabled={status === 'loading'} rows={4} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy transition-colors text-sm resize-none" placeholder="Please be as detailed as possible so we can assist you quickly..."></textarea>
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3 bg-brand-burgundy text-brand-gold rounded-lg font-bold shadow-md hover:bg-brand-burgundy-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                >
                  {status === 'loading' ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      Sending...
                    </>
                  ) : 'Send Message'}
                </button>
              </form>
            )}
          </div>

        </div>
      )}
    </>
  )
}