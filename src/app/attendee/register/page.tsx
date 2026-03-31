'use client'

import { useState, useEffect } from 'react'
import { getServerTime } from '@/app/actions'

const EVENT_DATES = [
  { id: '2026-04-04', label: 'Saturday, April 4th' },
  { id: '2026-04-05', label: 'Sunday, April 5th' },
  { id: '2026-04-06', label: 'Monday, April 6th' },
  { id: '2026-04-07', label: 'Tuesday, April 7th' },
]

const DEFAULT_SHARE_MESSAGE = `Alhamdulillah, I have just logged my attendance at the historic recital of al-Muwatta' of Imam Malik Ibn Anas with Shaykh Muhammad al-Yaqoubi. May Allah bless this blessed gathering and all those who attend. 📖✨`

const SHARE_HASHTAGS = "Muwatta,ImamMalik,ShaykhYaqoubi,IslamicKnowledge"

export default function RegisterAttendance() {
  const [isMounted, setIsMounted] = useState(false)
  const [idNumber, setIdNumber] = useState('')
  const [postcode, setPostcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successData, setSuccessData] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [shareMessage, setShareMessage] = useState(DEFAULT_SHARE_MESSAGE)
  const [isEditingMessage, setIsEditingMessage] = useState(false)
  
  const [availableDates, setAvailableDates] = useState<typeof EVENT_DATES>([])
  const [selectedDate, setSelectedDate] = useState<string>('')
  
  const [isAmEnabled, setIsAmEnabled] = useState(false)
  const [isPmEnabled, setIsPmEnabled] = useState(false)
  const [selectedSessions, setSelectedSessions] = useState({ am: false, pm: false })
  
  const [appState, setAppState] = useState<'loading' | 'too_early' | 'open' | 'concluded'>('loading')
  const [todayString, setTodayString] = useState('')
  const [timeOffset, setTimeOffset] = useState<number | null>(null)
  
  // 1. Synchronize the secure clock on load
  useEffect(() => {
    setIsMounted(true)
    async function syncClock() {
      try {
        const clientTime = Date.now()
        const serverIso = await getServerTime()
        const serverTime = new Date(serverIso).getTime()
        setTimeOffset(serverTime - clientTime)
      } catch (e) {
        setTimeOffset(0) 
      }
    }
    syncClock()
  }, [])

  // 2. Continuously monitor time constraints
  useEffect(() => {
    if (!isMounted || timeOffset === null) return 

    const checkTimeAndDates = () => {
      const actualNow = new Date(Date.now() + timeOffset)
      
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      
      const parts = formatter.formatToParts(actualNow)
      const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00'
      
      const currentTodayStr = `${getPart('year')}-${getPart('month')}-${getPart('day')}`
      setTodayString(currentTodayStr)

      if (currentTodayStr > '2026-04-10') {
        setAppState('concluded')
        return
      }

      if (currentTodayStr < '2026-04-04') {
        setAppState('too_early')
        return
      }

      setAppState('open')

      const unlockedDates = EVENT_DATES.filter(d => d.id <= currentTodayStr)
      setAvailableDates(unlockedDates)

      const activeDateId = selectedDate || (unlockedDates.length > 0 ? unlockedDates[unlockedDates.length - 1].id : '')
      if (!selectedDate && activeDateId) {
        setSelectedDate(activeDateId)
      }

      if (activeDateId === currentTodayStr) {
        const currentHour = parseInt(getPart('hour'))
        const currentMinute = parseInt(getPart('minute'))
        const decimalTime = currentHour + (currentMinute / 60)

        const isAmTime = decimalTime >= 6.0 && decimalTime < 24.0
        const isPmTime = decimalTime >= 13.5 && decimalTime < 24.0

        setIsAmEnabled(isAmTime)
        setIsPmEnabled(isPmTime)

        setSelectedSessions(prev => ({
          am: prev.am && isAmTime,
          pm: prev.pm && isPmTime
        }))
      } else {
        setIsAmEnabled(true)
        setIsPmEnabled(true)
      }
    }

    checkTimeAndDates()
    const interval = setInterval(checkTimeAndDates, 30000) 
    return () => clearInterval(interval)
  }, [isMounted, timeOffset, selectedDate])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessData(null)

    try {
      if (!selectedDate || (!selectedSessions.am && !selectedSessions.pm)) {
        throw new Error("Please select a date and at least one active session.")
      }

      if (!idNumber || !postcode) {
        throw new Error("Please enter both your ID Number and a Postcode.")
      }

      const response = await fetch('/api/attendee/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idNumber,
          postcode,
          selectedDate,
          selectedSessions
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "An error occurred while verifying your details.")
      }

      const selectedDateLabel = EVENT_DATES.find(d => d.id === selectedDate)?.label

      setSuccessData({
        ...result.attendee,
        registered_date: selectedDateLabel,
        newly_registered: { am: result.newAm, pm: result.newPm },
        already_registered: { am: result.dupAm, pm: result.dupPm },
        isRetroactive: result.isRetroactive
      })

    } catch (err: any) {
      setError(err.message || "An error occurred while verifying your details.")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = shareMessage
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
  }

  const handleCopyMessage = async () => {
    await copyToClipboard()
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInstagramShare = async () => {
    await copyToClipboard()
    setCopied(true)
    setTimeout(() => setCopied(false), 3000)
    window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer')
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Muwatta Recital Attendance',
          text: shareMessage,
        })
      } catch {
        // User cancelled — do nothing
      }
    }
  }

  const getShareLinks = () => ({
    whatsapp: `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&hashtags=${SHARE_HASHTAGS}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareMessage)}`,
    telegram: `https://t.me/share/url?text=${encodeURIComponent(shareMessage)}`,
  })

  // --- RENDER STATES ---

  if (appState === 'loading' || !isMounted || timeOffset === null) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-burgundy rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Synchronizing secure clock...</p>
      </div>
    )
  }

  if (appState === 'concluded') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 text-center bg-brand-burgundy text-brand-gold">
        <svg className="w-20 h-20 mb-6 text-brand-gold mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h1 className="text-4xl font-bold mb-4">Alhamdulillah</h1>
        <p className="text-lg max-w-xl mx-auto opacity-90 leading-relaxed">
          The historic recital of al-Muwatta' of Imam Malik Ibn Anas with Shaykh Muhammad al-Yaqoubi has officially concluded. Registration is now permanently closed. May Allah accept everyone's efforts and attendance.
        </p>
      </div>
    )
  }

  if (appState === 'too_early') {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 bg-gray-200 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h1 className="text-3xl font-bold text-brand-burgundy mb-2">Registration Not Open</h1>
        <p className="text-gray-600 max-w-md mx-auto">
          Attendance tracking for the Muwatta Recital will open on Saturday, April 4th, 2026. Please check back then.
        </p>
      </div>
    )
  }

  const shareLinks = getShareLinks()

  // --- MAIN FORM ---
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border-2 border-brand-burgundy overflow-hidden">
        
        <div className="bg-brand-burgundy p-6 text-center text-brand-gold">
          <h1 className="text-2xl font-bold">Register Attendance</h1>
          <p className="text-sm text-brand-gold-light mt-2">Log your recital progress</p>
        </div>

        <div className="p-6 md:p-8">
          {successData ? (
            <div className="text-center animate-in fade-in zoom-in">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${successData.isRetroactive ? 'bg-yellow-50 text-yellow-600 border-yellow-200 border' : 'bg-green-50 text-green-600 border-green-200 border'}`}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {successData.isRetroactive 
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  }
                </svg>
              </div>
              <h2 className="text-xl font-bold text-brand-burgundy mb-2">
                {successData.isRetroactive ? 'Attendance Submitted' : 'Attendance Logged'}
              </h2>
              <p className="text-gray-600 mb-2">
                Jazakallah Khair, <strong className="text-brand-burgundy">{successData.attendee_name}</strong>!
              </p>

              {successData.arabic_name && (
                <p className="text-2xl font-bold text-brand-burgundy mb-2" dir="rtl">
                  {successData.arabic_name}
                </p>
              )}

              {successData.isRetroactive && (
                <div className="text-xs bg-yellow-50 text-yellow-800 p-3 rounded-lg mt-3 mb-2 border border-yellow-200">
                  Because this is a past date, your attendance has been sent to an admin for manual approval.
                </div>
              )}
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 mt-4 border border-gray-200">
                <p className="text-sm font-bold text-brand-burgundy">
                  {successData.registered_date}
                </p>
                <p className="text-sm text-gray-700 mt-2 font-medium">
                  Successfully Logged Now: 
                  {successData.newly_registered.am && <span className="font-bold text-brand-gold ml-1">AM</span>}
                  {successData.newly_registered.am && successData.newly_registered.pm && " & "}
                  {successData.newly_registered.pm && <span className="font-bold text-brand-gold ml-1">PM</span>}
                </p>

                {(successData.already_registered.am || successData.already_registered.pm) && (
                  <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded text-xs text-blue-800 font-medium">
                    Note: Your attendance had already been logged for the 
                    {successData.already_registered.am && " AM"}
                    {successData.already_registered.am && successData.already_registered.pm && " and"}
                    {successData.already_registered.pm && " PM"} session(s) previously.
                  </div>
                )}
              </div>

              {/* ============================== */}
              {/* SOCIAL MEDIA SHARE SECTION     */}
              {/* ============================== */}
              <div className="bg-gray-50 rounded-lg p-5 mb-6 border border-gray-200 text-left">
                <h3 className="text-sm font-bold text-brand-burgundy uppercase tracking-wider text-center mb-2">
                  Share the Blessed Occasion
                </h3>
                <p className="text-xs text-gray-500 text-center mb-4">
                  Let others know about this historic gathering
                </p>

                {/* Message preview / editor */}
                <div className="bg-white border border-gray-200 rounded-lg mb-4 overflow-hidden">
                  {isEditingMessage ? (
                    <div>
                      <textarea
                        value={shareMessage}
                        onChange={(e) => setShareMessage(e.target.value)}
                        rows={5}
                        className="w-full p-3 text-xs text-gray-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-burgundy resize-none"
                        placeholder="Write your message..."
                      />
                      <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-t border-gray-100">
                        <button
                          onClick={() => setShareMessage(DEFAULT_SHARE_MESSAGE)}
                          className="text-[10px] text-gray-400 hover:text-brand-burgundy transition-colors font-medium"
                        >
                          Reset to default
                        </button>
                        <button
                          onClick={() => setIsEditingMessage(false)}
                          className="text-xs font-bold text-brand-burgundy hover:text-brand-burgundy-dark transition-colors bg-white border border-brand-burgundy/20 px-3 py-1 rounded"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="p-3 cursor-pointer group relative"
                      onClick={() => setIsEditingMessage(true)}
                    >
                      <p className="text-xs text-gray-600 leading-relaxed italic pr-6">
                        &ldquo;{shareMessage}&rdquo;
                      </p>
                      <div className="absolute top-2 right-2 opacity-40 group-hover:opacity-100 transition-opacity">
                        <svg className="w-4 h-4 text-brand-burgundy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2 font-medium">
                        Tap to edit message before sharing
                      </p>
                    </div>
                  )}
                </div>

                {/* Share buttons */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {/* WhatsApp */}
                  <a
                    href={shareLinks.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#25D366] text-white rounded-lg font-bold text-xs hover:bg-[#1ebe57] transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp
                  </a>

                  {/* Twitter / X */}
                  <a
                    href={shareLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-black text-white rounded-lg font-bold text-xs hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X (Twitter)
                  </a>

                  {/* Facebook */}
                  <a
                    href={shareLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#1877F2] text-white rounded-lg font-bold text-xs hover:bg-[#166fe5] transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>

                  {/* Telegram */}
                  <a
                    href={shareLinks.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-[#0088cc] text-white rounded-lg font-bold text-xs hover:bg-[#0077b5] transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                    Telegram
                  </a>

                  {/* Instagram — spans full width */}
                  <button
                    onClick={handleInstagramShare}
                    className="col-span-2 flex items-center justify-center gap-2 py-2.5 px-3 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white rounded-lg font-bold text-xs hover:opacity-90 transition-opacity shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                    Instagram
                  </button>
                </div>

                {/* Copy & Native Share */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyMessage}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-bold text-xs transition-all shadow-sm border ${
                      copied 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {copied ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Copy Message
                      </>
                    )}
                  </button>

                  {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                    <button
                      onClick={handleNativeShare}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-brand-burgundy text-brand-gold rounded-lg font-bold text-xs hover:bg-brand-burgundy-dark transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                      Share...
                    </button>
                  )}
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setSuccessData(null)
                  setIdNumber('')
                  setPostcode('')
                  setSelectedSessions({ am: false, pm: false })
                  setCopied(false)
                  setShareMessage(DEFAULT_SHARE_MESSAGE)
                  setIsEditingMessage(false)
                }}
                className="px-6 py-2 bg-brand-burgundy text-brand-gold rounded font-bold hover:bg-brand-burgundy-dark transition w-full md:w-auto"
              >
                Register Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleRegister} className="space-y-6">
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-2">Select Date</label>
                <select 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors cursor-pointer appearance-none"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236b7280\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1.2em 1.2em' }}
                >
                  {availableDates.map((date) => (
                    <option key={date.id} value={date.id}>
                      {date.label} {date.id === todayString ? '(Today)' : ''}
                    </option>
                  ))}
                </select>
                {selectedDate && selectedDate < todayString && (
                  <p className="text-xs text-yellow-600 mt-2 flex items-center font-medium">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Retroactive log: Requires admin approval
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-2">Session(s) Attended</label>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    disabled={!isAmEnabled}
                    onClick={() => setSelectedSessions(prev => ({...prev, am: !prev.am}))}
                    className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all duration-200 ${
                      !isAmEnabled 
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : selectedSessions.am 
                          ? 'border-brand-burgundy bg-brand-burgundy text-brand-gold shadow-md' 
                          : 'border-gray-200 bg-white text-gray-50 hover:border-brand-burgundy hover:text-brand-burgundy'
                    }`}
                  >
                    AM Session
                  </button>
                  <button
                    type="button"
                    disabled={!isPmEnabled}
                    onClick={() => setSelectedSessions(prev => ({...prev, pm: !prev.pm}))}
                    className={`flex-1 py-3 rounded-lg border-2 font-bold transition-all duration-200 ${
                      !isPmEnabled 
                        ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
                        : selectedSessions.pm 
                          ? 'border-brand-burgundy bg-brand-burgundy text-brand-gold shadow-md' 
                          : 'border-gray-200 bg-white text-gray-500 hover:border-brand-burgundy hover:text-brand-burgundy'
                    }`}
                  >
                    PM Session
                  </button>
                </div>
                {!isAmEnabled && !isPmEnabled && (
                  <p className="text-xs text-red-500 mt-2 text-center">There are no active sessions available for this date yet.</p>
                )}
              </div>

              <hr className="border-gray-100" />

              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-1">ID Number</label>
                <input 
                  type="number" 
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="e.g. 1001"
                  required 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-1">Postcode</label>
                <input 
                  type="text" 
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value)}
                  placeholder="e.g. M16 9LX"
                  required 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || (!isAmEnabled && !isPmEnabled) || (!selectedSessions.am && !selectedSessions.pm)}
                className="w-full py-3 px-4 bg-brand-burgundy text-brand-gold rounded-lg hover:bg-brand-burgundy-dark transition font-bold mt-2 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Attendance'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  )
}