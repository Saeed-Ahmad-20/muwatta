'use client'

export default function MuwattaInfo() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 md:px-8 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border-2 border-brand-burgundy overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-burgundy p-8 md:p-12 text-center text-brand-gold border-b-4 border-brand-gold">
          <h1 className="text-5xl md:text-6xl font-black mb-4" dir="rtl">الموطأ</h1>
          <h2 className="text-3xl font-bold tracking-widest uppercase">Al-Muwatta'</h2>
          <p className="text-brand-gold-light mt-3 text-lg font-medium tracking-wide">The Well-Trodden Path</p>
          <div className="mt-4 text-sm">
            <span className="bg-brand-burgundy-dark px-3 py-1 rounded-full">Compiled: 8th Century CE</span>
            <span className="mx-2">|</span>
            <span className="bg-brand-burgundy-dark px-3 py-1 rounded-full">Author: Imam Malik ibn Anas</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-10 text-gray-700 leading-relaxed text-lg">
          
          <section>
            <p className="text-xl leading-loose">
              <strong className="text-brand-burgundy font-black text-2xl">Al-Muwatta'</strong> (Arabic: الموطأ), which translates to "The Well-Trodden Path" or "The Approved," is one of the most monumental works in Islamic history. Compiled in the 8th century by Imam Malik ibn Anas, it holds the distinction of being the earliest surviving collection of hadith and Islamic jurisprudence, laying the foundational methodology for how Islamic law is derived.
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-8 my-8">
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-4xl mb-4 text-center">📜</div>
              <h3 className="text-2xl font-bold text-brand-burgundy mb-3">Historical Context</h3>
              <p className="text-base leading-relaxed">
                The Abbasid Caliph Abu Ja'far al-Mansur recognized the growing divergence of legal opinions across the vast Islamic empire. He famously approached Imam Malik and requested him to compile a book that avoided extremes, asking him instead to synthesize the middle, universally agreed-upon path.
              </p>
              <p className="text-base leading-relaxed mt-4">
                Imam Malik spent over forty years meticulously filtering roughly 100,000 narrations down to just under 2,000. He stated: <em>"I showed this book of mine to seventy scholars of Medina, and every single one of them approved of it for me (wata'ani 'alayh), so I named it Al-Muwatta'."</em>
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm">
              <div className="text-4xl mb-4 text-center">⚖️</div>
              <h3 className="text-2xl font-bold text-brand-burgundy mb-3">The 'Amal of Medina</h3>
              <p className="text-base leading-relaxed">
                What makes the Muwatta' entirely unique compared to later Hadith collections is its focus on the <strong>'Amal</strong>—the living tradition and continuous practice of the people of Medina.
              </p>
              <p className="text-base leading-relaxed mt-4">
                Imam Malik recognized that the thousands of Companions who lived and learned with the Prophet Muhammad ﷺ passed those exact daily practices down to their children in Medina. Therefore, if the entire city was practicing a specific ruling, he considered this living, unbroken transmission to be stronger than a single, isolated hadith chain.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-2xl font-bold text-brand-burgundy mb-4">Structure and Contents</h3>
            <p className="mb-6">
              The book is organized topically, serving as a practical manual for daily Islamic life. It begins with the times of prayer, purification, and fasting, before moving into highly complex chapters on commerce, marriage, inheritance, and judicial rulings. The text seamlessly weaves together three types of knowledge:
            </p>
            <ul className="space-y-4">
              <li className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-brand-gold text-2xl mr-4 leading-none">•</span>
                <span><strong>Marfu' Hadith:</strong> The direct sayings, approvals, and actions of the Prophet Muhammad ﷺ.</span>
              </li>
              <li className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-brand-gold text-2xl mr-4 leading-none">•</span>
                <span><strong>Athar (Traditions):</strong> The rulings, verdicts, and legal precedents set by the Companions (Sahabah) and their immediate successors (Tabi'un).</span>
              </li>
              <li className="flex items-start bg-gray-50 p-4 rounded-lg border border-gray-100">
                <span className="text-brand-gold text-2xl mr-4 leading-none">•</span>
                <span><strong>Fiqh deductions:</strong> Imam Malik's own legal deductions, often introduced with the phrase <em>"The generally agreed-upon practice with us is..."</em></span>
              </li>
              
            </ul>
          </section>
          
          <div className="bg-brand-burgundy text-brand-gold p-8 rounded-xl mt-8 text-center shadow-md border-2 border-brand-gold">
            <p className="text-xl font-medium italic font-serif">
              "There has not appeared on the face of the earth a book that is more authentic than the book of Malik."
            </p>
            <p className="mt-4 text-sm font-bold uppercase tracking-widest text-brand-gold-light">— Imam al-Shafi'i</p>
          </div>

          <div className="pt-6">
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-brand-burgundy/10 text-brand-burgundy rounded-full text-sm font-medium">Earliest Hadith Collection</span>
              <span className="px-3 py-1 bg-brand-burgundy/10 text-brand-burgundy rounded-full text-sm font-medium">Foundation of Maliki School</span>
              <span className="px-3 py-1 bg-brand-burgundy/10 text-brand-burgundy rounded-full text-sm font-medium">Practical Legal Manual</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}