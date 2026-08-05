import 'server-only'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { redactSensitive } from '@/lib/security/redaction'

// Self-contained error logging backed by Supabase, standing in for a
// third-party monitoring service (Sentry, etc.) we haven't wired up yet.
// Never throws — a logging failure must not take down the caller.

export async function logError(
  source: string,
  error: unknown,
  context?: Record<string, unknown>
): Promise<void> {
  const safeError = redactSensitive(error) as { message?: string; stack?: string } | string
  const message = typeof safeError === 'string' ? safeError : safeError.message ?? 'Unexpected error'
  const stack = typeof safeError === 'string' ? undefined : safeError.stack
  const safeContext = redactSensitive(context ?? {})

  if (!isSupabaseConfigured()) {
    console.error(`[log-error:${source}]`, message, safeContext)
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const { error: insertError } = await supabase.from('unreal_bs_error_logs').insert({
      source,
      message,
      stack: stack ?? null,
      context: safeContext,
    })
    if (insertError) {
      console.error('[log-error] failed to persist redacted error log', { source, code: insertError.code })
    }
  } catch (err) {
    void err
    console.error('[log-error] unexpected persistence failure', { source })
  }
}
