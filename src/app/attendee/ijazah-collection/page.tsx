'use client'

import { useState, useRef } from 'react'

type IjazahResult = {
  ID: number
  english_name: string | null
  arabic_name: string | null
  collection_station: string | null
  received: boolean
}

export default function IjazahCollection() {
  const [idNumber, setIdNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ stationsReady: boolean; record: IjazahResult } | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!idNumber.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`/api/attendee/ijazah?idNumber=${encodeURIComponent(idNumber.trim())}`)
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Something went wrong.')
      }

      setResult({ stationsReady: data.stationsReady, record: data.record })
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setResult(null)
    setError('')
    setIdNumber('')
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // ==========================================
  // RESULT VIEW
  // ==========================================
  if (result) {
    const { record, stationsReady } = result

    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">

          {/* Already collected */}
          {record.received && (
            <div className="bg-white rounded-xl shadow-md border-2 border-green-400 overflow-hidden animate-in fade-in zoom-in">
              <div className="bg-green-600 p-6 text-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold">Already Collected</h1>
                <p className="text-green-100 text-sm mt-1">Your Ijazah has been marked as received</p>
              </div>

              <div className="p-6 text-center space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">ID Number</p>
                  <p className="text-2xl font-black text-brand-burgundy">#{record.ID}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 font-medium">Name</p>
                  <p className="text-lg font-bold text-gray-900">{record.english_name || '-'}</p>
                </div>

                {record.arabic_name && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Arabic Name</p>
                    <p className="text-2xl font-bold text-brand-burgundy" dir="rtl">{record.arabic_name}</p>
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <p className="text-green-800 font-medium text-sm">
                    Records show your Ijazah has already been collected. If you believe this is an error, please speak to a volunteer at the collection desk.
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-brand-burgundy text-brand-gold rounded-lg font-bold hover:bg-brand-burgundy-dark transition mt-2"
                >
                  Look Up Another
                </button>
              </div>
            </div>
          )}

          {/* Stations not yet assigned */}
          {!record.received && !stationsReady && (
            <div className="bg-white rounded-xl shadow-md border-2 border-brand-burgundy overflow-hidden animate-in fade-in zoom-in">
              <div className="bg-brand-burgundy p-6 text-center text-brand-gold">
                <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold">Ijazah Found</h1>
                <p className="text-brand-gold-light text-sm mt-1">Stations have not yet been assigned</p>
              </div>

              <div className="p-6 text-center space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">ID Number</p>
                  <p className="text-2xl font-black text-brand-burgundy">#{record.ID}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 font-medium">Name</p>
                  <p className="text-lg font-bold text-gray-900">{record.english_name || '-'}</p>
                </div>

                {record.arabic_name && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Arabic Name</p>
                    <p className="text-2xl font-bold text-brand-burgundy" dir="rtl">{record.arabic_name}</p>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-bold text-yellow-800 text-sm">Not Ready Yet</span>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    Collection stations have not been assigned yet. Please check back later or listen for announcements about when Ijazah collection will begin.
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-brand-burgundy text-brand-gold rounded-lg font-bold hover:bg-brand-burgundy-dark transition mt-2"
                >
                  Look Up Another
                </button>
              </div>
            </div>
          )}

          {/* Station assigned — ready to collect */}
          {!record.received && stationsReady && (
            <div className="bg-white rounded-xl shadow-md border-2 border-brand-burgundy overflow-hidden animate-in fade-in zoom-in">
              <div className="bg-brand-burgundy p-6 text-center text-brand-gold">
                <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <h1 className="text-2xl font-bold">Your Ijazah is Ready</h1>
                <p className="text-brand-gold-light text-sm mt-1">Please collect from the station below</p>
              </div>

              <div className="p-6 text-center space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-medium">ID Number</p>
                  <p className="text-2xl font-black text-brand-burgundy">#{record.ID}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 font-medium">Name</p>
                  <p className="text-lg font-bold text-gray-900">{record.english_name || '-'}</p>
                </div>

                {record.arabic_name && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Arabic Name</p>
                    <p className="text-2xl font-bold text-brand-burgundy" dir="rtl">{record.arabic_name}</p>
                  </div>
                )}

                {/* THE MAIN STATION CARD */}
                <div className="bg-brand-burgundy rounded-xl p-6 mt-4 shadow-lg">
                  <p className="text-brand-gold-light text-xs font-bold uppercase tracking-widest mb-2">
                    Go to
                  </p>
                  <p className="text-5xl font-black text-brand-gold mb-2">
                    {record.collection_station}
                  </p>
                  <p className="text-brand-gold-light text-sm font-medium">
                    Please bring your ID for verification
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-2">
                  <p className="text-blue-800 text-sm font-medium">
                    Present this screen or your ID number to the volunteer at <strong>{record.collection_station}</strong> to receive your Ijazah certificate.
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="w-full py-3 bg-brand-burgundy text-brand-gold rounded-lg font-bold hover:bg-brand-burgundy-dark transition mt-2"
                >
                  Look Up Another
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    )
  }

  // ==========================================
  // SEARCH VIEW (DEFAULT)
  // ==========================================
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border-2 border-brand-burgundy overflow-hidden">

        <div className="bg-brand-burgundy p-6 text-center text-brand-gold">
          <div className="w-16 h-16 bg-brand-gold/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">Ijazah Collection</h1>
          <p className="text-sm text-brand-gold-light mt-2">
            Enter your ID number to find your collection station
          </p>
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleLookup} className="space-y-6">

            {error && (
              <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-center font-medium">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-brand-burgundy mb-2">
                Your ID Number
              </label>
              <input
                ref={inputRef}
                type="number"
                value={idNumber}
                onChange={(e) => {
                  setIdNumber(e.target.value)
                  setError('')
                }}
                placeholder="e.g. 1001"
                required
                autoFocus
                className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white focus:border-transparent transition-all text-lg text-center font-bold"
              />
              <p className="text-xs text-gray-400 mt-2 text-center">
                This is the ID number you were given at registration
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !idNumber.trim()}
              className="w-full py-3 px-4 bg-brand-burgundy text-brand-gold rounded-lg hover:bg-brand-burgundy-dark transition font-bold disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
                  Looking up...
                </span>
              ) : (
                'Find My Station'
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  )
}