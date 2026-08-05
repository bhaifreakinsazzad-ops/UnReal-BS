import 'server-only'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'

// Lightweight Postgres-backed rate limiter. Reuses the Supabase project we
// already have instead of standing up a new dependency (Upstash/Redis/etc).
//
// Fail-open by DEFAULT: a bug or outage in the rate limiter must never take
// down the endpoint it is protecting. In dev (no Supabase configured) it
// always allows, since there is no DB to check against.
//
// SECURITY-CRITICAL buckets can opt into fail-CLOSED via `failClosed: true`.
// Use it wherever failing open would remove the only protection on a
// high-value target — most importantly login, where the entire product is
// gated behind one shared admin credential, so an unthrottled login endpoint
// during a database hiccup is a brute-force window against everything.

let warnedNotConfigured = false

export async function checkRateLimit(
  bucket: string,
  identifier: string,
  opts: { max: number; windowSeconds: number; failClosed?: boolean }
): Promise<{ allowed: boolean }> {
  const onFailure = (reason: string): { allowed: boolean } => {
    if (opts.failClosed) {
      console.error(`[rate-limit] ${reason}; failing CLOSED for bucket "${bucket}"`)
      return { allowed: false }
    }
    console.error(`[rate-limit] ${reason}; failing open for bucket "${bucket}"`)
    return { allowed: true }
  }

  if (!isSupabaseConfigured()) {
    // Missing limiter configuration is acceptable only outside production.
    // High-value production routes must never lose their throttle silently.
    if (opts.failClosed && process.env.NODE_ENV === 'production') {
      return onFailure('Supabase is not configured')
    }
    // Not an outage — this is local/dev with no database at all. Failing closed
    // here would make it impossible to sign in locally, so allow regardless.
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

    if (insertError) return onFailure('failed to record hit')

    const windowStart = new Date(Date.now() - opts.windowSeconds * 1000).toISOString()
    const { count, error: countError } = await supabase
      .from('unreal_bs_rate_limit_hits')
      .select('id', { count: 'exact', head: true })
      .eq('bucket', bucket)
      .eq('identifier', identifier)
      .gt('created_at', windowStart)

    if (countError) return onFailure('failed to count hits')

    // The hit just inserted is included in the count, so exactly `max`
    // requests are permitted per window.
    return { allowed: (count ?? 0) <= opts.max }
  } catch (err) {
    void err
    return onFailure('unexpected error')
  }
}
