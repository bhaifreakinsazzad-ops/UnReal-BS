import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Server-only Supabase client using the service-role key. Never import this
// from client components — the key must not reach the browser bundle.
//
// Env vars are only checked when getSupabaseAdmin() is called (not at module
// load) so the app doesn't crash on import before the migration/env vars are
// set up.

let cached: SupabaseClient | null = null

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached

  const url = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    )
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}
