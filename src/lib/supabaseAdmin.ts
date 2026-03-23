import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check your .env.local file.")
}

// NEVER import this into a file that has 'use client' at the top
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)