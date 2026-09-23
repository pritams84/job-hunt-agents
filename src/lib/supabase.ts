import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wjocnbzspehdfsbjdpbe.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_50UrYwiVAOU1egsjqWdqPA_Fd3ovtM-'

/**
 * Standard browser Supabase client
 * Evaluates Row-Level Security (RLS) policies automatically
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

/**
 * Creates an authenticated Supabase client using Clerk JWT
 */
export function getAuthenticatedSupabaseClient(clerkToken: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${clerkToken}`,
      },
    },
  })
}
