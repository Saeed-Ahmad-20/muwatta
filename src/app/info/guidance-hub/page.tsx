export default function GuidanceHubInfo() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 py-12 px-4 md:px-8 flex justify-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-md border-2 border-brand-burgundy overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-burgundy p-8 md:p-12 text-center text-brand-gold border-b-4 border-brand-gold">
          <h1 className="text-4xl md:text-5xl font-black mb-4 uppercase tracking-widest">Guidance Hub</h1>
          <h2 className="text-xl font-bold tracking-wide">Community, Education, and Spirituality</h2>
          <p className="text-brand-gold-light mt-3 text-sm font-medium tracking-wide">The Proud Organizers of the Muwatta' Recital</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12 space-y-10 text-gray-700 leading-relaxed text-lg">
          
          <section>
            <p className="text-xl leading-loose">
              <strong className="text-brand-burgundy font-black text-2xl">Guidance Hub</strong> is a dynamic community-focused charity based in Manchester, United Kingdom. Founded on traditional Islamic principles, it serves as a beacon of learning, spiritual growth, and social welfare for the local and wider community.
            </p>
          </section>

          <section className="grid md:grid-cols-2 gap-8 my-8">
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-brand-gold">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-2xl font-bold text-brand-burgundy mb-3">Traditional Education</h3>
              <p className="text-base leading-relaxed">
                At the core of Guidance Hub’s mission is the revival of traditional Islamic scholarship. By hosting regular classes, intensives, and monumental recitals, they connect modern believers to unbroken chains of transmission (Ijazah) and world-renowned scholars, making authentic sacred knowledge highly accessible.
              </p>
            </div>
            
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md hover:border-brand-gold">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-2xl font-bold text-brand-burgundy mb-3">Community Welfare</h3>
              <p className="text-base leading-relaxed">
                Faith is demonstrated through service. Guidance Hub actively runs local welfare initiatives, including food banks, homeless outreach drives, and youth mentoring programs. They strive to embody the Prophetic character by being a source of immense benefit to their neighbors and the wider society.
              </p>
            </div>
          </section>

          <section className="pl-6 md:pl-8 border-l-4 border-brand-burgundy">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">A Hub for Everyone</h3>
            <p className="mb-4">
              Guidance Hub provides a welcoming, inclusive environment designed to cater to all demographics. Their facilities and programs are meticulously structured to support:
            </p>
            <ul className="list-none space-y-3 mt-4">
              <li className="flex items-start">
                <span className="text-brand-gold text-xl mr-3 leading-none">•</span>
                <span><strong>Youth Development:</strong> Engaging the next generation through sports, retreats, and mentorship to build confident, faith-driven individuals.</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-gold text-xl mr-3 leading-none">•</span>
                <span><strong>Women's Services:</strong> Dedicated spaces, classes, and support networks tailored specifically for the spiritual and social empowerment of women.</span>
              </li>
              <li className="flex items-start">
                <span className="text-brand-gold text-xl mr-3 leading-none">•</span>
                <span><strong>New Muslims:</strong> Providing foundational classes, community support, and a welcoming family environment for those newly discovering Islam.</span>
              </li>
            </ul>
          </section>
          
          <div className="bg-brand-burgundy text-brand-gold p-8 rounded-xl mt-8 text-center shadow-md border-2 border-brand-gold">
            <h4 className="text-xl font-bold mb-3 flex justify-center items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Hosting the Muwatta' Recital
            </h4>
            <p className="font-medium text-brand-gold-light leading-relaxed">
              Organizing an event of this magnitude requires immense dedication, logistics, and volunteer effort. We ask all attendees to keep the volunteers, staff, and founders of Guidance Hub in their sincere prayers for facilitating this historic gathering.
            </p>
          </div>

        </div>

      </div>
    </div>
  )
}