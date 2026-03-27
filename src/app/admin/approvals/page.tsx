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

const normalize = (val: any) => (val === null || val === undefined) ? '' : String(val).trim()

// Extracts differences directly from the merged JSONB requested_changes
const getChangedFields = (mergedChanges: any, originalAttendee: any) => {
  if (!originalAttendee || !mergedChanges) return []
  const changes: any[] = []
  
  Object.keys(mergedChanges).forEach(key => {
    const fieldDef = EDITABLE_FIELDS.find(f => f.key === key)
    if (fieldDef) {
      const oldVal = normalize(originalAttendee[key])
      const newVal = normalize(mergedChanges[key])
      
      // Only show it if it still differs from the DB (in case they changed it back)
      if (oldVal !== newVal) {
        changes.push({ 
          key,
          label: fieldDef.label, 
          oldVal, 
          newVal, 
          isRtl: key === 'arabic_name' 
        })
      }
    }
  })
  return changes
}

export default function ApprovalsPage() {
  const [groupedRequests, setGroupedRequests] = useState<any[]>([])
  const [selections, setSelections] = useState<Record<number, Record<string, boolean>>>({})
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    setLoading(true)
    
    // Fetch pending requests ordered by creation date ascending (oldest first)
    const { data, error } = await supabase
      .from('detail_approval_requests')
      .select(`*, attendees (*)`)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      console.error(error)
      setLoading(false)
      return
    }

    // Group by attendee_id and merge changes (latest overrides oldest)
    const groupsMap = new Map()
    data?.forEach(req => {
      if (!groupsMap.has(req.attendee_id)) {
        groupsMap.set(req.attendee_id, {
          attendee_id: req.attendee_id,
          attendee: req.attendees,
          requestIds: [],
          mergedChanges: {}
        })
      }
      
      const group = groupsMap.get(req.attendee_id)
      group.requestIds.push(req.id)
      group.mergedChanges = { ...group.mergedChanges, ...req.requested_changes }
    })

    const groups = Array.from(groupsMap.values())
    
    // Initialize checkboxes (all true by default)
    const initialSelections: Record<number, Record<string, boolean>> = {}
    groups.forEach(group => {
      initialSelections[group.attendee_id] = {}
      Object.keys(group.mergedChanges).forEach(key => {
        initialSelections[group.attendee_id][key] = true
      })
    })

    setSelections(initialSelections)
    setGroupedRequests(groups)
    setLoading(false)
  }

  const toggleSelection = (attendeeId: number, key: string) => {
    setSelections(prev => ({
      ...prev,
      [attendeeId]: {
        ...prev[attendeeId],
        [key]: !prev[attendeeId][key]
      }
    }))
  }

  const handleProcessGroup = async (group: any, isRejectAll: boolean) => {
    const approvedFields: Record<string, string> = {}
    
    if (!isRejectAll) {
      Object.keys(group.mergedChanges).forEach(key => {
        if (selections[group.attendee_id]?.[key]) {
          approvedFields[key] = group.mergedChanges[key]
        }
      })
    }

    if (!isRejectAll && Object.keys(approvedFields).length === 0) {
      alert("Please select at least one change to approve, or click Reject All.")
      return
    }

    if (!confirm(`Are you sure you want to ${isRejectAll ? 'reject all changes' : 'approve the selected changes'} for this attendee?`)) return

    setProcessingId(group.attendee_id)
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          attendeeId: group.attendee_id,
          requestIds: group.requestIds,
          approvedFields,
          action: 'process' 
        })
      })
      
      const result = await res.json()
      if (result.success) {
        setGroupedRequests(prev => prev.filter(g => g.attendee_id !== group.attendee_id))
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
      
      {groupedRequests.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          There are no pending detail update requests.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {groupedRequests.map(group => {
            const changes = getChangedFields(group.mergedChanges, group.attendee)
            
            // If the merged changes ended up identical to the DB, skip rendering
            if (changes.length === 0) return null;

            return (
              <div key={group.attendee_id} className="bg-white rounded-lg shadow-md border border-brand-burgundy overflow-hidden">
                <div className="bg-brand-burgundy px-6 py-4 flex flex-col md:flex-row md:justify-between md:items-center text-brand-gold gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Update Request for {group.attendee?.attendee_name}</h2>
                    <p className="text-sm font-bold opacity-90">ID: #{group.attendee?.id} • {group.requestIds.length} bundled request(s)</p>
                  </div>
                  <div className="flex space-x-3 w-full md:w-auto">
                    <button 
                      onClick={() => handleProcessGroup(group, true)}
                      disabled={processingId === group.attendee_id}
                      className="flex-1 md:flex-none px-4 py-2 bg-white text-brand-burgundy rounded font-bold hover:bg-gray-100 transition text-sm disabled:opacity-50 whitespace-nowrap"
                    >
                      Reject All
                    </button>
                    <button 
                      onClick={() => handleProcessGroup(group, false)}
                      disabled={processingId === group.attendee_id}
                      className="flex-1 md:flex-none px-4 py-2 bg-brand-gold text-brand-burgundy-dark rounded font-bold hover:bg-brand-gold-light transition text-sm disabled:opacity-50 flex items-center justify-center whitespace-nowrap"
                    >
                      {processingId === group.attendee_id && (
                         <div className="w-4 h-4 border-2 border-brand-burgundy border-t-transparent rounded-full animate-spin mr-2"></div>
                      )}
                      {processingId === group.attendee_id ? 'Processing...' : 'Approve Selected'}
                    </button>
                  </div>
                </div>
                
                <div className="p-6 bg-gray-50">
                  <p className="text-sm text-gray-500 mb-4 italic">Select the specific fields you wish to approve.</p>
                  <div className="space-y-4">
                    {changes.map((change) => {
                      const isSelected = selections[group.attendee_id]?.[change.key] || false;
                      
                      return (
                        <label 
                          key={change.key} 
                          className={`flex items-start md:items-center p-4 rounded-lg border-2 transition-all cursor-pointer select-none ${isSelected ? 'bg-white border-brand-gold shadow-sm' : 'bg-gray-100 border-gray-200 opacity-70'}`}
                        >
                          <div className="pt-1 md:pt-0 mr-4">
                            <input 
                              type="checkbox" 
                              checked={isSelected}
                              onChange={() => toggleSelection(group.attendee_id, change.key)}
                              className="w-5 h-5 text-brand-burgundy rounded border-gray-300 focus:ring-brand-burgundy focus:ring-2 cursor-pointer"
                            />
                          </div>
                          
                          <div className="flex-1">
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
                        </label>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}