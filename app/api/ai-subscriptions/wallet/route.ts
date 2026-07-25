import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0003_ai_subscriptions.sql.'

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

export async function GET() {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  try {
    const supabase = getSupabaseAdmin()

    // Insert-if-missing without ever resetting an existing balance: look
    // the row up first, only insert a zero-balance row when none exists.
    const { data: existing, error: selectError } = await supabase
      .from('unreal_bs_ai_wallets')
      .select('balance_bdt, low_balance_threshold_bdt')
      .eq('user_id', userId)
      .maybeSingle()

    if (selectError) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    if (existing) {
      return NextResponse.json({
        balance: Number(existing.balance_bdt),
        lowBalanceThreshold: Number(existing.low_balance_threshold_bdt),
      })
    }

    const { data: created, error: insertError } = await supabase
      .from('unreal_bs_ai_wallets')
      .insert({ user_id: userId, balance_bdt: 0 })
      .select('balance_bdt, low_balance_threshold_bdt')
      .single()

    if (insertError) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    return NextResponse.json({
      balance: Number(created.balance_bdt),
      lowBalanceThreshold: Number(created.low_balance_threshold_bdt),
    })
  } catch (err) {
    await logError('ai-subscriptions-wallet-route-get', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
