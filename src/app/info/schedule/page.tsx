'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const EVENT_DAYS = [
  {
    id: 'day-1',
    dateStr: '2026-04-04',
    title: 'Day 1',
    subtitle: 'Saturday, April 4th',
    maghribTime: '7:51 PM', 
    lunchFood: 'TBC',
    dinnerFood: 'TBC',
    isKhatam: false
  },
  {
    id: 'day-2',
    dateStr: '2026-04-05',
    title: 'Day 2',
    subtitle: 'Sunday, April 5th',
    maghribTime: '7:53 PM',
    lunchFood: 'TBC',
    dinnerFood: 'TBC',
    isKhatam: false
  },
  {
    id: 'day-3',
    dateStr: '2026-04-06',
    title: 'Day 3',
    subtitle: 'Monday, April 6th',
    maghribTime: '7:55 PM',
    lunchFood: 'TBC',
    dinnerFood: 'TBC',
    isKhatam: false
  },
  {
    id: 'day-4',
    dateStr: '2026-04-07',
    title: 'Day 4 (Khatam)',
    subtitle: 'Tuesday, April 7th',
    maghribTime: '7:56 PM',
    lunchFood: 'TBC',
    dinnerFood: 'TBC',
    isKhatam: true 
  }
]

export default function ScheduleInfo() {
  const [activeDay, setActiveDay] = useState(EVENT_DAYS[0])

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0] 
    const matchingDay = EVENT_DAYS.find(day => day.dateStr === today)
    
    if (matchingDay) {
      setActiveDay(matchingDay)
    } 
  }, [])

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 md:px-8 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border-2 border-brand-burgundy overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-burgundy p-8 md:p-12 text-center text-brand-gold border-b-4 border-brand-gold">
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-widest">Daily Schedule</h1>
          <p className="text-brand-gold-light mt-3 text-sm font-medium tracking-wide">April 4th – 7th, 2026 | Ashton Central Mosque</p>
        </div>

        {/* Content */}
        <div className="p-6 md:p-12">

          {/* DAY SELECTOR TABS */}
          <div className="flex overflow-x-auto hide-scrollbar border-b border-gray-200 mb-8 pb-2 gap-2 md:gap-4 snap-x">
            {EVENT_DAYS.map((day) => (
              <button
                key={day.id}
                onClick={() => setActiveDay(day)}
                className={`snap-start whitespace-nowrap flex-shrink-0 px-5 py-3 rounded-lg font-bold transition-all duration-200 text-sm md:text-base ${
                  activeDay.id === day.id 
                    ? 'bg-brand-burgundy text-brand-gold shadow-md' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {day.title} <span className="block text-xs font-normal opacity-80">{day.subtitle}</span>
              </button>
            ))}
          </div>

          <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-3">
              <h3 className="text-2xl font-bold text-brand-burgundy flex items-center">
                <span className="mr-3 text-2xl">⏱️</span> {activeDay.subtitle}
              </h3>
              {activeDay.isKhatam && (
                <span className="bg-brand-gold/20 text-brand-burgundy font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider hidden sm:block">
                  Completion Day
                </span>
              )}
            </div>
            
            <div className="relative border-l-2 border-brand-gold ml-3 md:ml-4 pb-4">
              
              {activeDay.isKhatam ? (
                /* THE KHATAM DAY TBC BLOCK */
                <div className="relative pl-8 py-4">
                  <div className="absolute w-4 h-4 bg-brand-gold rounded-full -left-[9px] top-5 border-2 border-white shadow-sm"></div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Schedule To Be Confirmed</h4>
                  <p className="text-gray-600 text-base leading-relaxed">
                    Because this is the final day of the recital, the timetable will depend on our reading pace over the previous three days. The specific timings for the morning/afternoon sessions and the Khatam (Completion) ceremony will be announced closer to the time.
                  </p>
                </div>
              ) : (
                /* THE STANDARD TIMETABLE (DAYS 1-3) */
                <div className="space-y-8">
                  {/* AM Block */}
                  <div className="relative pl-8">
                    <div className="absolute w-4 h-4 bg-brand-burgundy rounded-full -left-[9px] top-1 border-2 border-white shadow-sm"></div>
                    <h4 className="text-xl font-bold text-gray-900">Morning Session</h4>
                    <p className="text-sm font-bold text-brand-gold uppercase tracking-wider mb-3">6:30 AM – 1:00 PM</p>
                    <ul className="text-base space-y-4 text-gray-600">
                      <li className="flex flex-col md:flex-row md:items-center">
                        <span className="font-black text-brand-burgundy w-24">6:30 AM</span> 
                        <span className="flex-1 font-medium text-gray-800">Morning Registration</span>
                        <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">1 hour</span>
                      </li>
                      <li className="flex flex-col md:flex-row md:items-center">
                        <span className="font-black text-brand-burgundy w-24">7:30 AM</span> 
                        <span className="flex-1 font-bold text-gray-800">Session 1A</span>
                        <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">2.5 hours</span>
                      </li>
                      <li className="flex flex-col md:flex-row md:items-center">
                        <span className="font-black text-brand-burgundy w-24">10:00 AM</span> 
                        <span className="flex-1 text-gray-500 italic">Break</span>
                        <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">30 mins</span>
                      </li>
                      <li className="flex flex-col md:flex-row md:items-center">
                        <span className="font-black text-brand-burgundy w-24">10:30 AM</span> 
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
                      <li className="flex flex-col md:flex-row md:items-start md:items-center">
                        <span className="font-bold text-gray-500 w-24">1:00 PM</span> 
                        <div className="flex-1 flex flex-col">
                          <span className="text-gray-500 italic">Lunch Break</span>
                          <span className="text-xs text-brand-burgundy font-medium mt-1 md:mt-0">Menu: {activeDay.lunchFood}</span>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">45 mins</span>
                      </li>
                      <li className="flex flex-col md:flex-row md:items-center">
                        <span className="font-black text-brand-burgundy w-24">1:45 PM</span> 
                        <span className="flex-1 font-medium text-gray-800">Afternoon Registration</span>
                        <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">15 mins</span>
                      </li>
                      <li className="flex flex-col md:flex-row md:items-center">
                        <span className="font-bold text-gray-500 w-24">2:00 PM</span> 
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
                        <span className="font-black text-brand-burgundy w-24">2:45 PM</span> 
                        <span className="flex-1 font-bold text-gray-800">Session 2A</span>
                        <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">3 hours</span>
                      </li>
                      <li className="flex flex-col md:flex-row md:items-center">
                        <span className="font-black text-brand-burgundy w-24">5:45 PM</span> 
                        <span className="flex-1 text-gray-500 italic">Break</span>
                        <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">30 mins</span>
                      </li>
                      <li className="flex flex-col md:flex-row md:items-center">
                        <span className="font-bold text-gray-500 w-24">6:15 PM</span> 
                        <span className="flex-1 text-gray-500 italic">Asr Prayer</span>
                        <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">15 mins</span>
                      </li>
                      <li className="flex flex-col md:flex-row md:items-center">
                        <span className="font-black text-brand-burgundy w-24">6:30 PM</span> 
                        <span className="flex-1 font-bold text-gray-800">Session 2B</span>
                        <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">Until Maghrib</span>
                      </li>
                      
                      <li className="flex flex-col md:flex-row md:items-center">
                        <span className="font-bold text-brand-gold w-24">{activeDay.maghribTime}</span> 
                        <span className="flex-1 text-brand-burgundy-dark font-bold">Maghrib Prayer</span>
                        <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">19 mins</span>
                      </li>

                      <li className="flex flex-col md:flex-row md:items-center">
                        <span className="font-black text-brand-burgundy w-24">After Maghrib</span> 
                        <span className="flex-1 font-bold text-gray-800">Session 2C</span>
                        <span className="text-xs bg-gray-100 text-gray-500 font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">~1 hr 20 mins</span>
                      </li>
                      <li className="flex flex-col md:flex-row md:items-start pt-4">
                        <span className="font-black text-brand-burgundy w-24">9:30 PM</span> 
                        <div className="flex-1 flex flex-col">
                          <span className="font-bold text-gray-800">End of Day — Dinner Served</span>
                          <span className="text-xs text-brand-burgundy font-medium mt-1">Menu: {activeDay.dinnerFood}</span>
                        </div>
                        <span className="text-xs bg-brand-gold/20 text-brand-burgundy-dark font-bold px-2 py-1 rounded w-max mt-1 md:mt-0">Alhamdulillah</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-10 bg-red-50 text-red-800 p-5 rounded-xl border border-red-200 text-sm font-medium shadow-sm flex items-start">
              <span className="text-2xl mr-3 leading-none">⚠️</span>
              <div>
                <span className="font-bold block mb-1">Important Attendance Note</span>
                To qualify for the full Ijazah, you must log your attendance for <strong>every session</strong> via the{' '}
                <Link 
                  href="/attendee/register" 
                  className="font-black underline decoration-red-300 hover:decoration-red-800 transition-colors"
                >
                  Register Attendance
                </Link>{' '}
                tab.
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}