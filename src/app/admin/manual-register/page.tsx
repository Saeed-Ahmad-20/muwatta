import { supabaseAdmin } from '@/lib/supabaseAdmin'
import ManualRegisterForm from './ManualRegisterForm'

export default async function ManualRegistrationPage() {
  
  // Fetch all admission types currently in the database
  const { data, error } = await supabaseAdmin
    .from('attendees')
    .select('admission_type')

  // Extract distinct admission types and filter out null/empty values
  let distinctAdmissionTypes: string[] = []
  
  if (!error && data) {
    const allTypes = data.map(record => record.admission_type).filter(Boolean)
    // Convert to Set to remove duplicates, then back to an array
    distinctAdmissionTypes = Array.from(new Set(allTypes)).sort()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 md:px-8 flex justify-center items-start">
      <div className="w-full max-w-3xl">
        
        {/* Header Section */}
        <div className="bg-brand-burgundy p-8 rounded-t-2xl shadow-md border-2 border-b-0 border-brand-burgundy text-center">
          <h1 className="text-3xl font-black text-brand-gold">Manual Registration</h1>
          <p className="text-brand-gold-light mt-2 font-medium">
            Add an attendee directly to the database. A unique dummy ticket code will be generated automatically.
          </p>
        </div>

        {/* Form Section */}
        <div className="border-x-2 border-b-2 border-brand-burgundy rounded-b-2xl shadow-md bg-white">
          <ManualRegisterForm admissionTypes={distinctAdmissionTypes} />
        </div>
        
      </div>
    </div>
  )
}