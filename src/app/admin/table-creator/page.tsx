'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ALL_COLUMNS = [
  { id: 'id', label: 'ID' },
  { id: 'name', label: 'Name' },
  { id: 'admission', label: 'Admission' },
  { id: 'country', label: 'Country' },
  { id: 'contact', label: 'Contact Number' },
  { id: 'position', label: 'Position' }
]

// --- TYPESCRIPT INTERFACES ---
interface Attendee {
  id: number
  name: string
  arabic_name: string | null
  admission: string
  country: string
  contact: string
  position: string
  [key: string]: any
}

interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

interface MultiSelectDropdownProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
}

// --- HELPER COMPONENT: Multi-Select Dropdown ---
function MultiSelectDropdown({ label, options, selected, onChange }: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([...options])
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const displayText = selected.length === 0
    ? 'None'
    : selected.length === options.length
      ? 'All'
      : selected.length === 1
        ? selected[0]
        : `${selected.length} Selected`

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">{label}</label>
      <div
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer flex justify-between items-center hover:bg-white transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-gray-800 truncate pr-2">{displayText}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-72 flex flex-col">
          {options.length === 0 ? (
            <div className="p-3 text-sm text-gray-500">No options available</div>
          ) : (
            <>
              <div className="flex justify-between items-center p-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="text-xs font-bold text-brand-burgundy hover:underline px-2 py-1"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-bold text-gray-500 hover:text-gray-900 hover:underline px-2 py-1"
                >
                  Clear
                </button>
              </div>
              <div className="p-2 space-y-1 overflow-y-auto">
                {options.map(option => (
                  <label key={option} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={selected.includes(option)}
                      onChange={() => toggleOption(option)}
                      className="w-4 h-4 text-brand-burgundy rounded border-gray-300 focus:ring-brand-burgundy"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminExportPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  // Filtering States
  const [selectedAdmissions, setSelectedAdmissions] = useState<string[]>([])
  const [selectedCountries, setSelectedCountries] = useState<string[]>([])
  const [selectedPositions, setSelectedPositions] = useState<string[]>([])

  // Row Omission State
  const [omittedRowIds, setOmittedRowIds] = useState<Set<number>>(new Set())

  // Column Visibility State
  const [selectedColumns, setSelectedColumns] = useState<string[]>(ALL_COLUMNS.map(c => c.label))

  // --- MULTI-SORT STATE ---
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>([{ key: 'id', direction: 'asc' }])
  const [isMultiSortMode, setIsMultiSortMode] = useState(false)

  // Export & Preview States
  const [documentTitle, setDocumentTitle] = useState('Muwatta Recital - Attendee List')
  const [isExporting, setIsExporting] = useState(false)
  const [previewMode, setPreviewMode] = useState<'pdf' | 'csv' | null>(null)
  const [previewContent, setPreviewContent] = useState<string | null>(null)

  const docRef = useRef<jsPDF | null>(null)
  const csvRef = useRef<string | null>(null)

  // --- FETCH DATA FROM API ---
  useEffect(() => {
    const fetchAttendees = async () => {
      setIsLoading(true)
      setFetchError('')

      try {
        const response = await fetch('/api/admin/attendees')
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || "Failed to fetch attendees.")
        }

        const rawAttendees = result.attendees || []

        const formattedData: Attendee[] = rawAttendees.map((att: any) => ({
          id: att.id,
          name: att.attendee_name || '-',
          arabic_name: att.arabic_name || null,
          admission: att.admission_type || 'General',
          country: att.country || 'Unknown',
          contact: att.mobile_number || '-',
          position: att.position || 'Unknown'
        }))

        setAttendees(formattedData)

      } catch (err: any) {
        console.error("Fetch Error:", err)
        setFetchError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAttendees()
  }, [])

  const uniqueAdmissions = useMemo(() => Array.from(new Set(attendees.map(a => a.admission))).sort(), [attendees])
  const uniqueCountries = useMemo(() => Array.from(new Set(attendees.map(a => a.country))).sort(), [attendees])
  const uniquePositions = useMemo(() => Array.from(new Set(attendees.map(a => a.position))).sort(), [attendees])
  const allColumnLabels = useMemo(() => ALL_COLUMNS.map(c => c.label), [])

  const filteredAttendees = useMemo(() => {
    return attendees.filter((attendee) => {
      const matchesAdmission = selectedAdmissions.length === 0 || selectedAdmissions.includes(attendee.admission)
      const matchesCountry = selectedCountries.length === 0 || selectedCountries.includes(attendee.country)
      const matchesPosition = selectedPositions.length === 0 || selectedPositions.includes(attendee.position)
      const isNotOmitted = !omittedRowIds.has(attendee.id)

      return matchesAdmission && matchesCountry && matchesPosition && isNotOmitted
    })
  }, [attendees, selectedAdmissions, selectedCountries, selectedPositions, omittedRowIds])

  // --- MULTI-SORT LOGIC ---
  const sortedAttendees = useMemo(() => {
    let sortableItems = [...filteredAttendees]
    if (sortConfigs.length > 0) {
      sortableItems.sort((a, b) => {
        for (let i = 0; i < sortConfigs.length; i++) {
          const { key, direction } = sortConfigs[i];
          let valA = a[key]
          let valB = b[key]

          if (typeof valA === 'string') valA = valA.toLowerCase()
          if (typeof valB === 'string') valB = valB.toLowerCase()

          if (valA < valB) return direction === 'asc' ? -1 : 1
          if (valA > valB) return direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [filteredAttendees, sortConfigs])

  // --- ROW OMISSION HELPERS ---
  const toggleOmitRow = (id: number) => {
    setOmittedRowIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const clearAllOmissions = () => {
    setOmittedRowIds(new Set())
  }

  // Track which rows are visible but "staged" for omission via checkboxes
  // We use a separate state so the user can check rows in the table and then confirm omission
  const [stagedOmissions, setStagedOmissions] = useState<Set<number>>(new Set())

  const toggleStagedOmission = (id: number) => {
    setStagedOmissions(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleAllStagedOmissions = () => {
    if (stagedOmissions.size === sortedAttendees.length) {
      setStagedOmissions(new Set())
    } else {
      setStagedOmissions(new Set(sortedAttendees.map(a => a.id)))
    }
  }

  const confirmOmitStagedRows = () => {
    setOmittedRowIds(prev => {
      const next = new Set(prev)
      stagedOmissions.forEach(id => next.add(id))
      return next
    })
    setStagedOmissions(new Set())
  }

  const requestSort = (key: string, event: React.MouseEvent) => {
    const isMulti = isMultiSortMode || event.shiftKey || event.ctrlKey || event.metaKey

    setSortConfigs(prev => {
      const existingIndex = prev.findIndex(sc => sc.key === key)
      let newSorts = [...prev]

      if (isMulti) {
        if (existingIndex >= 0) {
          newSorts[existingIndex].direction = newSorts[existingIndex].direction === 'asc' ? 'desc' : 'asc'
        } else {
          newSorts.push({ key, direction: 'asc' })
        }
        return newSorts
      } else {
        if (prev.length === 1 && prev[0].key === key) {
          return [{ key, direction: prev[0].direction === 'asc' ? 'desc' : 'asc' }]
        }
        return [{ key, direction: 'asc' }]
      }
    })
  }

  const toggleSortDirection = (key: string) => {
    setSortConfigs(prev => prev.map(sc =>
      sc.key === key ? { ...sc, direction: sc.direction === 'asc' ? 'desc' : 'asc' } : sc
    ))
  }

  const removeSort = (key: string) => {
    setSortConfigs(prev => {
      const newSorts = prev.filter(sc => sc.key !== key)
      if (newSorts.length === 0) return [{ key: 'id', direction: 'asc' }]
      return newSorts
    })
  }

  // --- SAFE PREVIEW CLEANUP ---
  const closePreview = () => {
    if (previewMode === 'pdf' && previewContent) {
      URL.revokeObjectURL(previewContent)
    }
    setPreviewMode(null)
    setPreviewContent(null)
  }

  // --- CSV PREVIEW LOGIC ---
  const handlePreviewCSV = () => {
    setIsExporting(true)
    try {
      const activeCols = ALL_COLUMNS.filter(c => selectedColumns.includes(c.label))
      const headers = activeCols.map(c => c.label)

      const csvRows = sortedAttendees.map(a => {
        return activeCols.map(col => {
          let val = a[col.id] || ''
          return `"${String(val).replace(/"/g, '""')}"`
        }).join(',')
      })

      const csvContent = [headers.join(','), ...csvRows].join('\n')

      csvRef.current = csvContent
      setPreviewContent(csvContent)
      setPreviewMode('csv')

    } catch (error) {
      console.error("CSV Preview Error:", error)
      alert("Failed to generate CSV preview.")
    } finally {
      setIsExporting(false)
    }
  }

  // --- PDF PREVIEW LOGIC ---
  const handlePreviewPDF = () => {
    setIsExporting(true)

    setTimeout(() => {
      try {
        const doc = new jsPDF('p', 'mm', 'a4')
        const pageWidth = doc.internal.pageSize.getWidth()

        doc.setFont("helvetica", "bold")
        doc.setFontSize(22)
        doc.setTextColor(99, 10, 56)
        doc.text(documentTitle || 'Attendee List', pageWidth / 2, 22, { align: 'center' })

        doc.setFont("helvetica", "normal")
        doc.setFontSize(12)
        doc.setTextColor(100)

        const activeCols = ALL_COLUMNS.filter(c => selectedColumns.includes(c.label))
        const tableColumns = activeCols.map(c => c.label)

        const tableRows = sortedAttendees.map(a =>
          activeCols.map(col => a[col.id] || '-')
        )

        autoTable(doc, {
          startY: 42,
          head: [tableColumns],
          body: tableRows,
          theme: 'grid',
          headStyles: {
            fillColor: [99, 10, 56],
            textColor: [223, 192, 99],
            fontStyle: 'bold',
            fontSize: 12,
          },
          alternateRowStyles: { fillColor: [249, 250, 251] },
          styles: {
            fontSize: 10.5,
            cellPadding: 5
          },
        })

        const pdfBlob = doc.output('blob')
        const pdfUrl = URL.createObjectURL(pdfBlob)

        docRef.current = doc
        setPreviewContent(pdfUrl)
        setPreviewMode('pdf')

      } catch (error) {
        console.error("PDF Preview Error:", error)
        alert("Failed to generate PDF preview.")
      } finally {
        setIsExporting(false)
      }
    }, 50)
  }

  // --- CONFIRM DOWNLOAD LOGIC ---
  const handleConfirmDownload = () => {
    const fileName = `${(documentTitle || 'export').replace(/\s+/g, '_').toLowerCase()}.${previewMode}`

    if (previewMode === 'pdf' && docRef.current) {
      docRef.current.save(fileName)
    } else if (previewMode === 'csv' && csvRef.current) {
      const blob = new Blob([csvRef.current], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }

    closePreview()
  }

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <div className="text-center text-brand-burgundy space-y-4">
          <svg className="w-12 h-12 animate-spin mx-auto text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <p className="font-bold text-lg animate-pulse">Loading Attendee Data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 md:px-8">

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
              ) : (
                <div className="w-full h-full p-4 md:p-8 overflow-auto">
                  <div className="bg-white p-6 border border-gray-300 rounded-lg shadow-sm min-h-full">
                    <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap break-all">
                      {previewContent}
                    </pre>
                  </div>
                </div>
              )}
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

      {/* MAIN PAGE CONTENT */}
      <div className="max-w-[90rem] mx-auto space-y-8">

        {fetchError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-bold shadow-sm">
            Error loading data: {fetchError}
          </div>
        )}

        {/* Page Header */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-black text-brand-burgundy uppercase tracking-wider mb-2">Data Export</h1>
            <p className="text-gray-500 font-medium">Build custom data tables, preview, and export to PDF or CSV.</p>
          </div>
          <div className="flex items-center gap-4">
            {omittedRowIds.size > 0 && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg font-bold border border-red-200 flex items-center gap-2">
                <span>{omittedRowIds.size} Row{omittedRowIds.size !== 1 ? 's' : ''} Omitted</span>
                <button
                  onClick={clearAllOmissions}
                  className="text-red-500 hover:text-red-800 font-bold text-sm underline"
                >
                  Restore All
                </button>
              </div>
            )}
            <div className="bg-brand-burgundy/10 text-brand-burgundy px-4 py-2 rounded-lg font-bold border border-brand-burgundy/20">
              Total Records: {sortedAttendees.length}
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border-2 border-brand-burgundy">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">

            <div className="lg:col-span-1">
              <MultiSelectDropdown
                label="Columns"
                options={allColumnLabels}
                selected={selectedColumns}
                onChange={setSelectedColumns}
              />
            </div>

            <div className="lg:col-span-1">
              <MultiSelectDropdown
                label="Admission Type"
                options={uniqueAdmissions}
                selected={selectedAdmissions}
                onChange={setSelectedAdmissions}
              />
            </div>

            <div className="lg:col-span-1">
              <MultiSelectDropdown
                label="Country"
                options={uniqueCountries}
                selected={selectedCountries}
                onChange={setSelectedCountries}
              />
            </div>

            <div className="lg:col-span-1">
              <MultiSelectDropdown
                label="Position"
                options={uniquePositions}
                selected={selectedPositions}
                onChange={setSelectedPositions}
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-bold text-brand-burgundy mb-2 uppercase tracking-wider">Export Title</label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="e.g. VIP Guest List"
                className="w-full px-4 py-3 bg-brand-gold/10 border border-brand-gold/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-gold focus:bg-white transition-colors font-medium text-brand-burgundy"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row justify-end gap-4">
            <button
              onClick={handlePreviewCSV}
              disabled={isExporting || sortedAttendees.length === 0 || selectedColumns.length === 0}
              className="py-3 px-6 bg-[#1D6F42] text-white rounded-lg hover:bg-[#155331] transition-all font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              {isExporting && previewMode === null ? 'Generating...' : 'Preview CSV'}
            </button>
            <button
              onClick={handlePreviewPDF}
              disabled={isExporting || sortedAttendees.length === 0 || selectedColumns.length === 0}
              className="py-3 px-6 bg-brand-burgundy text-brand-gold rounded-lg hover:bg-brand-burgundy-dark transition-all font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              {isExporting && previewMode === null ? 'Generating...' : 'Preview PDF'}
            </button>
          </div>
        </div>

        {/* Excel-Like Data Table */}
        <div className="bg-white rounded-xl shadow border border-gray-300 overflow-hidden">

          {/* SORT BUILDER UI & ROW OMISSION CONTROLS */}
          <div className="bg-gray-50 border-b border-gray-300 px-4 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-bold text-gray-600 uppercase tracking-wider">Sorted By:</span>
              {sortConfigs.map((sc, index) => {
                const colLabel = ALL_COLUMNS.find(c => c.id === sc.key)?.label || sc.key;
                return (
                  <div key={sc.key} className="flex items-center bg-white border border-brand-burgundy rounded-full px-3 py-1 text-sm font-medium text-brand-burgundy shadow-sm">
                    <span className="mr-1">{index + 1}. {colLabel}</span>
                    <button onClick={() => toggleSortDirection(sc.key)} className="px-1 hover:text-brand-gold transition-colors">
                      {sc.direction === 'asc' ? '▲' : '▼'}
                    </button>
                    <button onClick={() => removeSort(sc.key)} className="ml-1 pl-1 border-l border-brand-burgundy/30 hover:text-red-500 transition-colors">
                      ✕
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-4 md:pl-4 md:border-l border-gray-300 self-start md:self-auto">
              {/* Omit Selected Rows Button */}
              {stagedOmissions.size > 0 && (
                <button
                  onClick={confirmOmitStagedRows}
                  className="text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Omit {stagedOmissions.size} Row{stagedOmissions.size !== 1 ? 's' : ''}
                </button>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-600 whitespace-nowrap hidden sm:inline-block">Multi-Sort Mode:</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isMultiSortMode}
                  onClick={() => setIsMultiSortMode(!isMultiSortMode)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:ring-offset-2 ${isMultiSortMode ? 'bg-brand-burgundy' : 'bg-gray-300'}`}
                >
                  <span className="sr-only">Toggle Multi-Sort</span>
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isMultiSortMode ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-xs text-gray-400 italic">
                  {isMultiSortMode ? 'Tap headers to stack sorts' : 'Hold Shift or toggle mode'}
                </span>
              </div>
            </div>

          </div>

          <div className="overflow-x-auto">
            {selectedColumns.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                <div className="text-4xl mb-3">👁️</div>
                <p className="font-medium text-lg">No columns selected. Please select columns to view data.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap table-auto">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300 text-gray-700 select-none">
                    {/* Checkbox column for row omission */}
                    <th className="px-3 py-3 border-r border-gray-300 w-12">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={sortedAttendees.length > 0 && stagedOmissions.size === sortedAttendees.length}
                          onChange={toggleAllStagedOmissions}
                          className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                          title="Select all rows to omit"
                        />
                      </div>
                    </th>
                    {ALL_COLUMNS.filter(c => selectedColumns.includes(c.label)).map((col) => {
                      const sortIndex = sortConfigs.findIndex(sc => sc.key === col.id)
                      const sortRule = sortIndex >= 0 ? sortConfigs[sortIndex] : null

                      return (
                        <th
                          key={col.id}
                          onClick={(e) => requestSort(col.id, e)}
                          className="px-4 py-3 font-bold text-sm uppercase tracking-wider border-r border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            {col.label}
                            <span className={`transition-colors ${sortRule ? 'text-brand-burgundy opacity-100' : 'text-gray-400 opacity-0 group-hover:opacity-100'}`}>
                              {sortRule?.direction === 'desc' ? '▼' : '▲'}
                              {sortConfigs.length > 1 && sortRule && (
                                <span className="text-xs ml-0.5 font-black">({sortIndex + 1})</span>
                              )}
                            </span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {sortedAttendees.length > 0 ? (
                    sortedAttendees.map((attendee) => (
                      <tr
                        key={attendee.id}
                        className={`transition-colors ${stagedOmissions.has(attendee.id) ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-blue-50'}`}
                      >
                        {/* Checkbox cell */}
                        <td className="px-3 py-2 border-r border-gray-200">
                          <div className="flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={stagedOmissions.has(attendee.id)}
                              onChange={() => toggleStagedOmission(attendee.id)}
                              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
                              title={`Select row ${attendee.id} to omit`}
                            />
                          </div>
                        </td>
                        {selectedColumns.includes('ID') && <td className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200">{attendee.id}</td>}
                        {selectedColumns.includes('Name') && (
                          <td className="px-4 py-2 border-r border-gray-200">
                            <div className="text-sm font-bold text-brand-burgundy">{attendee.name}</div>
                          </td>
                        )}
                        {selectedColumns.includes('Admission') && <td className="px-4 py-2 text-sm text-gray-800 border-r border-gray-200">{attendee.admission}</td>}
                        {selectedColumns.includes('Country') && <td className="px-4 py-2 text-sm text-gray-800 border-r border-gray-200">{attendee.country}</td>}
                        {selectedColumns.includes('Contact Number') && <td className="px-4 py-2 text-sm text-gray-800 border-r border-gray-200 font-mono">{attendee.contact}</td>}
                        {selectedColumns.includes('Position') && <td className="px-4 py-2 text-sm text-gray-800">{attendee.position}</td>}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={selectedColumns.length + 1} className="px-4 py-12 text-center text-gray-500">
                        <div className="text-4xl mb-3">📋</div>
                        <p className="font-medium text-lg">No attendees found matching your filters.</p>
                        {omittedRowIds.size > 0 && (
                          <button onClick={clearAllOmissions} className="mt-3 text-sm font-bold text-brand-burgundy underline hover:text-brand-burgundy-dark">
                            Restore all omitted rows
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}