import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// The admin client uses the service role key to safely bypass RLS on the server
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)