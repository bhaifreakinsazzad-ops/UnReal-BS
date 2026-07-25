import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { decryptCardCredential } from '@/lib/crypto/card-credentials'
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

// One-time reveal: decrypts and atomically clears the stored credential in a
// single DB statement (unreal_bs_reveal_card_credential), so it is
// physically impossible to reveal the same card twice, even under
// concurrent requests. The plaintext is returned once and never logged.
export async function GET(_request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved
  const { cardId } = await params

  try {
    const supabase = getSupabaseAdmin()

    const { data: card, error: cardError } = await supabase
      .from('unreal_bs_virtual_cards')
      .select('id, credential_revealed_at')
      .eq('id', cardId)
      .eq('assigned_user_id', userId)
      .maybeSingle()

    if (cardError) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    if (!card) return NextResponse.json({ message: 'Card not found.' }, { status: 404 })

    if (card.credential_revealed_at) {
      return NextResponse.json(
        {
          message: `This card's credentials were already revealed on ${card.credential_revealed_at}. Contact support if you need them resent.`,
        },
        { status: 410 }
      )
    }

    const { data: encrypted, error: revealError } = await supabase.rpc('unreal_bs_reveal_card_credential', {
      p_card_id: card.id,
    })

    if (revealError || !encrypted) {
      return NextResponse.json(
        { message: 'This card has already been revealed or is not ready yet.' },
        { status: 410 }
      )
    }

    const plaintext = decryptCardCredential(encrypted)
    return NextResponse.json({ credential: plaintext })
  } catch (err) {
    await logError('virtual-cards-reveal-route-get', err, { userId, cardId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
