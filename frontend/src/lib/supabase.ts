import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: SupabaseClient

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env')
  // Create a mock client that will fail gracefully
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
    }),
    rpc: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }),
  } as unknown as SupabaseClient
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }
