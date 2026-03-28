export default function ShaykhYaqoubiInfo() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 md:px-8 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border-2 border-brand-burgundy overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-burgundy p-8 md:p-12 text-center text-brand-gold border-b-4 border-brand-gold">
          <h1 className="text-5xl md:text-6xl font-black mb-4" dir="rtl">الشيخ محمد اليعقوبي</h1>
          <h2 className="text-3xl font-bold tracking-widest uppercase">Shaykh Muhammad Al-Yaqoubi</h2>
          <p className="text-brand-gold-light mt-3 text-lg font-medium tracking-wide">Scholar, Theologian, and Master of Hadith</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-10 text-gray-700 leading-relaxed text-lg">
          
          <section>
            <p className="text-xl leading-loose">
              <strong className="text-brand-burgundy font-black text-2xl">Shaykh Muhammad Abul Huda al-Yaqoubi</strong> is a world-renowned Islamic scholar, theologian, and spiritual guide. Hailing from Damascus, Syria, he traces his lineage directly to the Prophet Muhammad ﷺ through his grandson, Imam al-Hasan. He is widely recognized as one of the leading authorities of Hadith and traditional Islamic sciences alive today.
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-8 my-8">
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-4xl mb-4 text-center">🏛️</div>
              <h3 className="text-2xl font-bold text-brand-burgundy mb-3">Early Life and Education</h3>
              <p className="text-base leading-relaxed">
                Born into a family of highly distinguished religious scholars, Shaykh Muhammad's formal education began from an early age. His father, the great polymath Shaykh Ibrahim al-Yaqoubi, was the Imam and instructor at the historic Umayyad Mosque in Damascus.
              </p>
              <p className="text-base leading-relaxed mt-4">
                Under his father's intensive tutelage, the Shaykh memorized the foundational texts of Arabic grammar, Aqidah (theology), and Fiqh (jurisprudence) as a young boy. By his early twenties, he had already mastered the major sciences of Islam and was granted extensive Ijazahs.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-4xl mb-4 text-center">🔗</div>
              <h3 className="text-2xl font-bold text-brand-burgundy mb-3">Master of Transmission Chains</h3>
              <p className="text-base leading-relaxed">
                In the science of Hadith, the strength and shortness of a scholar's chain of transmission back to the Prophet ﷺ is highly prized. Shaykh Al-Yaqoubi holds some of the shortest and most elevated chains in the world today.
              </p>
              <p className="text-base leading-relaxed mt-4">
                He has spent his life traveling to meet the oldest masters of Hadith, acquiring authorizations that connect him directly to Imam Malik, Imam al-Bukhari, and the classical compilers. This profound connection makes his Ijazah gatherings highly sought after globally.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-4">Global Impact and Teaching</h3>
            <p className="mb-4">
              Regularly listed among the <em>500 Most Influential Muslims</em>, Shaykh Al-Yaqoubi is celebrated for bridging classical Islamic scholarship with modern realities. Fluent in several languages, he served as a researcher and instructor in the West before returning to Syria and eventually relocating to Morocco.
            </p>
            <p className="mb-6">
              His teachings are characterized by three major pillars:
            </p>
            <ul className="space-y-4">
              <li className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-brand-gold text-2xl mr-4 leading-none">•</span>
                <span><strong>Rigorous Orthodoxy:</strong> The uncompromising defense and detailed teaching of mainstream Sunni theology (Ash'ari/Maturidi) and jurisprudence.</span>
              </li>
              <li className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-brand-gold text-2xl mr-4 leading-none">•</span>
                <span><strong>Spiritual Purification:</strong> Guiding students in heart purification (Tasawwuf), strictly rooted in the boundaries of the Qur'an and Sunnah.</span>
              </li>
              <li className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-brand-gold text-2xl mr-4 leading-none">•</span>
                <span><strong>Defending the Faith:</strong> He has been a vocal and academically rigorous voice refuting extremism and ideological deviations in the modern era.</span>
              </li>
            </ul>
          </section>
          
          {/* Restored the original "honor of having the shaykh" section */}
          <div className="bg-brand-burgundy text-brand-gold p-8 rounded-xl mt-8 text-center shadow-md border-2 border-brand-gold">
            <h4 className="text-xl font-bold mb-3">The Recital</h4>
            <p className="font-medium text-brand-gold-light leading-relaxed">
              We are deeply honored to have Shaykh Muhammad Al-Yaqoubi leading this historic recital. Attendees are granted the incredibly rare opportunity to read the Muwatta' under his guidance, correcting their pronunciation, understanding its depths, and connecting their own names to the golden chains of transmission spanning back over a millennium to Imam Malik himself.
            </p>
          </div>

          {/* Kept the tags from the improved version */}
          <div className="pt-6">
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-brand-burgundy/10 text-brand-burgundy rounded-full text-sm font-medium">Descendant of Prophet ﷺ</span>
              <span className="px-3 py-1 bg-brand-burgundy/10 text-brand-burgundy rounded-full text-sm font-medium">Master of Hadith Chains</span>
              <span className="px-3 py-1 bg-brand-burgundy/10 text-brand-burgundy rounded-full text-sm font-medium">Global Islamic Scholar</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}