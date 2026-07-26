import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 1000

// Read-only usage dashboard for the AI Subscriptions feature — spend by
// model over the last 30 days, sourced from unreal_bs_ai_usage_ledger
// (the same table the wallet debit writes to).
//
// SECURITY: this route previously authenticated the caller and then queried
// the ledger with NO ownership filter, so every user was shown the entire
// platform's AI spend, model mix and call volume as their own bill. It runs on
// the service-role key and the table's RLS policy is `using (true)`, so nothing
// below the application layer caught it. Every query here must stay scoped by
// user_id.
export async function GET() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ byModel: [], totalCostBdt: 0, totalCalls: 0 })
  }

  try {
    const userId = await resolveUserIdByEmail(email)
    if (!userId) return NextResponse.json({ byModel: [], totalCostBdt: 0, totalCalls: 0 })

    const supabase = getSupabaseAdmin()
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Page explicitly: Supabase caps an unbounded select at 1000 rows, which
    // silently under-reported the total once a user passed that many calls.
    const rows: { provider: string; model_id: string; cost_bdt: number | string; input_tokens: number; output_tokens: number }[] = []
    for (let page = 0; ; page++) {
      const { data, error } = await supabase
        .from('unreal_bs_ai_usage_ledger')
        .select('provider, model_id, cost_bdt, input_tokens, output_tokens, status')
        .eq('user_id', userId)
        .gte('created_at', since)
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)

      if (error) {
        await logError('settings-ai-usage-summary-query', error, { userId })
        return NextResponse.json({ byModel: [], totalCostBdt: 0, totalCalls: 0 })
      }

      const batch = data ?? []
      rows.push(...batch)
      if (batch.length < PAGE_SIZE) break
    }

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
  } catch (err) {
    await logError('settings-ai-usage-summary-get', err)
    return NextResponse.json({ byModel: [], totalCostBdt: 0, totalCalls: 0 })
  }
}
