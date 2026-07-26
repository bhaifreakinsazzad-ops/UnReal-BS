import { NextResponse } from 'next/server'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0003_ai_subscriptions.sql.'

// NOTE: this route previously selected `active_until` and `fallback_model_id`
// and filtered on them to implement model retirement. Neither column has ever
// existed — unreal_bs_ai_model_rates is created once, in
// supabase/migrations/0003_ai_subscriptions.sql, without them, and no
// migration adds them. Postgres therefore answered every request with error
// 42703 and every user got a 502, which meant the metered AI product was
// unusable for everyone, permanently.
//
// The columns are removed rather than added because model retirement is not
// implemented anywhere else either (the chat route's matching guard read
// `undefined` and never fired). Reinstating retirement means a real migration
// plus a real guard in the chat route — see the note there.
export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }

  try {
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('unreal_bs_ai_model_rates')
      .select('id, model_id, provider, display_name')
      .eq('is_active', true)

    if (error) {
      await logError('ai-subscriptions-models-route-query', error)
      return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    }

    // Deduplicate by model_id — the same model can legitimately be seeded more
    // than once (e.g. re-priced rows) and users should see it once.
    const byModelId = new Map<string, { id: string; model_id: string; provider: string; display_name: string }>()
    for (const row of data ?? []) {
      byModelId.set(row.model_id, row)
    }

    const models = Array.from(byModelId.values())
      .sort((a, b) => a.provider.localeCompare(b.provider) || a.display_name.localeCompare(b.display_name))
      .map((row) => ({
        id: row.model_id,
        provider: row.provider,
        displayName: row.display_name,
      }))

    return NextResponse.json({ models })
  } catch (err) {
    await logError('ai-subscriptions-models-route-get', err)
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
