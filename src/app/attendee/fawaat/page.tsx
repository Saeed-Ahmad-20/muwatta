'use client'

import { useState, useEffect } from 'react'

type FawaatGroup = {
  id: number
  owner_id: number
  start_hadith: number
  end_hadith: number
  created_at: string
  members: { attendee_id: number, role: string, name: string }[]
}

// Updated to include mobile_number
type CurrentUser = { id: number, attendee_name: string, postcode: string, mobile_number: string }

export default function FawaatNoticeboard() {
  const [groups, setGroups] = useState<FawaatGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [authForm, setAuthForm] = useState({ id: '', postcode: '' })
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState<number | null>(null)
  const [showContactsModal, setShowContactsModal] = useState<number | null>(null)
  const [contacts, setContacts] = useState<any[]>([])

  // Create Form State (added whatsapp field)
  const [createForm, setCreateForm] = useState({ start_hadith: '', end_hadith: '', whatsapp: '' })
  const [suggestedGroups, setSuggestedGroups] = useState<FawaatGroup[]>([])

  // Join Form State (added whatsapp field)
  const [joinForm, setJoinForm] = useState({ role: 'needs_catchup', whatsapp: '' })

  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      const res = await fetch('/api/fawaat')
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error)
      setGroups(result.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load groups.')
    } finally {
      setLoading(false)
    }
  }

  // --- ACTIONS ---

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAuthenticating(true)
    setError('')
    try {
      const res = await fetch('/api/fawaat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', attendee_id: parseInt(authForm.id), postcode: authForm.postcode })
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error)
      setCurrentUser({ ...result.attendee, postcode: authForm.postcode })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleCreateGroup = async (e: React.FormEvent, forceCreate = false) => {
    e.preventDefault()
    if (!currentUser) return

    const start = parseInt(createForm.start_hadith)
    const end = parseInt(createForm.end_hadith)

    // SMART SUGGESTION: Check for overlapping groups before creating
    if (!forceCreate) {
      const overlaps = groups.filter(g => start <= g.end_hadith && end >= g.start_hadith)
      if (overlaps.length > 0) {
        setSuggestedGroups(overlaps)
        return // Stop submission, show suggestions UI
      }
    }

    try {
      const res = await fetch('/api/fawaat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'create_group', 
          attendee_id: currentUser.id, 
          postcode: currentUser.postcode,
          start_hadith: start, 
          end_hadith: end,
          whatsapp_number: createForm.whatsapp
        })
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error)
      
      setShowCreateModal(false)
      setCreateForm({ start_hadith: '', end_hadith: '', whatsapp: '' })
      setSuggestedGroups([])
      fetchGroups() // Refresh board
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !showJoinModal) return

    try {
      const res = await fetch('/api/fawaat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'join_group', 
          attendee_id: currentUser.id, 
          postcode: currentUser.postcode,
          group_id: showJoinModal, 
          role: joinForm.role,
          whatsapp_number: joinForm.whatsapp
        })
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error)
      
      setShowJoinModal(null)
      setJoinForm({ role: 'needs_catchup', whatsapp: '' })
      fetchGroups()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleDeleteGroup = async (groupId: number) => {
    if (!currentUser || !confirm("Are you sure you want to delete this group?")) return
    try {
      const res = await fetch('/api/fawaat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_group', attendee_id: currentUser.id, postcode: currentUser.postcode, group_id: groupId })
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error)
      fetchGroups()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const fetchContacts = async (groupId: number) => {
    if (!currentUser) return
    try {
      const res = await fetch('/api/fawaat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_contacts', attendee_id: currentUser.id, postcode: currentUser.postcode, group_id: groupId })
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error)
      setContacts(result.data)
      setShowContactsModal(groupId)
    } catch (err: any) {
      alert(err.message)
    }
  }

  // --- RENDER HELPERS ---
  const formatWhatsApp = (num: string) => `https://wa.me/${(num || '').replace(/[\s\-\+]/g, '')}`

  // --- MODAL TRIGGERS (Prefills Data) ---
  const openCreateModal = () => {
    setCreateForm({ start_hadith: '', end_hadith: '', whatsapp: currentUser?.mobile_number || '' })
    setShowCreateModal(true)
  }

  const openJoinModal = (groupId: number) => {
    setJoinForm({ role: 'needs_catchup', whatsapp: currentUser?.mobile_number || '' })
    setShowJoinModal(groupId)
  }

  if (!currentUser) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border-2 border-brand-burgundy">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-black text-brand-burgundy uppercase">Fawaat Board</h1>
            <p className="text-sm text-gray-500 mt-2">Please verify your registration to access the Fawaat group board.</p>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded text-sm text-center font-bold">{error}</div>}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Attendee ID</label>
              <input required type="number" value={authForm.id} onChange={e => setAuthForm({...authForm, id: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-brand-burgundy" placeholder="e.g. 123" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Postcode</label>
              <input required type="text" value={authForm.postcode} onChange={e => setAuthForm({...authForm, postcode: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-brand-burgundy" placeholder="e.g. M16 9LX" />
            </div>
            <button type="submit" disabled={isAuthenticating} className="w-full py-3 bg-brand-burgundy text-brand-gold font-bold rounded-lg hover:bg-brand-burgundy-dark transition mt-4">
              {isAuthenticating ? 'Verifying...' : 'Access Board'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 px-4 md:px-8">
      
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-brand-burgundy uppercase tracking-wider">Fawaat Groups</h1>
          <p className="text-gray-600">Welcome, {currentUser.attendee_name}. Connect with others to make up missed Hadith.</p>
        </div>
        <button onClick={openCreateModal} className="px-6 py-3 bg-brand-gold text-brand-burgundy-dark font-black rounded-full shadow-lg hover:scale-105 transition transform flex items-center gap-2 border border-brand-burgundy/10">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Create Catch-up Group
        </button>
      </div>

      {/* MAIN BOARD */}
      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-burgundy border-t-transparent rounded-full animate-spin"></div></div>
        ) : groups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 text-gray-500">
            <p className="text-lg font-bold">No active groups.</p>
            <p>Be the first to create a group if you missed a section!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map(group => {
              const isOwner = group.owner_id === currentUser.id
              const isMember = group.members.some(m => m.attendee_id === currentUser.id)
              const recitersCount = group.members.filter(m => m.role === 'reciter').length
              const catchupCount = group.members.filter(m => m.role === 'needs_catchup').length

              return (
                <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                  <div className="bg-brand-burgundy p-4 text-center text-brand-gold relative">
                    <span className="text-xs font-bold tracking-widest uppercase opacity-80 block mb-1">Hadith Range</span>
                    <h2 className="text-2xl font-black">{group.start_hadith} - {group.end_hadith}</h2>
                    {isMember && <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">Joined</div>}
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                      <div className="text-center flex-1 border-r border-gray-100">
                        <span className="block text-2xl font-bold text-gray-800">{catchupCount}</span>
                        <span className="text-[10px] uppercase text-gray-500 font-bold">Need Catch-up</span>
                      </div>
                      <div className="text-center flex-1">
                        <span className={`block text-2xl font-bold ${recitersCount > 0 ? 'text-green-600' : 'text-orange-500'}`}>{recitersCount}</span>
                        <span className="text-[10px] uppercase text-gray-500 font-bold">Reciter{recitersCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>

                    <div className="mt-auto space-y-2 pt-2">
                      {isMember ? (
                        <>
                          <button onClick={() => fetchContacts(group.id)} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded flex justify-center items-center gap-2 transition">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            View Group Contacts
                          </button>
                          {isOwner && (
                            <button onClick={() => handleDeleteGroup(group.id)} className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded transition text-xs">
                              Delete Group
                            </button>
                          )}
                        </>
                      ) : (
                        <button onClick={() => openJoinModal(group.id)} className="w-full py-2 bg-brand-burgundy/10 hover:bg-brand-burgundy/20 text-brand-burgundy font-bold rounded transition">
                          Join Group
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border-2 border-brand-burgundy">
            <div className="bg-brand-burgundy px-6 py-4 flex justify-between items-center text-brand-gold">
              <h2 className="text-xl font-bold">Create Catch-up Group</h2>
              <button onClick={() => setShowCreateModal(false)} className="hover:text-white">✕</button>
            </div>
            
            {suggestedGroups.length > 0 ? (
              <div className="p-6">
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
                  <h3 className="font-bold text-orange-800">Similar Groups Found</h3>
                  <p className="text-sm text-orange-700 mt-1">There are existing groups that cover the Hadith range you requested. We recommend joining one of them to consolidate reciters!</p>
                </div>
                <div className="space-y-3 mb-6 max-h-48 overflow-y-auto">
                  {suggestedGroups.map(sg => (
                    <div key={sg.id} className="border border-gray-200 p-3 rounded-lg flex justify-between items-center bg-gray-50">
                      <div>
                        <span className="font-bold text-brand-burgundy">Hadith {sg.start_hadith} - {sg.end_hadith}</span>
                        <p className="text-xs text-gray-500">{sg.members.length} Members</p>
                      </div>
                      <button onClick={() => { 
                        setShowCreateModal(false); 
                        setJoinForm({ role: 'needs_catchup', whatsapp: createForm.whatsapp });
                        setShowJoinModal(sg.id); 
                      }} className="px-3 py-1.5 bg-brand-gold text-brand-burgundy-dark font-bold text-xs rounded">Join Instead</button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <button onClick={() => setShowCreateModal(false)} className="text-gray-500 text-sm font-bold hover:underline">Cancel</button>
                  <button onClick={(e) => handleCreateGroup(e, true)} className="text-brand-burgundy text-sm font-bold hover:underline">Create My New Group Anyway</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Start Hadith #</label>
                    <input required type="number" value={createForm.start_hadith} onChange={e => setCreateForm({...createForm, start_hadith: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-brand-burgundy focus:border-brand-burgundy" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">End Hadith #</label>
                    <input required type="number" value={createForm.end_hadith} onChange={e => setCreateForm({...createForm, end_hadith: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-brand-burgundy focus:border-brand-burgundy" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp Number <span className="normal-case font-normal text-gray-400">(Including Country Code)</span></label>
                  <input required type="tel" value={createForm.whatsapp} onChange={e => setCreateForm({...createForm, whatsapp: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-brand-burgundy focus:border-brand-burgundy" placeholder="+447..." />
                  <p className="text-[10px] text-gray-500 mt-1">This has been prefilled with your registered number, but you can change it if you prefer to use a different one for this group.</p>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-brand-burgundy text-brand-gold font-bold rounded">Create Group</button> 
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* JOIN GROUP MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-brand-burgundy px-6 py-4 flex justify-between items-center text-brand-gold">
              <h2 className="text-xl font-bold">Join Group</h2>
              <button onClick={() => setShowJoinModal(null)} className="hover:text-white">✕</button>
            </div>
            <form onSubmit={handleJoinGroup} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">My Role in this Group:</label>
                <select value={joinForm.role} onChange={e => setJoinForm({...joinForm, role: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-brand-burgundy">
                  <option value="needs_catchup">I need to catch up on this section</option>
                  <option value="reciter">I am volunteering to be the Reciter</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">WhatsApp Number <span className="normal-case font-normal text-gray-400">(Inc Code)</span></label>
                <input required type="tel" value={joinForm.whatsapp} onChange={e => setJoinForm({...joinForm, whatsapp: e.target.value})} className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-brand-burgundy focus:border-brand-burgundy" placeholder="+447..." />
                <p className="text-[10px] text-gray-500 mt-1">This has been prefilled with your registered number, but you can change it if you prefer to use a different one for this group.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button type="button" onClick={() => setShowJoinModal(null)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-gold text-brand-burgundy-dark font-bold rounded">Join Now</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONTACTS MODAL */}
      {showContactsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-brand-burgundy px-6 py-4 flex justify-between items-center text-brand-gold">
              <h2 className="text-xl font-bold">Group Members</h2>
              <button onClick={() => setShowContactsModal(null)} className="hover:text-white">✕</button>
            </div>
            <div className="p-0 max-h-96 overflow-y-auto">
              <ul className="divide-y divide-gray-100">
                {contacts.map((c, i) => (
                  <li key={i} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-gray-900">{c.name} {c.role === 'reciter' && <span className="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase">Reciter</span>}</p>
                      <p className="text-xs text-gray-500">{c.email}</p>
                    </div>
                    {c.whatsapp ? (
                      <a href={formatWhatsApp(c.whatsapp)} target="_blank" rel="noopener noreferrer" className="p-2 bg-[#25D366] text-white rounded-full hover:bg-[#1da851] transition" title="Message on WhatsApp">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded">No Mobile Provided</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center">Use the WhatsApp links to coordinate a time and location to meet during breaks.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}