import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0004_shared_wallet_and_virtual_cards.sql.'

const LIMIT = 50

interface LedgerEntry {
  id: string
  kind: string
  direction: 'credit' | 'debit'
  amountBdt: number
  balanceAfterBdt: number
  note: string | null
  createdAt: string
}

async function requireUserId() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return { error: NextResponse.json({ message: 'Authentication required.' }, { status: 401 }) }

  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }

  try {
    const userId = await resolveUserIdByEmail(email)
    if (!userId) {
      return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
    }
    return { userId }
  } catch {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
}

// Merges the generic wallet ledger (deposits, card purchases) with the AI
// usage ledger (metered chat debits) into one sorted, capped transaction
// history — both feed the same wallet balance, they just live in separate
// tables for schema clarity (see migration 0004 comments).
export async function GET() {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  try {
    const supabase = getSupabaseAdmin()

    const [walletLedgerRes, aiLedgerRes] = await Promise.all([
      supabase
        .from('unreal_bs_wallet_ledger')
        .select('id, kind, direction, amount_bdt, balance_after_bdt, note, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(LIMIT),
      supabase
        .from('unreal_bs_ai_usage_ledger')
        .select('id, provider, model_id, cost_bdt, balance_after_bdt, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(LIMIT),
    ])

    if (walletLedgerRes.error || aiLedgerRes.error) {
      return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    }

    const walletEntries: LedgerEntry[] = (walletLedgerRes.data ?? []).map((row) => ({
      id: row.id,
      kind: row.kind,
      direction: row.direction as 'credit' | 'debit',
      amountBdt: Number(row.amount_bdt),
      balanceAfterBdt: Number(row.balance_after_bdt),
      note: row.note,
      createdAt: row.created_at,
    }))

    const aiEntries: LedgerEntry[] = (aiLedgerRes.data ?? []).map((row) => ({
      id: row.id,
      kind: 'ai_usage',
      direction: 'debit',
      amountBdt: Number(row.cost_bdt),
      balanceAfterBdt: Number(row.balance_after_bdt),
      note: `${row.provider} · ${row.model_id}`,
      createdAt: row.created_at,
    }))

    const entries = [...walletEntries, ...aiEntries]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, LIMIT)

    return NextResponse.json({ entries })
  } catch (err) {
    await logError('wallet-ledger-route-get', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
