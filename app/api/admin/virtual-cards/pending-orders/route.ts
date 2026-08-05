import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { isAdminEmail } from '@/lib/security/admin'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0004_shared_wallet_and_virtual_cards.sql.'

async function requireAdmin() {
  const session = await auth()
  const email = session?.user?.email
  if (!isAdminEmail(email)) {
    return { error: NextResponse.json({ message: 'Not found.' }, { status: 404 }) }
  }
  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
  return {}
}

export async function GET() {
  const resolved = await requireAdmin()
  if (resolved.error) return resolved.error

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_virtual_card_orders')
      .select('id, user_id, requested_note, marketed_price_usd, created_at, unreal_bs_users(business_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    return NextResponse.json({
      orders: (data ?? []).map((o) => {
        const user = Array.isArray(o.unreal_bs_users) ? o.unreal_bs_users[0] : o.unreal_bs_users
        return {
          id: o.id,
          userId: o.user_id,
          businessName: user?.business_name ?? null,
          email: user?.email ?? null,
          requestedNote: o.requested_note,
          marketedPriceUsd: o.marketed_price_usd ? Number(o.marketed_price_usd) : null,
          createdAt: o.created_at,
        }
      }),
    })
  } catch (err) {
    await logError('admin-virtual-cards-pending-orders-get', err)
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
