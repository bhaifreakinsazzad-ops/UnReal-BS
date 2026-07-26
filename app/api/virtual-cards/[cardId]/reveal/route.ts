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

// One-time reveal, ordered so that nothing is destroyed until the plaintext is
// known to be recoverable:
//   1. read the ciphertext (no mutation),
//   2. decrypt it — if this throws (missing / rotated / wrong-length
//      CARD_CREDENTIAL_ENC_KEY) we bail out with the record still intact,
//   3. only then call unreal_bs_reveal_card_credential, whose
//      SELECT ... FOR UPDATE ... WHERE credential_revealed_at IS NULL still
//      provides the atomic single-use guarantee under concurrency.
//
// The previous order cleared the ciphertext first and decrypted afterwards, so
// a rotated key — or a customer whose mobile connection dropped before the
// response arrived — permanently destroyed a card they had already paid for,
// with no way to recover or re-send it.
export async function GET(_request: Request, { params }: { params: Promise<{ cardId: string }> }) {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved
  const { cardId } = await params

  try {
    const supabase = getSupabaseAdmin()

    const { data: card, error: cardError } = await supabase
      .from('unreal_bs_virtual_cards')
      .select('id, credential_revealed_at, credential_secret_encrypted')
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

    if (!card.credential_secret_encrypted) {
      return NextResponse.json(
        { message: 'This card is not ready yet. Please contact support.' },
        { status: 410 }
      )
    }

    // Step 2 — prove the credential is recoverable BEFORE anything is cleared.
    // A decryption failure here leaves the stored ciphertext untouched, so the
    // customer can retry once the key problem is fixed.
    let plaintext: string
    try {
      plaintext = decryptCardCredential(card.credential_secret_encrypted)
    } catch (err) {
      await logError('virtual-cards-reveal-decrypt-failed', err, { userId, cardId })
      return NextResponse.json(
        {
          message:
            'We could not decrypt this card right now. Your card has NOT been used up — please contact support and try again.',
        },
        { status: 503 }
      )
    }

    // Step 3 — now consume it. The RPC re-checks credential_revealed_at under
    // a row lock, so if a concurrent request won the race this returns nothing
    // and we must not hand out the plaintext we decrypted above.
    const { data: encrypted, error: revealError } = await supabase.rpc('unreal_bs_reveal_card_credential', {
      p_card_id: card.id,
    })

    if (revealError || !encrypted) {
      return NextResponse.json(
        { message: 'This card has already been revealed or is not ready yet.' },
        { status: 410 }
      )
    }

    return NextResponse.json({ credential: plaintext })
  } catch (err) {
    await logError('virtual-cards-reveal-route-get', err, { userId, cardId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
