'use client'

export default function PurposeInfo() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 md:px-8 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border-2 border-brand-burgundy overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-burgundy p-8 md:p-12 text-center text-brand-gold border-b-4 border-brand-gold">
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-widest">Purpose of the Majlis</h1>
          <h2 className="text-xl font-bold tracking-wide">The Tradition of Sama&apos;</h2>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-12 text-gray-700 leading-relaxed text-lg">
          
          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-4 flex items-center">
              <span className="mr-3 text-2xl">🎙️</span> What is a Majlis of Sama&apos;?
            </h3>
            <p className="mb-4">
              A <em>Majlis of Sama&apos;</em> (Gathering of Audition) is a time-honored Islamic educational practice that dates back to the era of the Companions. It involves the continuous, rapid, and accurate recitation of a classical text in the physical presence of a master scholar.
            </p>
            <p>
              During this event, the entire Arabic text of <strong>Al-Muwatta&apos;</strong> will be read aloud. Shaykh Muhammad Al-Yaqoubi will preside over the gathering, listening intently, correcting any pronunciation errors, explaining complex or obscure terminology, and providing brief, profound commentary on the legal rulings (Fiqh) and spiritual lessons within the hadith.
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-8 my-8">
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm hover:border-brand-burgundy/30 transition-colors">
              <div className="text-4xl mb-4">🔗</div>
              <h3 className="text-xl font-bold text-brand-burgundy mb-3">Preserving the Isnad</h3>
              <p className="text-base leading-relaxed">
                In the age of printed books and the internet, one might ask why we still gather to read aloud. In Islam, knowledge is transferred heart-to-heart. The <em>Isnad</em> (chain of transmission) guarantees that the text has not been altered over the centuries. By hearing it from a master who heard it from a master, we keep the living tradition of preservation alive.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm hover:border-brand-gold/50 transition-colors">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-brand-burgundy mb-3">Spiritual Blessings (Barakah)</h3>
              <p className="text-base leading-relaxed">
                Reading the Muwatta&apos; means invoking peace and blessings (Salawat) upon the Prophet Muhammad ﷺ thousands of times over the course of four days. Gatherings dedicated to the remembrance of Allah and the traditions of His Messenger are surrounded by angels, bringing immense tranquility (Sakinah) and spiritual purification to the attendees.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-4 flex items-center">
              <span className="mr-3 text-2xl">👥</span> Who is this for?
            </h3>
            <p className="mb-4">
              A Majlis of this magnitude is a rare opportunity, and it is open to everyone. 
            </p>
            <ul className="space-y-3 mt-4 text-base">
              <li className="flex items-start">
                <span className="text-brand-gold text-2xl mr-3 leading-none">•</span>
                <span><strong>For Scholars and Imams:</strong> It is an opportunity to elevate their chains of transmission and gain nuanced insights into Maliki fiqh and hadith sciences.</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-gold text-2xl mr-3 leading-none">•</span>
                <span><strong>For Students of Knowledge:</strong> It provides a rigorous training environment to improve Arabic listening comprehension, vocabulary, and stamina.</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-gold text-2xl mr-3 leading-none">•</span>
                <span><strong>For the General Public:</strong> Even without fluency in Arabic, attending brings the immense reward of sitting in a gathering of sacred knowledge, absorbing the atmosphere, and connecting to the legacy of Imam Malik.</span>
              </li>
            </ul>
          </section>

          {/* ========================================== */}
          {/* SPONSORSHIP & KHATAM BOOKLET SECTION       */}
          {/* ADDED: 'z-0' to safely contain the z-index */}
          {/* ========================================== */}
          <section className="bg-brand-burgundy text-white p-8 md:p-10 rounded-2xl shadow-lg relative z-0 overflow-hidden border-4 border-brand-burgundy-dark mt-12 mb-12">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-gold opacity-10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-brand-gold mb-4 flex items-center tracking-wide">
                <span className="mr-3 text-3xl">🤲</span> Support the Majlis
              </h3>
              
              <div className="space-y-4 text-brand-gold-light mb-8">
                <p>
                  Hosting a monumental 4-day gathering of sacred knowledge requires immense logistical and financial support. Facilitating this event is only made possible through the generous donations of our community. <strong>Without your support, an event of this scale cannot happen.</strong>
                </p>
                <p>
                  <strong className="text-white">The Significance of the Khatam Booklet:</strong> At the conclusion of the Majlis, a special Khatam booklet is published. This acts as a historical record of the event, containing the prayers of completion, the specific chains of transmission (Isnad), and the names of the supporters who helped preserve this tradition.
                </p>
              </div>

              <div className="bg-white/10 p-6 rounded-xl border border-white/20 mb-8 backdrop-blur-sm">
                <h4 className="text-lg font-bold text-brand-gold mb-2 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                  Special Dedication
                </h4>
                <p className="text-base text-white">
                  For a contribution of <strong>£100</strong>, you can have your name—or the name of a loved one as a <em>Sadaqah Jariyah</em> (continuous charity)—permanently inscribed in the official Khatam booklet, forever linking your support to the legacy of this blessed gathering.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="https://LaunchGood.com/khatambooklet" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center px-8 py-4 bg-brand-gold text-brand-burgundy font-black uppercase tracking-wider rounded-xl hover:bg-white transition-all duration-200 shadow-xl text-sm sm:text-base w-full transform hover:-translate-y-1"
                >
                  Donate & Secure Your Dedication
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>
          </section>

          <section className="pl-6 md:pl-8 border-l-4 border-brand-gold bg-yellow-50/30 py-6 pr-6 rounded-r-xl">
            <h3 className="text-xl font-bold text-brand-burgundy mb-3">The Ultimate Goal: Achieving Ijazah</h3>
            <p className="text-base">
              Attendees who remain present and attentive for the entirety of the reading will be granted an <strong>Ijazah</strong> (formal certification) at the conclusion of the event. This Ijazah places your name in an unbroken chain of transmission connecting you through Shaykh Al-Yaqoubi directly back to Imam Malik, and ultimately to the Prophet Muhammad ﷺ. It is both a profound honor and a lifelong responsibility to uphold and pass on this sacred trust.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}