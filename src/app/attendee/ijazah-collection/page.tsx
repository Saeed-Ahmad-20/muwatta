'use client'

export default function IjazahCollection() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-brand-burgundy/10 text-brand-burgundy rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
          />
        </svg>
      </div>

      <h1 className="text-3xl font-black text-brand-burgundy mb-3 uppercase tracking-wide">
        Ijazah Collection
      </h1>

      <p className="text-gray-500 font-medium max-w-md mx-auto mb-6 leading-relaxed">
        This feature is currently under development. You will be able to view and collect your Ijazah certificate here soon, in shā&apos; Allāh.
      </p>

      <div className="inline-flex items-center gap-2 bg-brand-burgundy/5 text-brand-burgundy font-bold text-sm px-5 py-2.5 rounded-full border border-brand-burgundy/20">
        <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse"></span>
        Coming Soon
      </div>
    </div>
  )
}