'use client'

import { useState } from 'react'

type ManualRegisterFormProps = {
  admissionTypes: string[]
}

export default function ManualRegisterForm({ admissionTypes }: ManualRegisterFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    attendee_name: '',
    arabic_name: '',
    city: '',
    country: '',
    admission_type: admissionTypes[0] || 'General',
    category: 'Male' // Default category for ID generation
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')

    if (!formData.attendee_name.trim()) {
      setError("Full Name is required.")
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/admin/manual-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || "An error occurred.")
      }

      setSuccessMsg(`Success! ${result.attendee.attendee_name} was assigned ID: ${result.attendee.id}`)
      
      // Reset form but keep the admission type and category for quick sequential entry
      setFormData({
        attendee_name: '',
        arabic_name: '',
        city: '',
        country: '',
        admission_type: formData.admission_type,
        category: formData.category
      })

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-lg border border-gray-200 shadow-sm">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm text-center font-medium">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg text-sm text-center font-bold">
          <svg className="w-5 h-5 inline-block mr-2 -mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-brand-burgundy mb-2 uppercase tracking-wider">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="attendee_name"
            value={formData.attendee_name}
            onChange={handleChange}
            placeholder="e.g. John Doe"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors"
            required
            disabled={loading}
          />
        </div>

        {/* Arabic Name */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-brand-burgundy mb-2 uppercase tracking-wider">
            Arabic Name <span className="text-gray-400 normal-case text-xs tracking-normal ml-1"></span>
          </label>
          <input
            type="text"
            name="arabic_name"
            value={formData.arabic_name}
            onChange={handleChange}
            placeholder="e.g. محمد"
            dir="rtl"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors text-right"
            disabled={loading}
          />
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-bold text-brand-burgundy mb-2 uppercase tracking-wider">
            City <span className="text-gray-400 normal-case text-xs tracking-normal ml-1"></span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="e.g. Manchester"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors"
            disabled={loading}
          />
        </div>

        {/* Country */}
        <div>
          <label className="block text-sm font-bold text-brand-burgundy mb-2 uppercase tracking-wider">
            Country <span className="text-gray-400 normal-case text-xs tracking-normal ml-1"></span>
          </label>
          <input
            type="text"
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="e.g. England"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors"
            disabled={loading}
          />
        </div>

        {/* ID Category (Dropdown) */}
        <div className="border-t border-gray-100 pt-6 mt-2">
          <label className="block text-sm font-bold text-brand-burgundy mb-2 uppercase tracking-wider">
            Attendee Category <span className="text-red-500">*</span>
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors appearance-none font-medium text-gray-800"
            disabled={loading}
          >
            <option value="Male">Male (1001+)</option>
            <option value="Female">Female (2001+)</option>
            <option value="Baby">Baby (3001+)</option>
          </select>
        </div>

        {/* Admission Type (Dropdown) */}
        <div className="border-t border-gray-100 pt-6 mt-2">
          <label className="block text-sm font-bold text-brand-burgundy mb-2 uppercase tracking-wider">
            Admission Type <span className="text-red-500">*</span>
          </label>
          <select
            name="admission_type"
            value={formData.admission_type}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-burgundy focus:bg-white transition-colors appearance-none font-medium text-gray-800"
            disabled={loading}
          >
            {admissionTypes.length === 0 ? (
              <option value="General Admission">General Admission</option>
            ) : (
              admissionTypes.map((type, idx) => (
                <option key={idx} value={type}>{type}</option>
              ))
            )}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 px-4 bg-brand-burgundy text-brand-gold rounded-lg hover:bg-brand-burgundy-dark transition font-bold mt-4 shadow-md disabled:opacity-50"
      >
        {loading ? 'Registering Attendee...' : 'Complete Manual Registration'}
      </button>
    </form>
  )
}