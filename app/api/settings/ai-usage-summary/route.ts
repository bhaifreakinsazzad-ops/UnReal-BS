import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'

export const dynamic = 'force-dynamic'

// Read-only usage dashboard for the AI Subscriptions feature — spend by
// model over the last 30 days, sourced from unreal_bs_ai_usage_ledger
// (the same table the wallet debit writes to).
export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ byModel: [], totalCostBdt: 0, totalCalls: 0 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('unreal_bs_ai_usage_ledger')
      .select('provider, model_id, cost_bdt, input_tokens, output_tokens, status')
      .gte('created_at', since)

    if (error) return NextResponse.json({ byModel: [], totalCostBdt: 0, totalCalls: 0 })

    const rows = data ?? []
    const byModelMap = new Map<
      string,
      { provider: string; modelId: string; calls: number; costBdt: number; inputTokens: number; outputTokens: number }
    >()

    for (const row of rows) {
      const key = `${row.provider}:${row.model_id}`
      const entry = byModelMap.get(key) ?? {
        provider: row.provider as string,
        modelId: row.model_id as string,
        calls: 0,
        costBdt: 0,
        inputTokens: 0,
        outputTokens: 0,
      }
      entry.calls += 1
      entry.costBdt += Number(row.cost_bdt)
      entry.inputTokens += Number(row.input_tokens)
      entry.outputTokens += Number(row.output_tokens)
      byModelMap.set(key, entry)
    }

    const byModel = Array.from(byModelMap.values())
      .map((m) => ({ ...m, costBdt: Math.round(m.costBdt * 100) / 100 }))
      .sort((a, b) => b.costBdt - a.costBdt)

    const totalCostBdt = Math.round(byModel.reduce((s, m) => s + m.costBdt, 0) * 100) / 100
    const totalCalls = byModel.reduce((s, m) => s + m.calls, 0)

    return NextResponse.json({ byModel, totalCostBdt, totalCalls })
  } catch {
    return NextResponse.json({ byModel: [], totalCostBdt: 0, totalCalls: 0 })
  }
}
