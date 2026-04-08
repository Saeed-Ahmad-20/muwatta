'use client'

import { useState, useEffect, useCallback } from 'react'

// ==========================================
// Validation constants (must match backend)
// ==========================================
const MAX_NAME_LENGTH = 100
const MAX_LOCATION_LENGTH = 150
const MAX_MESSAGE_LENGTH = 3000
// ==========================================

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
  const [fetchError, setFetchError] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Form State
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [message, setMessage] = useState('')
  const [isAnon, setIsAnon] = useState(false)

  // Body scroll lock when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isModalOpen])

  const fetchReflections = useCallback(async () => {
    setLoading(true)
    setFetchError('')

    try {
      const res = await fetch('/api/reflections')

      if (!res.ok) {
        throw new Error('Failed to load reflections.')
      }

      const result = await res.json()

      if (result.success) {
        setReflections(result.data)
      } else {
        throw new Error(result.error || 'Failed to load reflections.')
      }
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : 'Something went wrong.'
      setFetchError(msg)
      console.error('[Reflections] Fetch error:', msg)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReflections()
  }, [fetchReflections])

  const resetForm = () => {
    setName('')
    setLocation('')
    setMessage('')
    setIsAnon(false)
    setSubmitError('')
  }

  const openModal = () => {
    setSubmitSuccess(false)
    setSubmitError('')
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    if (submitSuccess) {
      resetForm()
      setSubmitSuccess(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError('')

    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      setSubmitError('Message is required.')
      return
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setSubmitError(
        `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`
      )
      return
    }

    if (!isAnon) {
      if (name.trim().length > MAX_NAME_LENGTH) {
        setSubmitError(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`)
        return
      }
      if (location.trim().length > MAX_LOCATION_LENGTH) {
        setSubmitError(
          `Location must be ${MAX_LOCATION_LENGTH} characters or fewer.`
        )
        return
      }
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/reflections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: isAnon ? null : name,
          location: isAnon ? null : location,
          message,
          is_anonymous: isAnon,
        }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit reflection.')
      }

      setSubmitSuccess(true)
      setTimeout(() => {
        closeModal()
        resetForm()
        setSubmitSuccess(false)
      }, 3000)
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Failed to submit reflection. Please try again.'
      setSubmitError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const messageCharsRemaining = MAX_MESSAGE_LENGTH - message.length

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 px-4 md:px-8">
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-brand-burgundy uppercase tracking-wider mb-2">
            Reflections Wall
          </h1>
          <p className="text-gray-600 max-w-2xl text-lg">
            Read thoughts, takeaways, and experiences shared by attendees of the
            Majlis.
          </p>
        </div>
        <button
          onClick={openModal}
          className="px-6 py-3 bg-brand-burgundy text-brand-gold font-black rounded-lg hover:bg-brand-burgundy-dark hover:scale-105 transition-all shadow-md flex items-center gap-2 whitespace-nowrap"
          aria-label="Share a reflection"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Share a Reflection
        </button>
      </div>

      {/* REFLECTIONS GRID */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-brand-burgundy border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : fetchError ? (
          <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-16 text-center">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-red-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-600 font-medium mb-4">{fetchError}</p>
            <button
              onClick={fetchReflections}
              className="px-6 py-2 bg-brand-burgundy text-brand-gold font-bold rounded-lg hover:bg-brand-burgundy-dark transition-colors"
            >
              Retry
            </button>
          </div>
        ) : reflections.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-dashed border-gray-300 p-16 text-center text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="text-lg font-medium mb-1">No reflections yet</p>
            <p className="text-sm">
              Be the first to share your thoughts about the Majlis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {reflections.map((ref) => (
              <article
                key={ref.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-lg mb-6">
                  &ldquo;{ref.message}&rdquo;
                </p>
                <div className="border-t border-gray-100 pt-4">
                  <p className="font-bold text-brand-burgundy-dark">
                    {ref.is_anonymous ? 'Anonymous Attendee' : ref.name}
                  </p>
                  {!ref.is_anonymous && ref.location && (
                    <p className="text-xs font-bold text-brand-gold uppercase tracking-wider mt-1">
                      {ref.location}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* SUBMIT MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label="Share your reflection"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in border-2 border-brand-burgundy"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-brand-burgundy px-6 py-4 flex justify-between items-center text-brand-gold">
              <h2 className="text-xl font-bold">Share Your Reflection</h2>
              <button
                onClick={closeModal}
                className="text-2xl hover:text-white transition-colors"
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>

            <div className="p-6">
              {submitSuccess ? (
                <div className="py-12 text-center" aria-live="polite">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Thank you!
                  </h3>
                  <p className="text-gray-600">
                    Your reflection has been submitted and is awaiting approval
                    by the moderators.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  {submitError && (
                    <div
                      className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium text-center"
                      role="alert"
                    >
                      {submitError}
                    </div>
                  )}

                  <div className="bg-brand-burgundy/5 border border-brand-burgundy/20 rounded-lg p-4 mb-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isAnon}
                        onChange={(e) => setIsAnon(e.target.checked)}
                        className="w-5 h-5 text-brand-burgundy border-gray-300 rounded focus:ring-brand-burgundy"
                      />
                      <span className="ml-3 font-bold text-brand-burgundy">
                        Remain Anonymous
                      </span>
                    </label>
                  </div>

                  {!isAnon && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="reflection-name"
                          className="block text-xs font-bold text-gray-700 uppercase mb-1"
                        >
                          Your Name
                        </label>
                        <input
                          id="reflection-name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required={!isAnon}
                          maxLength={MAX_NAME_LENGTH}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-burgundy focus:border-brand-burgundy"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {name.length}/{MAX_NAME_LENGTH}
                        </p>
                      </div>
                      <div>
                        <label
                          htmlFor="reflection-location"
                          className="block text-xs font-bold text-gray-700 uppercase mb-1"
                        >
                          City / Country
                        </label>
                        <input
                          id="reflection-location"
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="e.g. London, UK"
                          maxLength={MAX_LOCATION_LENGTH}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-burgundy focus:border-brand-burgundy"
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {location.length}/{MAX_LOCATION_LENGTH}
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="reflection-message"
                      className="block text-xs font-bold text-gray-700 uppercase mb-1"
                    >
                      Your Message
                    </label>
                    <textarea
                      id="reflection-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={5}
                      maxLength={MAX_MESSAGE_LENGTH}
                      placeholder="What was your main takeaway? How did you find the event?"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-brand-burgundy focus:border-brand-burgundy resize-none"
                    />
                    <p
                      className={`text-xs mt-1 text-right ${
                        messageCharsRemaining < 100
                          ? 'text-red-500 font-bold'
                          : 'text-gray-400'
                      }`}
                    >
                      {messageCharsRemaining.toLocaleString()} characters
                      remaining
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !message.trim()}
                    className="w-full py-3 bg-brand-gold text-brand-burgundy-dark font-black rounded-lg hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-brand-burgundy border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Reflection'
                    )}
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