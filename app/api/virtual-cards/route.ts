import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0004_shared_wallet_and_virtual_cards.sql.'

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

// Lists the current user's assigned cards. Masked fields only — the
// encrypted credential column is never selected here.
export async function GET() {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_virtual_cards')
      .select('id, label, card_brand, last4, expiry_month, expiry_year, status, credential_revealed_at')
      .eq('assigned_user_id', userId)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    return NextResponse.json({
      cards: (data ?? []).map((c) => ({
        id: c.id,
        label: c.label,
        cardBrand: c.card_brand,
        last4: c.last4,
        expiryMonth: c.expiry_month,
        expiryYear: c.expiry_year,
        status: c.status,
        revealed: Boolean(c.credential_revealed_at),
      })),
    })
  } catch (err) {
    await logError('virtual-cards-route-get', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
