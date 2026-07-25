import 'server-only'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'

// Lightweight Postgres-backed rate limiter. Reuses the Supabase project we
// already have instead of standing up a new dependency (Upstash/Redis/etc).
//
// Fail-open by design: a bug or outage in the rate limiter must never take
// down the endpoint it is protecting. In dev (no Supabase configured) it
// always allows, since there is no DB to check against.

let warnedNotConfigured = false

export async function checkRateLimit(
  bucket: string,
  identifier: string,
  opts: { max: number; windowSeconds: number }
): Promise<{ allowed: boolean }> {
  if (!isSupabaseConfigured()) {
    if (!warnedNotConfigured) {
      warnedNotConfigured = true
      console.warn(
        `[rate-limit] Supabase is not configured — rate limiting is disabled (fail-open) for bucket "${bucket}".`
      )
    }
    return { allowed: true }
  }

  try {
    const supabase = getSupabaseAdmin()

    const { error: insertError } = await supabase
      .from('unreal_bs_rate_limit_hits')
      .insert({ bucket, identifier })

    if (insertError) {
      console.error('[rate-limit] failed to record hit, failing open:', insertError)
      return { allowed: true }
    }

    const windowStart = new Date(Date.now() - opts.windowSeconds * 1000).toISOString()
    const { count, error: countError } = await supabase
      .from('unreal_bs_rate_limit_hits')
      .select('id', { count: 'exact', head: true })
      .eq('bucket', bucket)
      .eq('identifier', identifier)
      .gt('created_at', windowStart)

    if (countError) {
      console.error('[rate-limit] failed to count hits, failing open:', countError)
      return { allowed: true }
    }

    return { allowed: (count ?? 0) <= opts.max }
  } catch (err) {
    console.error('[rate-limit] unexpected error, failing open:', err)
    return { allowed: true }
  }
}
