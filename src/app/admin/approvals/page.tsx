'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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

// Normalizes data so we compare apples to apples
const normalize = (val: any) => (val === null || val === undefined) ? '' : String(val).trim()

// Extracts only the exact differences between the proposed changes and the original DB record
const getChangedFields = (proposed: any, original: any) => {
  if (!original) return []
  const changes: any[] = []
  
  EDITABLE_FIELDS.forEach(f => {
    const oldVal = normalize(original[f.key])
    const newVal = normalize(proposed[f.key])
    if (oldVal !== newVal) {
      changes.push({ label: f.label, oldVal, newVal, isRtl: f.key === 'arabic_name' })
    }
  })
  return changes
}

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    // We request '*' from attendees so we can compare every field
    const { data, error } = await supabase
      .from('attendee_update_requests')
      .select(`
        *,
        attendees (*)
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else setRequests(data || [])
    
    setLoading(false)
  }

  const handleAction = async (requestId: number, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this request?`)) return

    setProcessingId(requestId)
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action })
      })
      
      const result = await res.json()
      if (result.success) {
        setRequests(prev => prev.filter(r => r.id !== requestId))
      } else {
        alert("Failed to process request: " + result.error)
      }
    } catch (err: any) {
      alert("Error: " + err.message)
    }
    setProcessingId(null)
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-brand-burgundy rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-brand-burgundy mb-6">Pending Approvals</h1>
      
      {requests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          There are no pending detail update requests.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {requests.map(req => {
            const changes = getChangedFields(req, req.attendees)
            
            return (
              <div key={req.id} className="bg-white rounded-lg shadow-md border border-brand-burgundy overflow-hidden">
                <div className="bg-brand-burgundy px-6 py-4 flex justify-between items-center text-brand-gold">
                  <div>
                    <h2 className="text-xl font-bold">Update Request for {req.attendees?.attendee_name}</h2>
                    <p className="text-sm font-bold opacity-90">ID: #{req.attendees?.id}</p>
                  </div>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleAction(req.id, 'reject')}
                      disabled={processingId === req.id}
                      className="px-4 py-2 bg-white text-brand-burgundy rounded font-bold hover:bg-gray-100 transition text-sm disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleAction(req.id, 'approve')}
                      disabled={processingId === req.id}
                      className="px-4 py-2 bg-brand-gold text-brand-burgundy-dark rounded font-bold hover:bg-brand-gold-light transition text-sm disabled:opacity-50 flex items-center"
                    >
                      {processingId === req.id && (
                         <div className="w-4 h-4 border-2 border-brand-burgundy border-t-transparent rounded-full animate-spin mr-2"></div>
                      )}
                      {processingId === req.id ? 'Processing...' : 'Approve'}
                    </button>
                  </div>
                </div>
                
                <div className="p-6 bg-gray-50">
                  {changes.length === 0 ? (
                     <div className="text-gray-500 italic">No specific field changes were detected.</div>
                  ) : (
                    <div className="space-y-4">
                      {changes.map((change, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                          <span className="block text-xs font-bold text-brand-burgundy uppercase tracking-wider mb-2">{change.label}</span>
                          <div className="flex flex-col md:flex-row md:items-center text-sm">
                            
                            <span className="text-red-600 line-through bg-red-50 px-3 py-1.5 rounded w-full md:w-1/2" dir={change.isRtl ? 'rtl' : 'ltr'}>
                              {change.oldVal || '(Empty)'}
                            </span>
                            
                            <svg className="w-5 h-5 text-gray-400 my-2 md:mx-4 md:my-0 transform rotate-90 md:rotate-0 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            
                            <span className="text-green-700 font-bold bg-green-50 px-3 py-1.5 rounded w-full md:w-1/2" dir={change.isRtl ? 'rtl' : 'ltr'}>
                              {change.newVal || '(Empty)'}
                            </span>
                            
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}