'use client'

import { useState } from 'react'

const EVENT_DATES = [
  { id: '2026-04-04', label: 'Day 1 (Apr 4)' },
  { id: '2026-04-05', label: 'Day 2 (Apr 5)' },
  { id: '2026-04-06', label: 'Day 3 (Apr 6)' },
  { id: '2026-04-07', label: 'Day 4 (Apr 7)' },
]

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
  { key: 'position', label: 'Imam or Teacher?' },
  { key: 'medical_conditions', label: 'Medical Conditions' },
]

// Normalizes nulls and strings so we don't accidentally flag a change from 'null' to ''
const normalize = (val: any) => (val === null || val === undefined) ? '' : String(val).trim()

const DetailItem = ({ label, value, isRtl = false }: { label: string, value: string | null, isRtl?: boolean }) => (
  <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm">
    <span className="block text-xs font-bold text-brand-burgundy uppercase tracking-wider mb-1">{label}</span>
    <span className={`block text-sm text-gray-900 ${isRtl ? 'font-bold text-lg' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {value || '-'}
    </span>
  </div>
)

const InputField = ({ label, value, onChange }: { label: string, value: string | null, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div>
    <label className="block text-xs font-bold text-brand-burgundy uppercase tracking-wider mb-1">{label}</label>
    <input 
      type="text" 
      value={value || ''}
      onChange={onChange}
      className="w-full px-3 py-2 bg-white border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-burgundy text-sm"
    />
  </div>
)

export default function MyDetails() {
  const [attendeeName, setAttendeeName] = useState('')
  const [postcode, setPostcode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [successData, setSuccessData] = useState<any>(null)
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([])

  // Edit State
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  
  // Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<any[]>([])
  const [editSaving, setEditSaving] = useState(false)

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessData(null)
    setAttendanceRecords([])
    setIsEditing(false)

    try {
      if (!attendeeName || !postcode) {
        throw new Error("Please enter both your name and Postcode.")
      }

      // Secure API fetch
      const response = await fetch('/api/attendee/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeName, postcode })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "An error occurred while verifying your details.")
      }

      setSuccessData(result.attendee)
      setAttendanceRecords(result.records)

    } catch (err: any) {
      setError(err.message || "An error occurred while verifying your details.")
    } finally {
      setLoading(false)
    }
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Calculate the exact changes for the UI
    const changes: any[] = []
    EDITABLE_FIELDS.forEach(f => {
      const oldVal = normalize(successData[f.key])
      const newVal = normalize(editForm[f.key])
      
      if (oldVal !== newVal) {
        changes.push({ 
          label: f.label, 
          oldVal: oldVal, 
          newVal: newVal,
          isRtl: f.key === 'arabic_name',
          key: f.key 
        })
      }
    })

    if (changes.length === 0) {
      alert("You haven't made any changes to your details.")
      return
    }

    setPendingChanges(changes)
    setShowConfirmModal(true)
  }

  const confirmAndSendRequest = async () => {
    setEditSaving(true)
    
    try {
      const changesObj: Record<string, string> = {}
      pendingChanges.forEach(change => {
        changesObj[change.key] = change.newVal
      })

      const response = await fetch('/api/attendee/request-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendee_id: successData.id,
          attendee_name: successData.attendee_name,
          tt_ticket_id: successData.tt_ticket_id,
          requested_changes: changesObj
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to submit request.")
      }

      setShowConfirmModal(false)
      setIsEditing(false)
      alert("Your details have been submitted for review. They will be updated once approved by an admin.")
    } catch (err: any) {
      alert("Failed to submit request: " + err.message)
    } finally {
      setEditSaving(false)
    }
  }

  const hasAttended = (dateId: string, session: 'am' | 'pm') => {
    return attendanceRecords.some(
      record => record.event_date === dateId && record.session_type === session
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 md:p-8">
      <div className={`w-full ${successData ? 'max-w-4xl' : 'max-w-md'} bg-gray-50 rounded-xl shadow-md border-2 border-brand-burgundy overflow-hidden transition-all duration-300 relative`}>
        
        {/* UPDATED: Centered dynamic modal replacing the full-card overlay */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200 border-2 border-brand-burgundy">
              
              <div className="p-6 md:p-8 overflow-y-auto">
                <h2 className="text-2xl font-bold text-brand-burgundy mb-2">Confirm Your Changes</h2>
                <p className="text-gray-600 mb-6">Please review the details you are requesting to change below. An admin will need to approve these changes before they take effect.</p>
                
                <div className="space-y-4">
                  {pendingChanges.map((change, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                      <span className="block text-xs font-bold text-brand-burgundy uppercase mb-2">{change.label}</span>
                      <div className="flex flex-col md:flex-row md:items-center text-sm">
                        <span className="text-red-600 line-through bg-red-50 px-3 py-1.5 rounded w-full md:w-auto" dir={change.isRtl ? 'rtl' : 'ltr'}>
                          {change.oldVal || '(Empty)'}
                        </span>
                        <svg className="w-5 h-5 text-gray-400 my-2 md:mx-4 md:my-0 transform rotate-90 md:rotate-0 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                        <span className="text-green-700 font-bold bg-green-50 px-3 py-1.5 rounded w-full md:w-auto" dir={change.isRtl ? 'rtl' : 'ltr'}>
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
                  className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded hover:bg-gray-50 transition shadow-sm"
                >
                  Go Back
                </button>
                <button 
                  onClick={confirmAndSendRequest}
                  disabled={editSaving}
                  className="px-6 py-2.5 bg-brand-burgundy text-brand-gold rounded font-bold hover:bg-brand-burgundy-dark transition disabled:opacity-50 shadow-sm"
                >
                  {editSaving ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>

            </div>
          </div>
        )}

        <div className="bg-brand-burgundy p-6 text-center text-brand-gold">
          <h1 className="text-2xl font-bold">My Details</h1>
          <p className="text-sm text-brand-gold-light mt-2">Verify your registration info & attendance</p>
        </div>

        <div className="p-6 md:p-8">
          {successData ? (
            <div className="animate-in fade-in zoom-in space-y-8">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-brand-burgundy">{successData.attendee_name}</h2>
                  <p className="text-sm font-bold text-brand-gold mt-1">ID: #{successData.id}</p>
                </div>
                <div className="flex space-x-3 w-full sm:w-auto">
                  {!isEditing && (
                    <button 
                      onClick={() => {
                        setEditForm(successData)
                        setIsEditing(true)
                      }}
                      className="px-6 py-2 bg-gray-200 text-brand-burgundy rounded font-bold hover:bg-gray-300 transition text-sm flex-1 sm:flex-none"
                    >
                      Edit Details
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setSuccessData(null)
                      setAttendeeName('')
                      setPostcode('')
                      setAttendanceRecords([])
                      setIsEditing(false)
                    }}
                    className="px-6 py-2 bg-brand-burgundy text-brand-gold rounded font-bold hover:bg-brand-burgundy-dark transition text-sm flex-1 sm:flex-none"
                  >
                    Log Out
                  </button>
                </div>
              </div>

              {!isEditing && (
                <div>
                  <h3 className="text-lg font-bold text-brand-burgundy mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    My Attendance Log
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {EVENT_DATES.map((date) => (
                      <div key={date.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
                        <span className="text-sm font-bold text-brand-burgundy mb-1">{date.label}</span>
                        <div className="flex space-x-3 mt-2 w-full justify-center">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-brand-burgundy-dark mb-1">AM</span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasAttended(date.id, 'am') ? 'bg-brand-burgundy text-brand-gold border-brand-burgundy-dark' : 'bg-gray-50 border border-gray-200 text-gray-300'}`}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={hasAttended(date.id, 'am') ? 3 : 1.5} d={hasAttended(date.id, 'am') ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} /></svg>
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-brand-burgundy-dark mb-1">PM</span>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${hasAttended(date.id, 'pm') ? 'bg-brand-burgundy text-brand-gold border-brand-burgundy-dark' : 'bg-gray-50 border border-gray-200 text-gray-300'}`}>
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={hasAttended(date.id, 'pm') ? 3 : 1.5} d={hasAttended(date.id, 'pm') ? "M5 13l4 4L19 7" : "M6 18L18 6M6 6l12 12"} /></svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-brand-burgundy mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  {isEditing ? 'Edit Registration Info' : 'Registration Info'}
                </h3>
                
                {isEditing ? (
                  <form onSubmit={handleEditSubmit} className="space-y-4 bg-gray-100 p-6 rounded-lg border border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="md:col-span-2 bg-gray-200 p-4 rounded-md border border-gray-300">
                        <span className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Admission Type (Cannot be changed)</span>
                        <span className="text-sm text-gray-700">{successData.admission_type}</span>
                      </div>

                      <div className="md:col-span-2">
                        <InputField label="Full Name" value={editForm.attendee_name} onChange={(e) => setEditForm({...editForm, attendee_name: e.target.value})} />
                      </div>
                      <div className="md:col-span-2">
                        <InputField label="Arabic Name (Ijazah)" value={editForm.arabic_name} onChange={(e) => setEditForm({...editForm, arabic_name: e.target.value})} />
                      </div>
                      <InputField label="Email Address" value={editForm.email} onChange={(e) => setEditForm({...editForm, email: e.target.value})} />
                      <InputField label="Mobile Number" value={editForm.mobile_number} onChange={(e) => setEditForm({...editForm, mobile_number: e.target.value})} />
                      <InputField label="Emergency Contact Name" value={editForm.emergency_contact_name} onChange={(e) => setEditForm({...editForm, emergency_contact_name: e.target.value})} />
                      <InputField label="Emergency Contact Number" value={editForm.emergency_contact_number} onChange={(e) => setEditForm({...editForm, emergency_contact_number: e.target.value})} />
                      <div className="md:col-span-2">
                        <InputField label="Address Line" value={editForm.address_line} onChange={(e) => setEditForm({...editForm, address_line: e.target.value})} />
                      </div>
                      <InputField label="City" value={editForm.city} onChange={(e) => setEditForm({...editForm, city: e.target.value})} />
                      <InputField label="Postal Code" value={editForm.postal_code} onChange={(e) => setEditForm({...editForm, postal_code: e.target.value})} />
                      <InputField label="Country" value={editForm.country} onChange={(e) => setEditForm({...editForm, country: e.target.value})} />
                      <InputField label="Imam or Teacher?" value={editForm.position} onChange={(e) => setEditForm({...editForm, position: e.target.value})} />
                      <div className="md:col-span-2">
                        <InputField label="Medical Conditions" value={editForm.medical_conditions} onChange={(e) => setEditForm({...editForm, medical_conditions: e.target.value})} />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                      <button 
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded font-bold hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-6 py-2 bg-brand-burgundy text-brand-gold rounded font-bold hover:bg-brand-burgundy-dark transition"
                      >
                        Review Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <DetailItem label="Arabic Name (Ijazah)" value={successData.arabic_name} isRtl={true} />
                    </div>
                    <DetailItem label="Email Address" value={successData.email} />
                    <DetailItem label="Mobile Number" value={successData.mobile_number} />
                    <DetailItem label="Admission Type" value={successData.admission_type} />
                    <DetailItem label="Emergency Contact" value={`${successData.emergency_contact_name} (${successData.emergency_contact_number})`} />
                    <div className="md:col-span-2">
                      <DetailItem label="Medical Conditions" value={successData.medical_conditions} />
                    </div>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <form onSubmit={handleCheck} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              
              {error && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-brand-burgundy mb-1">Attendee Name</label>
                <input 
                  type="text" 
                  value={attendeeName}
                  onChange={(e) => setAttendeeName(e.target.value)}
                  placeholder="e.g. John Doe"
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
                disabled={loading}
                className="w-full py-3 px-4 bg-brand-burgundy text-brand-gold rounded-lg hover:bg-brand-burgundy-dark transition font-bold mt-2 disabled:opacity-50"
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