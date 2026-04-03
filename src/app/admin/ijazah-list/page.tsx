'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type IjazahAttendee = {
  id: number
  attendee_name: string
  arabic_name: string | null
  checked_in_at: string | null
}

type AttendanceRecord = {
  attendee_id: number
}

export default function IjazahList() {
  const [attendees, setAttendees] = useState<IjazahAttendee[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // --- FILTERS ---
  const [showOnlyWithAttendance, setShowOnlyWithAttendance] = useState(false)
  const [checkedInAfter, setCheckedInAfter] = useState<string>('')

  // --- PDF PREVIEW STATES ---
  const [isExporting, setIsExporting] = useState(false)
  const [previewMode, setPreviewMode] = useState<'pdf' | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const docRef = useRef<jsPDF | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [ijazahRes, attendeesRes] = await Promise.all([
        fetch('/api/admin/ijazah'),
        fetch('/api/admin/attendees')
      ])

      const ijazahResult = await ijazahRes.json()
      const attendeesResult = await attendeesRes.json()

      if (!ijazahRes.ok || !ijazahResult.success) {
        throw new Error(ijazahResult.error || 'Failed to fetch Ijazah list.')
      }

      setAttendees(ijazahResult.data)

      if (attendeesRes.ok && attendeesResult.success) {
        setAttendanceRecords(attendeesResult.records || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Set of attendee IDs who have logged attendance at least once
  const attendeesWithAttendance = useMemo(() => {
    return new Set(attendanceRecords.map(r => r.attendee_id))
  }, [attendanceRecords])

  // Filtered list based on both toggles
  const filteredAttendees = useMemo(() => {
    let result = attendees

    // 1. Filter by Logged Attendance
    if (showOnlyWithAttendance) {
      result = result.filter(a => attendeesWithAttendance.has(a.id))
    }

    // 2. Filter by Checked In Date/Time
    if (checkedInAfter) {
      const filterTimestamp = new Date(checkedInAfter).getTime()
      result = result.filter(a => {
        if (!a.checked_in_at) return false // Exclude if they haven't checked in
        const attendeeTimestamp = new Date(a.checked_in_at).getTime()
        return attendeeTimestamp >= filterTimestamp
      })
    }

    return result
  }, [attendees, showOnlyWithAttendance, attendeesWithAttendance, checkedInAfter])

  // --- CSV EXPORT ---
  const handleExportCSV = () => {
    // Removed 'Checked In' from headers
    const headers = ['ID', 'English Name', 'Arabic Name']

    // Removed the checked_in_at field from the export rows
    const rows = filteredAttendees.map(a => [
      a.id,
      `"${(a.attendee_name || '').replace(/"/g, '""')}"`,
      `"${(a.arabic_name || '').replace(/"/g, '""')}"`
    ])

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

    // BOM prefix so Excel handles Arabic (UTF-8) correctly
    const bom = '\uFEFF'
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `ijazah-list-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // --- SAFE PREVIEW CLEANUP ---
  const closePreview = () => {
    if (previewMode === 'pdf' && previewContent) {
      URL.revokeObjectURL(previewContent)
    }
    setPreviewMode(null)
    setPreviewContent(null)
  }

  // --- PDF PREVIEW LOGIC (WITH ARABIC FONT) ---
  const handlePreviewPDF = async () => {
    setIsExporting(true)

    try {
      const doc = new jsPDF('p', 'mm', 'a4')

      // 1. Fetch and load the Arabic font securely
      const fontRes = await fetch('/fonts/Amiri-Regular.ttf')
      if (!fontRes.ok) {
        throw new Error("Could not load Arabic font. Make sure Amiri-Regular.ttf is in the public/fonts/ folder.")
      }
      
      const fontBuffer = await fontRes.arrayBuffer()
      const fontArray = new Uint8Array(fontBuffer)
      
      // Convert font binary to Base64 safely
      let binaryString = ''
      for (let i = 0; i < fontArray.length; i++) {
        binaryString += String.fromCharCode(fontArray[i])
      }
      const fontBase64 = window.btoa(binaryString)

      // 2. Register the font with jsPDF
      doc.addFileToVFS('Amiri-Regular.ttf', fontBase64)
      doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')

      const pageWidth = doc.internal.pageSize.getWidth()

      // Document Title
      doc.setFont("helvetica", "bold")
      doc.setFontSize(22)
      doc.setTextColor(99, 10, 56)
      doc.text('Ijazah List', pageWidth / 2, 22, { align: 'center' })

      // Document Metadata
      doc.setFont("helvetica", "normal")
      doc.setFontSize(12)
      doc.setTextColor(100)
      const dateStr = new Date().toLocaleString()
      doc.text(`Generated on: ${dateStr} | Total Records: ${filteredAttendees.length}`, pageWidth / 2, 32, { align: 'center' })

      // Table Data specifically for the Ijazah list (Removed 'Checked In' column)
      const tableColumns = ['ID', 'English Name', 'Arabic Name (Ijazah)']
      const tableRows = filteredAttendees.map(a => [
        a.id,
        a.attendee_name || '-',
        a.arabic_name || 'Not Provided'
      ])

      // 3. Render Table with Column-Specific Fonts
      autoTable(doc, {
        startY: 42,
        head: [tableColumns],
        body: tableRows,
        theme: 'grid',
        headStyles: {
          fillColor: [99, 10, 56],
          textColor: [223, 192, 99],
          fontStyle: 'bold',
          fontSize: 11,
          font: 'helvetica' 
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        styles: { 
          fontSize: 10, 
          cellPadding: 4,
          font: 'helvetica' 
        },
        columnStyles: {
          // Column index 2 is the Arabic Name
          2: { 
            font: 'Amiri', 
            halign: 'right' 
          }
        }
      })

      const pdfBlob = doc.output('blob')
      const pdfUrl = URL.createObjectURL(pdfBlob)

      docRef.current = doc
      setPreviewContent(pdfUrl)
      setPreviewMode('pdf')

    } catch (error: any) {
      console.error("PDF Preview Error:", error)
      alert(error.message || "Failed to generate PDF preview.")
    } finally {
      setIsExporting(false)
    }
  }

  // --- CONFIRM DOWNLOAD LOGIC ---
  const handleConfirmDownload = () => {
    const fileName = `ijazah_list_${new Date().toISOString().slice(0, 10)}.pdf`

    if (previewMode === 'pdf' && docRef.current) {
      docRef.current.save(fileName)
    }

    closePreview()
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 text-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-brand-burgundy rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-medium">Loading Ijazah list...</p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 p-4 md:p-8">

      {/* PREVIEW MODAL */}
      {previewMode && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-sm transition-opacity">
          <div className="bg-white w-full max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-in zoom-in-95 duration-200">

            <div className="px-6 py-4 bg-brand-burgundy text-brand-gold flex justify-between items-center shadow-md z-10">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-black uppercase tracking-wider">
                  Preview Export: {previewMode.toUpperCase()}
                </h2>
                {previewMode === 'pdf' && previewContent && (
                  <button
                    onClick={() => window.open(previewContent, '_blank')}
                    className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                    title="Open PDF in a new tab if it doesn't load below"
                  >
                    Open in New Tab <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </button>
                )}
              </div>
              <button
                onClick={closePreview}
                className="text-brand-gold hover:text-white transition-colors"
                title="Close Preview"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 bg-gray-100 overflow-hidden relative">
              {previewMode === 'pdf' && previewContent ? (
                <embed
                  src={previewContent}
                  type="application/pdf"
                  className="w-full h-full border-none"
                  title="PDF Preview"
                />
              ) : null}
            </div>

            <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end items-center gap-4">
              <button
                onClick={closePreview}
                className="px-6 py-3 border-2 border-gray-200 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDownload}
                className="px-8 py-3 bg-brand-burgundy text-brand-gold rounded-lg font-bold shadow-md hover:bg-brand-burgundy-dark hover:shadow-lg transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Confirm & Download
              </button>
            </div>

          </div>
        </div>
      )}

      {/* TOP CONTROLS */}
      <div className="max-w-6xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-brand-burgundy">Ijazah List</h1>
            <p className="text-gray-600 mt-1">Attendees who have officially checked in at the venue.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm flex items-center">
              <span className="text-sm font-bold text-gray-500 mr-2 uppercase tracking-wider">Showing:</span>
              <span className="text-lg font-black text-brand-burgundy">{filteredAttendees.length}</span>
              {(showOnlyWithAttendance || checkedInAfter) && (
                <span className="text-sm text-gray-400 ml-1">/ {attendees.length}</span>
              )}
            </div>
            
            <button
              onClick={handleExportCSV}
              disabled={filteredAttendees.length === 0}
              className="flex items-center px-4 py-2 bg-green-700 text-white rounded-lg font-bold hover:bg-green-800 transition shadow-sm disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export CSV
            </button>
            
            {/* PDF Preview Button */}
            <button
              onClick={handlePreviewPDF}
              disabled={filteredAttendees.length === 0 || isExporting}
              className="flex items-center px-4 py-2 bg-brand-burgundy text-brand-gold rounded-lg font-bold hover:bg-brand-burgundy-dark transition shadow-sm disabled:opacity-50"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              {isExporting && previewMode === null ? 'Generating...' : 'Preview PDF'}
            </button>

          </div>
        </div>

        {/* FILTERS GRID */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Attendance Toggle */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-brand-burgundy mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <div>
                <span className="text-sm font-bold text-brand-burgundy">Filter: Logged Attendance</span>
                <p className="text-xs text-gray-500 mt-0.5">Show attendees who registered at least one session</p>
              </div>
            </div>
            <button
              onClick={() => setShowOnlyWithAttendance(prev => !prev)}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:ring-offset-2 ${
                showOnlyWithAttendance ? 'bg-brand-burgundy' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  showOnlyWithAttendance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Time Filter */}
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-brand-burgundy mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <div>
                <span className="text-sm font-bold text-brand-burgundy">Checked In After</span>
                <p className="text-xs text-gray-500 mt-0.5">Filter the list to only show recent arrivals</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input 
                type="datetime-local" 
                value={checkedInAfter}
                onChange={(e) => setCheckedInAfter(e.target.value)}
                className="text-sm border border-gray-300 rounded px-3 py-1.5 focus:ring-brand-burgundy focus:border-brand-burgundy w-full sm:w-auto"
              />
              {checkedInAfter && (
                <button 
                  onClick={() => setCheckedInAfter('')} 
                  className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1 bg-red-50 rounded hover:bg-red-100 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto p-4 mb-6 bg-red-50 text-red-700 border border-red-200 rounded-lg text-center font-medium">
          {error}
        </div>
      )}

      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">

        {filteredAttendees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            {(showOnlyWithAttendance || checkedInAfter) ? (
              <>
                <p className="text-lg font-medium">No attendees matched the filters.</p>
                <p className="text-sm mt-1">Try clearing the date filter or the attendance toggle.</p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium">No attendees have checked in yet.</p>
                <p className="text-sm mt-1">Once attendees scan their tickets at the door, they will appear here.</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-burgundy text-brand-gold">
                  <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase border-b-2 border-brand-burgundy-dark w-24">ID</th>
                  <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase border-b-2 border-brand-burgundy-dark">English Name</th>
                  <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase border-b-2 border-brand-burgundy-dark text-right">Arabic Name (Ijazah)</th>
                  <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase border-b-2 border-brand-burgundy-dark text-center">Checked In</th>
                  <th className="px-6 py-4 font-bold text-sm tracking-wider uppercase border-b-2 border-brand-burgundy-dark text-center w-36">Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAttendees.map((attendee, index) => {
                  const hasAttendance = attendeesWithAttendance.has(attendee.id)
                  return (
                    <tr
                      key={attendee.id}
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} break-inside-avoid`}
                    >
                      <td className="px-6 py-4 text-gray-600 font-medium">
                        #{attendee.id}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-brand-burgundy">{attendee.attendee_name}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {attendee.arabic_name ? (
                          <span className="font-bold text-lg text-gray-900 font-serif" dir="rtl">
                            {attendee.arabic_name}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-sm italic">Not Provided</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center text-sm text-gray-600">
                        {attendee.checked_in_at 
                          ? new Date(attendee.checked_in_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) 
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {hasAttendance ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                            Logged
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
                            <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            None
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}