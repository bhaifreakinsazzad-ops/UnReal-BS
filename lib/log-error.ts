import 'server-only'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'

// Self-contained error logging backed by Supabase, standing in for a
// third-party monitoring service (Sentry, etc.) we haven't wired up yet.
// Never throws — a logging failure must not take down the caller.

export async function logError(
  source: string,
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  if (!isSupabaseConfigured()) {
    console.error(`[log-error:${source}]`, message, context ?? '')
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const { error: insertError } = await supabase.from('unreal_bs_error_logs').insert({
      source,
      message,
      stack: stack ?? null,
      context: context ?? null,
    })
    if (insertError) {
      console.error('[log-error] failed to persist error log:', insertError, { source, message })
    }
  } catch (err) {
    console.error('[log-error] unexpected failure while logging error:', err, { source, message })
  }
}
