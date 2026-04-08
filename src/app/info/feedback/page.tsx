'use client'

import { useState } from 'react'

// ==========================================
// Validation constants (must match backend)
// ==========================================
const MAX_NAME_LENGTH = 100
const MAX_MESSAGE_LENGTH = 2000
// ==========================================

export default function FeedbackBoxPage() {
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      setError('Feedback message is required.')
      return
    }

    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      setError(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`)
      return
    }

    if (name.trim().length > MAX_NAME_LENGTH) {
      setError(`Name must be ${MAX_NAME_LENGTH} characters or fewer.`)
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message }),
      })

      const result = await res.json()

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit feedback.')
      }

      setSuccess(true)
      setName('')
      setMessage('')

      setTimeout(() => setSuccess(false), 5000)
    } catch (error: unknown) {
      const msg =
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.'
      setError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const messageCharsRemaining = MAX_MESSAGE_LENGTH - message.length

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-brand-burgundy px-8 py-10 text-center text-brand-gold relative overflow-hidden">
          <svg
            className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 text-brand-burgundy-dark opacity-50"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
          </svg>
          <div className="relative z-10">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-wider mb-2">
              Feedback Box
            </h1>
            <p className="text-brand-gold-light max-w-md mx-auto">
              Enjoy something in particular, found an issue, or want to suggest
              an improvement? Let the organizing team know privately.
            </p>
          </div>
        </div>

        <div className="p-8">
          {success ? (
            <div
              className="text-center py-10 animate-in fade-in zoom-in"
              aria-live="polite"
            >
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10"
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
                Message Sent!
              </h3>
              <p className="text-gray-600">Thank you for your feedback!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              {error && (
                <div
                  className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm font-medium text-center"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="feedback-name"
                    className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
                  >
                    Name (Optional)
                  </label>
                  <input
                    id="feedback-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Leave blank to remain anonymous"
                    maxLength={MAX_NAME_LENGTH}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy transition-colors"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {name.length}/{MAX_NAME_LENGTH}
                  </p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="feedback-message"
                  className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
                >
                  Your Feedback{' '}
                  <span className="text-red-500" aria-hidden="true">
                    *
                  </span>
                </label>
                <textarea
                  id="feedback-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                  maxLength={MAX_MESSAGE_LENGTH}
                  placeholder="Tell us what you're thinking..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy transition-colors resize-none"
                />
                <p
                  className={`text-xs mt-1 text-right ${
                    messageCharsRemaining < 100
                      ? 'text-red-500 font-bold'
                      : 'text-gray-400'
                  }`}
                >
                  {messageCharsRemaining.toLocaleString()} characters remaining
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !message.trim()}
                className="w-full py-4 bg-brand-burgundy text-brand-gold font-black text-lg rounded-lg hover:bg-brand-burgundy-dark hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex justify-center items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                    Send Feedback
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}