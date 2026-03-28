'use client'

export default function EtiquettesInfo() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 md:px-8 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border-2 border-brand-burgundy overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-burgundy p-8 md:p-12 text-center text-brand-gold border-b-4 border-brand-gold">
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-widest">Etiquettes & Adab</h1>
          <h2 className="text-xl font-bold tracking-wide">Respecting the Gathering</h2>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-12 text-gray-700 leading-relaxed text-lg">

          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-4 flex items-center">
              <span className="mr-3 text-2xl">📖</span> Learning Adab Before Knowledge
            </h3>
            <p className="mb-4">
              Imam Malik famously advised a young student: <strong>"Learn adab (etiquette) before you learn knowledge."</strong>
            </p>
            <p>
              Attending a Majlis of Hadith is not like attending a standard lecture or a casual conference. It is a deeply spiritual undertaking where the very words of the Prophet Muhammad ﷺ are being transmitted. As such, attendees must uphold the highest standards of outward conduct and inward reverence, mirroring the respect shown by the early generations of scholars.
            </p>
          </section>
          
          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-4 flex items-center">
              <span className="mr-3 text-2xl">🕌</span> Venue & Outward Conduct
            </h3>
            <p className="mb-4">
              The recital is hosted at <strong>Ashton Central Mosque</strong> (Hillgate St, Ashton-under-Lyne OL6 9JA). As we will be gathering in a house of Allah, strict etiquette is required:
            </p>
            
            <ul className="list-none space-y-4 mt-4 text-base">
              <li className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-brand-gold text-2xl mr-4 leading-none">•</span>
                <div>
                  <strong className="text-gray-900 block mb-1">Ritual Purity (Wudu)</strong>
                  <span className="text-gray-600 block">Attendees are highly encouraged to remain in a state of ritual purity throughout the entire reading.</span>
                  <span className="text-sm italic text-gray-500 mt-2 block">Imam Malik considered it highly disrespectful to utter the words of the Prophet ﷺ without being in a state of physical purity, and would not teach Hadith without having performed Wudu first.</span>
                </div>
              </li>
              <li className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-brand-gold text-2xl mr-4 leading-none">•</span>
                <div>
                  <strong className="text-gray-900 block mb-1">Absolute Silence</strong>
                  <span className="text-gray-600 block">Silence is obligatory while the text is being recited. Side conversations, whispers, and phone usage are strictly forbidden.</span>
                  <span className="text-sm italic text-gray-500 mt-2 block">The Quran commands believers not to raise their voices above the Prophet's ﷺ voice. The scholars equated talking during the reading of a Hadith to talking over the Prophet ﷺ himself, which breaks the sanctity of the transmission.</span>
                </div>
              </li>
              <li className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-brand-gold text-2xl mr-4 leading-none">•</span>
                <div>
                  <strong className="text-gray-900 block mb-1">Dress Code</strong>
                  <span className="text-gray-600 block">Attendees should wear modest, clean, and loose-fitting Islamic attire appropriate for the Mosque. The wearing of perfume (itr) for men is highly encouraged.</span>
                  <span className="text-sm italic text-gray-500 mt-2 block">We are attending a royal gathering. Just as one dresses their best for a worldly dignitary, Imam Malik would don his finest clothes and perfume out of reverence before entering the Majlis to speak the Prophet's ﷺ words.</span>
                </div>
              </li>
              <li className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-100 shadow-sm">
                <span className="text-brand-gold text-2xl mr-4 leading-none">•</span>
                <div>
                  <strong className="text-gray-900 block mb-1">Children</strong>
                  <span className="text-gray-600 block">While children are a blessing, only children who are mature enough to sit quietly for extended periods should attend the main hall. A dedicated Mother & Baby room will be available with an audio feed.</span>
                  <span className="text-sm italic text-gray-500 mt-2 block">The rapid pace and intense focus required for a 12-hour daily reading mean any sustained noise disrupts the concentration of the scholars and invalidates the listening (Sama') of nearby attendees.</span>
                </div>
              </li>
            </ul>
          </section>

          <section className="grid md:grid-cols-2 gap-8 my-8">
            <div className="bg-brand-burgundy/5 p-8 rounded-xl border border-brand-burgundy/20 shadow-sm hover:border-brand-burgundy/30 transition-colors">
              <div className="text-4xl mb-4">🫀</div>
              <h3 className="text-xl font-bold text-brand-burgundy mb-3">Inward Intention (Niyyah)</h3>
              <p className="text-base leading-relaxed">
                Before arriving, attendees should purify their intentions. We attend not for titles, certificates, or socialization, but solely to seek the pleasure of Allah, to connect our hearts to the Prophet Muhammad ﷺ, and to preserve the sacred trust of this Deen.
              </p>
            </div>
            
            <div className="bg-brand-burgundy/5 p-8 rounded-xl border border-brand-burgundy/20 shadow-sm hover:border-brand-gold/50 transition-colors">
              <div className="text-4xl mb-4">✍️</div>
              <h3 className="text-xl font-bold text-brand-burgundy mb-3">Active Listening</h3>
              <p className="text-base leading-relaxed">
                Do not let your mind wander. The scholars will be reading rapidly. You must engage in active listening (Istima'). It is a physical and spiritual effort to capture every word, meaning, and lesson transmitted during the Majlis.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-4 flex items-center">
              <span className="mr-3 text-2xl">📚</span> Preparation & Materials
            </h3>
            <p className="mb-6">
              To maximize the benefit of the gathering, attendees should arrive prepared. Bring a physical notebook and pen, as writing down the commentary of Shaykh Al-Yaqoubi is highly encouraged.
            </p>
            
            <div className="flex items-start bg-yellow-50/50 p-6 md:p-8 rounded-xl border-2 border-brand-gold shadow-sm">
              <span className="text-brand-gold text-4xl mr-5 leading-none mt-1 hidden sm:block">📖</span>
              <div className="flex-1">
                <strong className="text-brand-burgundy text-xl block mb-2 flex items-center">
                  <span className="sm:hidden mr-2 text-2xl">📖</span> Download the Text
                </strong>
                <p className="text-gray-800 mb-6 leading-relaxed">
                  A digital copy of the Arabic text of Al-Muwatta' is available for you to download, allowing you to easily follow along with the recitation and take notes during the Majlis. We highly recommend downloading this before the event begins.
                </p>
                <a
                  href="/downloads/muwatta.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  download="Muwatta.pdf"
                  className="inline-flex items-center justify-center px-6 py-3 bg-brand-burgundy text-brand-gold font-bold rounded-lg hover:bg-brand-burgundy-dark transition-colors shadow-md text-sm md:text-base w-full sm:w-auto"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download PDF
                </a>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}