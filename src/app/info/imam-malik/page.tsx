export default function ImamMalikInfo() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 md:px-8 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border-2 border-brand-burgundy overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-burgundy p-8 md:p-12 text-center text-brand-gold border-b-4 border-brand-gold">
          <h1 className="text-5xl md:text-6xl font-black mb-4" dir="rtl">الإمام مالك بن أنس</h1>
          <h2 className="text-3xl font-bold tracking-widest uppercase">Imam Malik ibn Anas</h2>
          <p className="text-brand-gold-light mt-3 text-lg font-medium tracking-wide">The Imam of the Abode of Emigration (Imam Dar al-Hijrah)</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-10 text-gray-700 leading-relaxed text-lg">
          
          <section>
            <p className="text-xl leading-loose">
              <strong className="text-brand-burgundy font-black text-2xl">Malik ibn Anas</strong> (93–179 AH / 711–795 CE) was a towering figure in early Islamic history. As the founder of the Maliki school of jurisprudence and the compiler of the Muwatta', his influence on the codification of Islamic law is immeasurable.
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-8 my-8">
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-brand-gold">
              <div className="text-4xl mb-4">🕌</div>
              <h3 className="text-2xl font-bold text-brand-burgundy mb-3">Life in Medina</h3>
              <p className="text-base leading-relaxed">
                Born in Medina, the city of the Prophet ﷺ, Imam Malik spent his entire life immersed in its spiritual and academic atmosphere. Out of profound reverence, he famously refused to ride an animal within the city limits, stating he could not bear the thought of his mount's hooves trampling the dust in which the Prophet ﷺ was buried. He only left Medina to perform the Hajj pilgrimage.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-brand-gold">
              <div className="text-4xl mb-4">📖</div>
              <h3 className="text-2xl font-bold text-brand-burgundy mb-3">Reverence for Hadith</h3>
              <p className="text-base leading-relaxed">
                Imam Malik treated the sayings of the Prophet ﷺ with unmatched awe. Before teaching a Hadith class, he would perform ablution (wudu), put on his finest clothes, wear perfume, and comb his beard. If someone raised their voice during his gathering, he would severely reprimand them, citing the Quranic verse warning against raising one's voice above the Prophet's ﷺ.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-4">The "Golden Chain"</h3>
            <p className="mb-4">
              Imam Malik sought knowledge from the greatest scholars of the Successors (Tabi'un), most notably Nafi' (the freedman of Ibn 'Umar) and Ibn Shihab al-Zuhri. His transmission of hadith is considered among the most pristine in history.
            </p>
            <div className="bg-brand-burgundy/5 p-6 rounded-lg border-l-4 border-brand-burgundy font-medium text-brand-burgundy-dark text-center my-6">
              Malik  ➔  Nafi'  ➔  Ibn 'Umar  ➔  The Prophet Muhammad ﷺ
            </div>
            <p>
              This specific chain of transmission is universally recognized by later masters, including Imam al-Bukhari, as the <strong>Silsilat al-Dhahab</strong> (The Golden Chain), representing the highest peak of hadith authenticity.
            </p>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-4">Trials and Steadfastness</h3>
            <p className="mb-4">
              Despite his immense respect for authority, Imam Malik never compromised the truth. When the Abbasid governor of Medina demanded that people take an oath of allegiance under the threat of divorce (meaning if they broke the oath, their wives would automatically be divorced), Imam Malik publicly issued a fatwa stating that an oath taken under duress is invalid.
            </p>
            <p>
              For this defiant legal ruling, he was arrested, publicly flogged, and had his shoulder dislocated. Yet, he continued to teach the exact same ruling immediately after his release, cementing his reputation as a fearless defender of the Sacred Law.
            </p>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-4">Passing and Legacy</h3>
            <p>
              Imam Malik passed away in Medina at the age of 85 and is buried in the historic Al-Baqi' cemetery, resting near the thousands of Companions whose traditions he spent his life preserving. Today, the Maliki school of law is the dominant school in North Africa, West Africa, and parts of the Middle East, guiding the worship of hundreds of millions of Muslims.
            </p>
          </section>

        </div>

      </div>
    </div>
  )
}