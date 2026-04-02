import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex flex-col">
      
      {/* HERO SECTION */}
      {/* Added pb-28 (padding-bottom) so the floating card below has room to overlap */}
      <div className="bg-brand-burgundy text-brand-gold pt-20 pb-28 px-4 relative overflow-hidden flex-none flex flex-col justify-center items-center">
        
        {/* Subtle decorative background glow */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-gold via-brand-burgundy to-brand-burgundy z-0"></div>

        <div className="relative z-0 text-center max-w-5xl mx-auto space-y-6 w-full">
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
          <p className="text-lg md:text-xl text-white/90 font-medium mb-8">
            Under the guidance of Shaykh Muhammad Al-Yaqoubi
          </p>

          {/* HERO POSTER */}
          <div className="relative w-full max-w-sm mx-auto aspect-[4/5] rounded-xl shadow-2xl overflow-hidden border-2 border-brand-gold/50 my-10 group">
            <Image 
              src="/images/poster.jpeg" 
              alt="Al-Muwatta Recital Official Poster" 
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              priority
            />
          </div>

          {/* Call to Action Buttons */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/info/purpose" 
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

          {/* Secondary Links (Tickets & Socials) */}
          <div className="pt-8 flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4">
            <a
              href="https://www.tickettailor.com/events/guidancehub/2031287"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-brand-gold/40 rounded-xl text-white font-bold transition-all shadow-lg hover:shadow-xl backdrop-blur-sm transform hover:-translate-y-1 w-full sm:w-auto group"
            >
              <svg className="w-5 h-5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
              </svg>
              Purchase a Ticket
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>

            <a
              href="https://linktr.ee/shaykhalyaqoubi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-brand-gold/40 rounded-xl text-white font-bold transition-all shadow-lg hover:shadow-xl backdrop-blur-sm transform hover:-translate-y-1 w-full sm:w-auto group"
            >
              <svg className="w-5 h-5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Follow the Shaykh
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>

            <a
              href="https://linktr.ee/guidancehub"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 border border-brand-gold/40 rounded-xl text-white font-bold transition-all shadow-lg hover:shadow-xl backdrop-blur-sm transform hover:-translate-y-1 w-full sm:w-auto group"
            >
              <svg className="w-5 h-5 text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Follow Guidance Hub
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform text-brand-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>

        </div>
      </div>

            {/* VIDEO SECTION */}
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-16 flex-1 flex flex-col justify-center items-center">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-brand-burgundy uppercase tracking-widest">Experience the Recital</h2>
          <div className="w-16 h-1 bg-brand-gold mx-auto mt-4 rounded-full"></div>
        </div>
        
        <div className="relative w-full rounded-2xl shadow-xl overflow-hidden bg-black border-4 border-white flex items-center justify-center aspect-video group">
          <video 
            controls 
            className="w-full h-full object-cover"
            poster="/images/banner.png"
            preload="metadata"
          >
            <source src="/videos/promo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>


      {/* FLOATING QUICK INFO BAR */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 w-full -mt-16">
        <div className="bg-white border border-gray-100 shadow-xl rounded-2xl py-8 px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-100">
            
            <div className="pt-4 md:pt-0 flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm border border-gray-100">🗓️</div>
              <h3 className="font-bold text-brand-burgundy text-lg uppercase tracking-wide">April 4 - 7, 2026</h3>
              <p className="text-gray-500 text-sm mt-1 font-medium">4 Days of Intensive Study</p>
            </div>
            
            <div className="pt-8 md:pt-0 flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-2xl mb-3 shadow-sm border border-gray-100">📍</div>
              <h3 className="font-bold text-brand-burgundy text-lg uppercase tracking-wide">Manchester, UK</h3>
              <p className="text-gray-500 text-sm mt-1 font-medium">Hosted by Guidance Hub</p>
            </div>
            
            <div className="pt-8 md:pt-0 flex flex-col items-center">
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