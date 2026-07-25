import { NextResponse } from 'next/server'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0003_ai_subscriptions.sql.'

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const nowIso = new Date().toISOString()

    // A model is selectable if it's active and not past its active_until
    // date. A model past its active_until is replaced by its fallback_model
    // (the fallback surfaces once the row it replaces expires, not before —
    // so this is a real handoff, not a permanent duplicate in the list).
    const { data, error } = await supabase
      .from('unreal_bs_ai_model_rates')
      .select('id, model_id, provider, display_name, active_until, fallback_model_id')
      .eq('is_active', true)

    if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    const rows = data ?? []
    const expiredFallbackIds = new Set(
      rows
        .filter((r) => r.active_until && r.active_until <= nowIso && r.fallback_model_id)
        .map((r) => r.fallback_model_id as string)
    )

    const { data: fallbackRows, error: fallbackError } = expiredFallbackIds.size
      ? await supabase
          .from('unreal_bs_ai_model_rates')
          .select('id, model_id, provider, display_name')
          .in('id', Array.from(expiredFallbackIds))
      : { data: [], error: null }

    if (fallbackError) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    const visible = rows.filter((r) => !r.active_until || r.active_until > nowIso)
    const byModelId = new Map<string, { id: string; model_id: string; provider: string; display_name: string }>()
    for (const row of [...visible, ...(fallbackRows ?? [])]) {
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
