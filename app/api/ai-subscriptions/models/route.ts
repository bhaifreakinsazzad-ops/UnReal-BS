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
    const { data, error } = await supabase
      .from('unreal_bs_ai_model_rates')
      .select('model_id, provider, display_name')
      .eq('is_active', true)
      .order('provider', { ascending: true })
      .order('display_name', { ascending: true })

    if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    const models = (data ?? []).map((row) => ({
      id: row.model_id as string,
      provider: row.provider as string,
      displayName: row.display_name as string,
    }))

    return NextResponse.json({ models })
  } catch (err) {
    await logError('ai-subscriptions-models-route-get', err)
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
