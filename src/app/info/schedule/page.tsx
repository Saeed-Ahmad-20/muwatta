'use client'

import Link from 'next/link'

export default function ScheduleInfo() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 md:px-8 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border-2 border-brand-burgundy overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-burgundy p-8 md:p-12 text-center text-brand-gold border-b-4 border-brand-gold">
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-widest">Daily Schedule</h1>
          <p className="text-brand-gold-light mt-3 text-sm font-medium tracking-wide">April 4th – 7th, 2026 | Ashton Central Mosque</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-10 text-gray-700 leading-relaxed text-lg">

          {/* Daily Schedule */}
          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-6 flex items-center border-b border-gray-200 pb-3">
              <span className="mr-3 text-2xl">⏱️</span> Standard Timetable
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