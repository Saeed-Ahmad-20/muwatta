import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex flex-col">
      
      {/* HERO SECTION */}
      <div className="bg-brand-burgundy text-brand-gold py-20 px-4 relative overflow-hidden flex-1 flex flex-col justify-center items-center">
        
        {/* Subtle decorative background glow */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-gold via-brand-burgundy to-brand-burgundy"></div>

        <div className="relative z-10 text-center max-w-5xl mx-auto space-y-6">
          <h1 className="text-7xl md:text-9xl font-black mb-4 drop-shadow-md" dir="rtl">
            الموطأ
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold tracking-widest uppercase text-white drop-shadow-sm">
            Al-Muwatta'
          </h2>
          
          <div className="w-24 h-1 bg-brand-gold mx-auto my-8 rounded-full"></div>
          
          <p className="text-xl md:text-2xl text-brand-gold-light font-medium max-w-3xl mx-auto leading-relaxed">
            The Complete Historic Recital of the Magnum Opus of Imam Malik ibn Anas
          </p>
          <p className="text-lg md:text-xl text-white/90 font-medium">
            Under the guidance of Shaykh Muhammad Al-Yaqoubi
          </p>

          {/* Call to Action Buttons */}
          <div className="pt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/info/event-details" 
              className="px-8 py-4 bg-brand-gold text-brand-burgundy font-bold rounded-xl text-lg hover:bg-white transition-all shadow-lg hover:shadow-xl w-full sm:w-auto transform hover:-translate-y-1"
            >
              Discover the Event
            </Link>
            <Link 
              href="/attendee/register" 
              className="px-8 py-4 bg-transparent border-2 border-brand-gold text-brand-gold font-bold rounded-xl text-lg hover:bg-brand-gold/10 transition-all w-full sm:w-auto"
            >
              Access Attendee Portal
            </Link>
          </div>
        </div>
      </div>

      {/* QUICK INFO BAR */}
      <div className="bg-white border-b border-gray-200 shadow-sm relative z-20">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
            
            <div className="pt-6 md:pt-0 flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm border border-gray-100">🗓️</div>
              <h3 className="font-bold text-brand-burgundy text-lg uppercase tracking-wide">April 4 - 7, 2026</h3>
              <p className="text-gray-500 text-sm mt-1 font-medium">4 Days of Intensive Study</p>
            </div>
            
            <div className="pt-6 md:pt-0 flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm border border-gray-100">📍</div>
              <h3 className="font-bold text-brand-burgundy text-lg uppercase tracking-wide">Manchester, UK</h3>
              <p className="text-gray-500 text-sm mt-1 font-medium">Hosted by Guidance Hub</p>
            </div>
            
            <div className="pt-6 md:pt-0 flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm border border-gray-100">📜</div>
              <h3 className="font-bold text-brand-burgundy text-lg uppercase tracking-wide">Sanad & Ijazah</h3>
              <p className="text-gray-500 text-sm mt-1 font-medium">Connecting to the Golden Chain</p>
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}