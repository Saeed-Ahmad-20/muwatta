'use client'

import { useState, useEffect, useCallback } from 'react'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
interface AttendeeData {
  id: number
  attendee_name: string
  arabic_name: string | null
  email: string | null
  mobile_number: string | null
  emergency_contact_name: string | null
  emergency_contact_number: string | null
  address_line: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  position: string | null
  medical_conditions: string | null
  admission_type: string | null
  tt_ticket_id: string | null
}

interface AttendanceRecord {
  event_date: string
  session_type: 'am' | 'pm'
}

interface PendingChange {
  key: string
  label: string
  oldVal: string
  newVal: string
  isRtl: boolean
}

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const EVENT_DATES = [
  { id: '2026-04-04', label: 'Day 1 (Apr 4)' },
  { id: '2026-04-05', label: 'Day 2 (Apr 5)' },
  { id: '2026-04-06', label: 'Day 3 (Apr 6)' },
  { id: '2026-04-07', label: 'Day 4 (Apr 7)' },
] as const

// Fields the user IS allowed to edit
// NOTE: 'position' and 'admission_type' are intentionally excluded
const EDITABLE_FIELDS = [
  { key: 'attendee_name', label: 'Full Name' },
  { key: 'arabic_name', label: 'Arabic Name (Ijazah)' },
  { key: 'email', label: 'Email Address' },
  { key: 'mobile_number', label: 'Mobile Number' },
  { key: 'emergency_contact_name', label: 'Emergency Contact Name' },
  { key: 'emergency_contact_number', label: 'Emergency Contact Number' },
  { key: 'address_line', label: 'Address Line' },
  { key: 'city', label: 'City' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'country', label: 'Country' },
  { key: 'medical_conditions', label: 'Medical Conditions' },
] as const

// Fields that are displayed but CANNOT be changed
const READ_ONLY_FIELDS = [
  { key: 'admission_type', label: 'Admission Type' },
  { key: 'position', label: 'Imam or Teacher?' },
] as const

const MAX_FIELD_LENGTH = 500

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
const normalize = (val: unknown): string =>
  val === null || val === undefined ? '' : String(val).trim()

// ──────────────────────────────────────────────
// Reusable icon components
// ──────────────────────────────────────────────
function CheckCircleIcon() {
  return (
    <svg className="w-5 h-5 mr-2 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function PersonIcon() {
  return (
    <svg className="w-5 h-5 mr-2 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg className="w-5 h-5 text-gray-400 my-2 md:mx-4 md:my-0 transform rotate-90 md:rotate-0 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  )
}

function AttendanceIcon({ attended }: { attended: boolean }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={attended ? 3 : 1.5}
        d={attended ? 'M5 13l4 4L19 7' : 'M6 18L18 6M6 6l12 12'}
      />
    </svg>
  )
}

// ──────────────────────────────────────────────
// Reusable sub-components
// ──────────────────────────────────────────────
function DetailItem({
  label,
  value,
  isRtl = false,
}: {
  label: string
  value: string | null
  isRtl?: boolean
}) {
  return (
    <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm">
      <span className="block text-xs font-bold text-brand-burgundy uppercase tracking-wider mb-1">
        {label}
      </span>
      <span
        className={`block text-sm text-gray-900 ${isRtl ? 'font-bold text-lg' : ''}`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {value || '-'}
      </span>
    </div>
  )
}

function ReadOnlyField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="bg-gray-200 p-4 rounded-md border border-gray-300">
      <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
        {label} (Cannot be changed)
      </span>
      <span className="text-sm text-gray-700">{value || '-'}</span>
    </div>
  )
}

function InputField({
  id,
  label,
  value,
  onChange,
  disabled = false,
  isRtl = false,
}: {
  id: string
  label: string
  value: string | null
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
  isRtl?: boolean
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-bold text-brand-burgundy uppercase tracking-wider mb-1"
      >
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={value || ''}
        onChange={onChange}
        disabled={disabled}
        maxLength={MAX_FIELD_LENGTH}
        dir={isRtl ? 'rtl' : 'ltr'}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded
          focus:outline-none focus:ring-2 focus:ring-brand-burgundy text-sm
          disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
    </div>
  )
}

// ──────────────────────────────────────────────
// Toast / Banner feedback (replaces alert())
// ──────────────────────────────────────────────
type BannerType = 'success' | 'error'

function Banner({
  type,
  message,
  onDismiss,
}: {
  type: BannerType
  message: string
  onDismiss: () => void
}) {
  const styles =
    type === 'success'
      ? 'bg-green-50 text-green-800 border-green-200'
      : 'bg-red-50 text-red-700 border-red-200'

  return (
    <div
      role="alert"
      className={`p-3 border rounded text-sm text-center font-medium flex items-center justify-between ${styles}`}
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-3 text-current opacity-60 hover:opacity-100 font-bold"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────
export default function MyDetails() {
  const [attendeeName, setAttendeeName] = useState('')
  const [ticketCode, setTicketCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [successData, setSuccessData] = useState<AttendeeData | null>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])

  // Edit state
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<AttendeeData>>({})

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([])
  const [editSaving, setEditSaving] = useState(false)

  // User feedback banner (replaces alert())
  const [banner, setBanner] = useState<{ type: BannerType; message: string } | null>(null)

  // ── Close modal on Escape ──
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && showConfirmModal && !editSaving) {
        setShowConfirmModal(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showConfirmModal, editSaving])

  // ── Auto-dismiss banner after 6 seconds ──
  useEffect(() => {
    if (!banner) return
    const timer = setTimeout(() => setBanner(null), 6000)
    return () => clearTimeout(timer)
  }, [banner])

  // ── Check / verify attendee ──
  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessData(null)
    setAttendanceRecords([])
    setIsEditing(false)
    setBanner(null)

    try {
      const trimmedName = attendeeName.trim()
      const trimmedCode = ticketCode.trim()

      if (!trimmedName || !trimmedCode) {
        throw new Error('Please enter both your name and Ticket Code.')
      }

      const response = await fetch('/api/attendee/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendeeName: trimmedName,
          ticketCode: trimmedCode,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'An error occurred while verifying your details.')
      }

      setSuccessData(result.attendee)
      setAttendanceRecords(result.records)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'An error occurred while verifying your details.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Build diff and show confirmation ──
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!successData) return

    const changes: PendingChange[] = []

    EDITABLE_FIELDS.forEach((f) => {
      const oldVal = normalize(successData[f.key as keyof AttendeeData])
      const newVal = normalize(editForm[f.key as keyof AttendeeData])

      if (oldVal !== newVal) {
        changes.push({
          key: f.key,
          label: f.label,
          oldVal,
          newVal,
          isRtl: f.key === 'arabic_name',
        })
      }
    })

    if (changes.length === 0) {
      setBanner({ type: 'error', message: "You haven't made any changes to your details." })
      return
    }

    setPendingChanges(changes)
    setShowConfirmModal(true)
  }

  // ── Send the change request to the API ──
  const confirmAndSendRequest = async () => {
    if (!successData) return
    setEditSaving(true)

    try {
      const changesObj: Record<string, string> = {}
      pendingChanges.forEach((change) => {
        changesObj[change.key] = change.newVal
      })

      const response = await fetch('/api/attendee/request-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendee_id: successData.id,
          attendee_name: successData.attendee_name,
          tt_ticket_id: successData.tt_ticket_id,
          requested_changes: changesObj,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit request.')
      }

      setShowConfirmModal(false)
      setIsEditing(false)
      setBanner({
        type: 'success',
        message: 'Your details have been submitted for review. They will be updated once approved by an admin.',
      })
    } catch (err: unknown) {
      setBanner({
        type: 'error',
        message:
          'Failed to submit request: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
      })
    } finally {
      setEditSaving(false)
    }
  }

  // ── Helpers ──
  const hasAttended = useCallback(
    (dateId: string, session: 'am' | 'pm') =>
      attendanceRecords.some(
        (r) => r.event_date === dateId && r.session_type === session
      ),
    [attendanceRecords]
  )

  const handleLogOut = () => {
    setSuccessData(null)
    setAttendeeName('')
    setTicketCode('')
    setAttendanceRecords([])
    setIsEditing(false)
    setBanner(null)
  }

  const updateField = (key: string, value: string) => {
    setEditForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8">
      <div
        className={`w-full ${
          successData ? 'max-w-4xl' : 'max-w-md'
        } bg-gray-50 rounded-xl shadow-md border-2 border-brand-burgundy overflow-hidden transition-all duration-300 relative`}
      >
        {/* ── CONFIRMATION MODAL ── */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Confirm your changes"
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col
                animate-in fade-in zoom-in duration-200 border-2 border-brand-burgundy"
            >
              <div className="p-6 md:p-8 overflow-y-auto scrollbar-brand">
                <h2 className="text-2xl font-bold text-brand-burgundy mb-2">
                  Confirm Your Changes
                </h2>
                <p className="text-gray-600 mb-6">
                  Please review the details you are requesting to change below. An admin
                  will need to approve these changes before they take effect.
                </p>

                <div className="space-y-4">
                  {pendingChanges.map((change) => (
                    <div
                      key={change.key}
                      className="bg-gray-50 border border-gray-200 p-4 rounded-lg"
                    >
                      <span className="block text-xs font-bold text-brand-burgundy uppercase mb-2">
                        {change.label}
                      </span>
                      <div className="flex flex-col md:flex-row md:items-center text-sm">
                        <span
                          className="text-red-600 line-through bg-red-50 px-3 py-1.5 rounded w-full md:w-auto"
                          dir={change.isRtl ? 'rtl' : 'ltr'}
                        >
                          {change.oldVal || '(Empty)'}
                        </span>
                        <ArrowIcon />
                        <span
                          className="text-green-700 font-bold bg-green-50 px-3 py-1.5 rounded w-full md:w-auto"
                          dir={change.isRtl ? 'rtl' : 'ltr'}
                        >
                          {change.newVal || '(Empty)'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 rounded-b-xl">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={editSaving}
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold
                    rounded hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  onClick={confirmAndSendRequest}
                  disabled={editSaving}
                  className="px-6 py-2.5 bg-brand-burgundy text-brand-gold rounded font-bold
                    hover:bg-brand-burgundy-dark transition disabled:opacity-50 shadow-sm"
                >
                  {editSaving ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── HEADER ── */}
        <div className="bg-brand-burgundy p-6 text-center text-brand-gold">
          <h1 className="text-2xl font-bold">My Details</h1>
          <p className="text-sm text-brand-gold-light mt-2">
            Verify your registration info &amp; attendance
          </p>
        </div>

        {/* ── BODY ── */}
        <div className="p-6 md:p-8">
          {successData ? (
            <div className="animate-in fade-in zoom-in space-y-8">
              {/* Banner feedback (replaces alert()) */}
              {banner && (
                <Banner
                  type={banner.type}
                  message={banner.message}
                  onDismiss={() => setBanner(null)}
                />
              )}

              {/* Identity header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-brand-burgundy">
                    {successData.attendee_name}
                  </h2>
                  <p className="text-sm font-bold text-brand-gold mt-1">
                    ID: #{successData.id}
                  </p>
                </div>
                <div className="flex space-x-3 w-full sm:w-auto">
                  {!isEditing && (
                    <button
                      onClick={() => {
                        setEditForm({ ...successData })
                        setIsEditing(true)
                        setBanner(null)
                      }}
                      className="px-6 py-2 bg-gray-200 text-brand-burgundy rounded font-bold
                        hover:bg-gray-300 transition text-sm flex-1 sm:flex-none"
                    >
                      Edit Details
                    </button>
                  )}
                  <button
                    onClick={handleLogOut}
                    className="px-6 py-2 bg-brand-burgundy text-brand-gold rounded font-bold
                      hover:bg-brand-burgundy-dark transition text-sm flex-1 sm:flex-none"
                  >
                    Log Out
                  </button>
                </div>
              </div>

              {/* ── ATTENDANCE LOG (hidden during editing) ── */}
              {!isEditing && (
                <div>
                  <h3 className="text-lg font-bold text-brand-burgundy mb-4 flex items-center">
                    <CheckCircleIcon />
                    My Attendance Log
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {EVENT_DATES.map((date) => (
                      <div
                        key={date.id}
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center"
                      >
                        <span className="text-sm font-bold text-brand-burgundy mb-1">
                          {date.label}
                        </span>
                        <div className="flex space-x-3 mt-2 w-full justify-center">
                          {(['am', 'pm'] as const).map((session) => {
                            const attended = hasAttended(date.id, session)
                            return (
                              <div key={session} className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-brand-burgundy-dark mb-1">
                                  {session.toUpperCase()}
                                </span>
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                    attended
                                      ? 'bg-brand-burgundy text-brand-gold border-brand-burgundy-dark'
                                      : 'bg-gray-50 border border-gray-200 text-gray-300'
                                  }`}
                                >
                                  <AttendanceIcon attended={attended} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── REGISTRATION INFO ── */}
              <div>
                <h3 className="text-lg font-bold text-brand-burgundy mb-4 flex items-center">
                  <PersonIcon />
                  {isEditing ? 'Edit Registration Info' : 'Registration Info'}
                </h3>

                {isEditing ? (
                  <form
                    onSubmit={handleEditSubmit}
                    className="space-y-4 bg-gray-100 p-6 rounded-lg border border-gray-200"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ── Read-only fields ── */}
                      {READ_ONLY_FIELDS.map((f) => (
                        <div key={f.key} className="md:col-span-2">
                          <ReadOnlyField
                            label={f.label}
                            value={successData[f.key as keyof AttendeeData] as string | null}
                          />
                        </div>
                      ))}

                      {/* ── Editable fields ── */}
                      <div className="md:col-span-2">
                        <InputField
                          id="edit-attendee-name"
                          label="Full Name"
                          value={editForm.attendee_name ?? null}
                          onChange={(e) => updateField('attendee_name', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <InputField
                          id="edit-arabic-name"
                          label="Arabic Name (Ijazah)"
                          value={editForm.arabic_name ?? null}
                          isRtl
                          onChange={(e) => updateField('arabic_name', e.target.value)}
                        />
                      </div>
                      <InputField
                        id="edit-email"
                        label="Email Address"
                        value={editForm.email ?? null}
                        onChange={(e) => updateField('email', e.target.value)}
                      />
                      <InputField
                        id="edit-mobile"
                        label="Mobile Number"
                        value={editForm.mobile_number ?? null}
                        onChange={(e) => updateField('mobile_number', e.target.value)}
                      />
                      <InputField
                        id="edit-emergency-name"
                        label="Emergency Contact Name"
                        value={editForm.emergency_contact_name ?? null}
                        onChange={(e) => updateField('emergency_contact_name', e.target.value)}
                      />
                      <InputField
                        id="edit-emergency-number"
                        label="Emergency Contact Number"
                        value={editForm.emergency_contact_number ?? null}
                        onChange={(e) => updateField('emergency_contact_number', e.target.value)}
                      />
                      <div className="md:col-span-2">
                        <InputField
                          id="edit-address"
                          label="Address Line"
                          value={editForm.address_line ?? null}
                          onChange={(e) => updateField('address_line', e.target.value)}
                        />
                      </div>
                      <InputField
                        id="edit-city"
                        label="City"
                        value={editForm.city ?? null}
                        onChange={(e) => updateField('city', e.target.value)}
                      />
                      <InputField
                        id="edit-postal"
                        label="Postal Code"
                        value={editForm.postal_code ?? null}
                        onChange={(e) => updateField('postal_code', e.target.value)}
                      />
                      <InputField
                        id="edit-country"
                        label="Country"
                        value={editForm.country ?? null}
                        onChange={(e) => updateField('country', e.target.value)}
                      />
                      <div className="md:col-span-2">
                        <InputField
                          id="edit-medical"
                          label="Medical Conditions"
                          value={editForm.medical_conditions ?? null}
                          onChange={(e) => updateField('medical_conditions', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700
                          rounded font-bold hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-brand-burgundy text-brand-gold rounded font-bold
                          hover:bg-brand-burgundy-dark transition"
                      >
                        Review Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <DetailItem
                        label="Arabic Name (Ijazah)"
                        value={successData.arabic_name}
                        isRtl
                      />
                    </div>
                    <DetailItem label="Email Address" value={successData.email} />
                    <DetailItem label="Mobile Number" value={successData.mobile_number} />
                    <DetailItem label="Admission Type" value={successData.admission_type} />
                    <DetailItem label="Imam or Teacher?" value={successData.position} />
                    <DetailItem
                      label="Emergency Contact"
                      value={
                        successData.emergency_contact_name
                          ? `${successData.emergency_contact_name} (${successData.emergency_contact_number})`
                          : null
                      }
                    />
                    <div className="md:col-span-2">
                      <DetailItem
                        label="Medical Conditions"
                        value={successData.medical_conditions}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ── LOOKUP FORM (not logged in) ── */
            <form
              onSubmit={handleCheck}
              className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm"
            >
              {error && (
                <div
                  role="alert"
                  className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm text-center"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="lookup-name"
                  className="block text-sm font-bold text-brand-burgundy mb-1"
                >
                  Attendee Name
                </label>
                <input
                  id="lookup-name"
                  type="text"
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="e.g. Ali Ahmad"
                  required
                  maxLength={MAX_FIELD_LENGTH}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="lookup-ticket"
                  className="block text-sm font-bold text-brand-burgundy mb-1"
                >
                  Ticket Code
                </label>
                <input
                  id="lookup-ticket"
                  type="text"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  placeholder="e.g. TT-123456"
                  required
                  maxLength={MAX_FIELD_LENGTH}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-brand-burgundy text-brand-gold rounded-lg
                  hover:bg-brand-burgundy-dark transition font-bold mt-2 disabled:opacity-50"
              >
                {loading ? 'Retrieving...' : 'Check My Details'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}