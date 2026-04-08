'use client'

import React from 'react'

// Mock data for your PDFs - update the filenames to match what is actually in your public/downloads folder
const resources = [
  {
    id: 1,
    title: "Al-Muwatta of Imam Malik (Arabic)",
    description: "The complete Arabic text of the Muwatta which will be recited during the gathering.",
    type: "Primary Text",
    size: "33.9 MB",
    link: "/downloads/muwatta.pdf" 
  },
  {
    id: 2,
    title: "دليل السالك إلى موطأ الإمام مالك",
    description: "The complete Arabic text of the Muwatta which will be recited during the gathering.",
    type: "Primary Text",
    size: "4.9 MB",
    link: "/downloads/دليل السالك إلى موطأ الإمام مالك.pdf" 
  },
  {
    id: 3,
    title: "التقصي_لما_في_الموطأ_من_حديث_النبى",
    description: "The complete Arabic text of the Muwatta which will be recited during the gathering.",
    type: "Primary Text",
    size: "11.6 MB",
    link: "/downloads/التقصي_لما_في_الموطأ_من_حديث_النبى.pdf" 
  },
  {
    id: 4,
    title: "كشف المغطا في فضل الموطا",
    description: "The complete Arabic text of the Muwatta which will be recited during the gathering.",
    type: "Primary Text",
    size: "490 KB",
    link: "/downloads/كشف المغطا في فضل الموطا.pdf" 
  },
  {
    id: 5,
    title: "حديث الرحمة المسلسل بالأولية",
    description: "The complete Arabic text of the Muwatta which will be recited during the gathering.",
    type: "Primary Text",
    size: "61.8 KB",
    link: "/downloads/حديث الرحمة المسلسل بالأولية.pdf" 
  },
  {
    id: 6,
    title: "أسانيد أصول طبعة المجلس العلمي الأعلى للموطأ",
    description: "The complete Arabic text of the Muwatta which will be recited during the gathering.",
    type: "Primary Text",
    size: "147 KB",
    link: "/downloads/أسانيد أصول طبعة المجلس العلمي الأعلى للموطأ .pdf" 
  }
]


export default function LearningResourcesPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-8 px-4 md:px-8">
      
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-10 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-brand-burgundy uppercase tracking-wider mb-2">
            Learning Resources
          </h1>
          <p className="text-gray-600 max-w-2xl text-lg">
            Download the texts, translations, and supplementary materials that will be covered during the Majlis.
          </p>
        </div>
        <div className="hidden md:flex items-center justify-center w-16 h-16 bg-brand-burgundy/10 rounded-full text-brand-burgundy">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      </div>

      {/* RESOURCES GRID */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {resources.map((resource) => (
            <div 
              key={resource.id} 
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row hover:shadow-md hover:border-brand-gold/50 transition-all duration-300 group"
            >
              {/* Left Side: Icon/Type */}
              <div className="bg-gray-50 sm:w-40 p-6 flex flex-col items-center justify-center border-b sm:border-b-0 sm:border-r border-gray-100 group-hover:bg-brand-burgundy/5 transition-colors">
                <svg className="w-12 h-12 text-brand-burgundy mb-3 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>

              {/* Right Side: Content & Buttons */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-burgundy transition-colors">
                      {resource.title}
                    </h3>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-between mt-auto pt-4 border-t border-gray-100 gap-3">
                  <span className="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
                    {resource.size}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {/* View Button */}
                    <a 
                      href={resource.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2 bg-brand-burgundy/10 text-brand-burgundy text-xs font-bold rounded-lg hover:bg-brand-burgundy/20 transition-colors"
                      title="Open in new tab"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      View
                    </a>

                    {/* Download Button */}
                    <a 
                      href={resource.link} 
                      download
                      className="inline-flex items-center justify-center px-4 py-2 bg-brand-burgundy text-brand-gold text-xs font-bold rounded-lg hover:bg-brand-burgundy-dark transition-colors shadow-sm"
                      title="Download file to your device"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
