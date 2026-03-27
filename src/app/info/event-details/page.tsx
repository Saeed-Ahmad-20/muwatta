'use client'

import Link from 'next/link'

export default function EventDetailsInfo() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 md:px-8 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border-2 border-brand-burgundy overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-burgundy p-8 md:p-12 text-center text-brand-gold border-b-4 border-brand-gold">
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-widest">Event Details</h1>
          <h2 className="text-xl font-bold tracking-wide">The Majlis & Daily Schedule</h2>
          <p className="text-brand-gold-light mt-3 text-sm font-medium tracking-wide">April 4th – 7th, 2026 | Ashton Central Mosque</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-10 text-gray-700 leading-relaxed text-lg">
          
          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-4 flex items-center">
              <span className="mr-3 text-2xl">🎙️</span> What is a Majlis of Sama'?
            </h3>
            <p className="mb-4">
              A <em>Majlis of Sama'</em> (Gathering of Audition) is a traditional Islamic educational practice that dates back to the time of the Companions. It involves the continuous, rapid, and accurate recitation of a classical text in the presence of a master scholar.
            </p>
            <p>
              During this event, Shaykh Issam Sboui from Tunisia will read the entire Arabic text of <strong>Al-Muwatta'</strong> aloud. Shaykh Muhammad Al-Yaqoubi will preside over the gathering, listening intently, correcting pronunciation errors, explaining complex or obscure terminology, and providing brief commentary on the legal rulings (Fiqh) and spiritual lessons within the hadith.
            </p>
          </section>

          <section className="pl-6 md:pl-8 border-l-4 border-brand-gold bg-yellow-50/30 py-6 pr-4 rounded-r-xl">
            <h3 className="text-xl font-bold text-brand-burgundy mb-3">The Goal: Achieving Ijazah</h3>
            <p className="text-base">
              Attendees who remain present and attentive for the entirety of the reading will be granted an <strong>Ijazah</strong> (formal certification) at the conclusion of the event. This Ijazah places your name in an unbroken chain of transmission connecting you through Shaykh Al-Yaqoubi directly back to Imam Malik, and ultimately to the Prophet Muhammad ﷺ.
            </p>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-4 flex items-center">
              <span className="mr-3 text-2xl">🕌</span> Venue & Etiquette (Adab)
            </h3>
            <p className="mb-4">
              The recital is hosted at <strong>Ashton Central Mosque</strong> (Hillgate St, Ashton-under-Lyne OL6 9JA). As we will be gathering in a house of Allah to read the words of His Messenger ﷺ, strict etiquette is required:
            </p>
            <ul className="list-none space-y-4 mt-4 text-base">
              <li className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-brand-gold text-2xl mr-4 leading-none">•</span>
                <span><strong>Wudu:</strong> Attendees are highly encouraged to remain in a state of ritual purity (Wudu) throughout the reading.</span>
              </li>
              <li className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-brand-gold text-2xl mr-4 leading-none">•</span>
                <span><strong>Silence:</strong> Absolute silence is required while the text is being recited. Side conversations, phone usage, and disruptions break the sanctity of the transmission.</span>
              </li>
              
              {/* ========================================== */}
              {/* UPDATED: INTEGRATED PDF DOWNLOAD BOX       */}
              {/* ========================================== */}
              <li className="flex items-start bg-brand-burgundy/5 p-5 md:p-6 rounded-xl border-2 border-brand-burgundy/20 relative overflow-hidden shadow-sm">
                <span className="text-brand-burgundy text-3xl mr-4 leading-none mt-1 hidden sm:block">📖</span>
                <div className="flex-1">
                  <strong className="text-brand-burgundy text-xl block mb-2 flex items-center">
                    <span className="sm:hidden mr-2">📖</span> Following Along (Official Text)
                  </strong>
                  <p className="text-gray-700 mb-5 leading-relaxed">
                    To truly benefit from the Majlis, attendees must follow the text closely. <strong>We have provided the exact, official Arabic edition of the Muwatta' that will be recited.</strong> Please download it below to follow along and take notes.
                  </p>
                  <a
                    href="/downloads/muwatta.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    download="Muwatta_Recital_Text.pdf"
                    className="inline-flex items-center justify-center px-6 py-3 bg-brand-burgundy text-brand-gold font-bold rounded-lg hover:bg-brand-burgundy-dark transition-colors shadow-md text-sm md:text-base w-full sm:w-auto"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                    Download Official Recital PDF
                  </a>
                </div>
              </li>
              {/* ========================================== */}
              
            </ul>
          </section>

          {/* Daily Schedule */}
          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-6 flex items-center border-b border-gray-200 pb-3">
              <span className="mr-3 text-2xl">⏱️</span> Daily Schedule (April 4 - 7)
            </h3>
            
            <div className="relative border-l-2 border-brand-gold ml-3 md:ml-4 space-y-8 pb-4">
              
              {/* AM Block */}
              <div className="relative pl-8">
                <div className="absolute w-4 h-4 bg-brand-burgundy rounded-full -left-[9px] top-1 border-2 border-white shadow-sm"></div>
                <h4 className="text-xl font-bold text-gray-900">Morning Session</h4>
                <p className="text-sm font-bold text-brand-gold uppercase tracking-wider mb-3">6:30 AM – 1:00 PM</p>
                <ul className="text-base space-y-4 text-gray-600">
                  <li className="flex flex-col md:flex-row md:items-center">
                    <span className="font-black text-brand-burgundy w-20">6:30 AM</span> 
                    <span className="flex-1 font-medium text-gray-800">Morning Registration</span>
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">1 hour</span>
                  </li>
                  <li className="flex flex-col md:flex-row md:items-center">
                    <span className="font-black text-brand-burgundy w-20">7:30 AM</span> 
                    <span className="flex-1 font-bold text-gray-800">Session 1A</span>
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">2.5 hours</span>
                  </li>
                  <li className="flex flex-col md:flex-row md:items-center">
                    <span className="font-black text-brand-burgundy w-20">10:00 AM</span> 
                    <span className="flex-1 text-gray-500 italic">Break</span>
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">30 mins</span>
                  </li>
                  <li className="flex flex-col md:flex-row md:items-center">
                    <span className="font-black text-brand-burgundy w-20">10:30 AM</span> 
                    <span className="flex-1 font-bold text-gray-800">Session 1B</span>
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">2.5 hours</span>
                  </li>
                </ul>
              </div>

              {/* Midday Block */}
              <div className="relative pl-8">
                <div className="absolute w-4 h-4 bg-gray-300 rounded-full -left-[9px] top-1 border-2 border-white shadow-sm"></div>
                <h4 className="text-xl font-bold text-gray-600">Midday Break</h4>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">1:00 PM – 2:45 PM</p>
                <ul className="text-base space-y-4 text-gray-600">
                  <li className="flex flex-col md:flex-row md:items-center">
                    <span className="font-bold text-gray-500 w-20">1:00 PM</span> 
                    <span className="flex-1 text-gray-500 italic">Lunch Break</span>
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">45 mins</span>
                  </li>
                  <li className="flex flex-col md:flex-row md:items-center">
                    <span className="font-black text-brand-burgundy w-20">1:45 PM</span> 
                    <span className="flex-1 font-medium text-gray-800">Afternoon Registration</span>
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">15 mins</span>
                  </li>
                  <li className="flex flex-col md:flex-row md:items-center">
                    <span className="font-bold text-gray-500 w-20">2:00 PM</span> 
                    <span className="flex-1 text-gray-500 italic">Dhuhr Prayer</span>
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">45 mins</span>
                  </li>
                </ul>
              </div>

              {/* PM Block */}
              <div className="relative pl-8">
                <div className="absolute w-4 h-4 bg-brand-burgundy rounded-full -left-[9px] top-1 border-2 border-white shadow-sm"></div>
                <h4 className="text-xl font-bold text-gray-900">Afternoon Session</h4>
                <p className="text-sm font-bold text-brand-gold uppercase tracking-wider mb-3">2:45 PM – 9:30 PM</p>
                <ul className="text-base space-y-4 text-gray-600">
                  <li className="flex flex-col md:flex-row md:items-center">
                    <span className="font-black text-brand-burgundy w-20">2:45 PM</span> 
                    <span className="flex-1 font-bold text-gray-800">Session 2A</span>
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">3 hours</span>
                  </li>
                  <li className="flex flex-col md:flex-row md:items-center">
                    <span className="font-black text-brand-burgundy w-20">5:45 PM</span> 
                    <span className="flex-1 text-gray-500 italic">Break</span>
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">30 mins</span>
                  </li>
                  <li className="flex flex-col md:flex-row md:items-center">
                    <span className="font-bold text-gray-500 w-20">6:15 PM</span> 
                    <span className="flex-1 text-gray-500 italic">Asr Prayer</span>
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">15 mins</span>
                  </li>
                  <li className="flex flex-col md:flex-row md:items-center">
                    <span className="font-black text-brand-burgundy w-20">6:30 PM</span> 
                    <span className="flex-1 font-bold text-gray-800">Session 2B</span>
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">1 hr 21 mins</span>
                  </li>
                  <li className="flex flex-col md:flex-row md:items-center">
                    <span className="font-bold text-gray-500 w-20">7:51 PM</span> 
                    <span className="flex-1 text-gray-500 italic">Maghrib Prayer</span>
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">19 mins</span>
                  </li>
                  <li className="flex flex-col md:flex-row md:items-center">
                    <span className="font-black text-brand-burgundy w-20">8:10 PM</span> 
                    <span className="flex-1 font-bold text-gray-800">Session 2C</span>
                    <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">1 hr 20 mins</span>
                  </li>
                  <li className="flex flex-col md:flex-row md:items-center pt-2">
                    <span className="font-black text-brand-burgundy w-20">9:30 PM</span> 
                    <span className="flex-1 font-bold text-gray-800">End of Day — Dinner Served</span>
                    <span className="text-xs bg-brand-gold/20 text-brand-burgundy-dark font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">Alhamdulillah</span>
                  </li>
                </ul>
              </div>

            </div>

            <div className="mt-10 bg-red-50 text-red-800 p-5 rounded-xl border border-red-200 text-sm font-medium shadow-sm">
              <span className="text-lg block mb-1">⚠️ Important Attendance Note</span>
              To qualify for the full Ijazah, you must log your attendance via the{' '}
              <Link 
                href="/attendee/register" 
                className="font-bold underline decoration-red-300 hover:decoration-red-800 transition-colors"
              >
                Register Attendance
              </Link>{' '}
              tab.
            </div>
          </section>

        </div>

      </div>
    </div>
  )
}