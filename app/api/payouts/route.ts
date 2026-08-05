import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/log-error'
import { dbNotReady, marketplaceDisabled, requireSellerId } from '@/lib/commerce/guards'
import { MIN_PAYOUT_BDT } from '@/lib/commerce/pricing'
import { auth } from '@/auth'
import { hasFreshStepUp } from '@/lib/security/step-up'

export const dynamic = 'force-dynamic'

// Requesting a payout DEBITS the wallet immediately (see
// unreal_bs_payout_request_create in migration 0013). The balance guard inside
// the debit's own UPDATE predicate does the reservation, so a seller cannot
// request a payout and then spend the same taka on AI credit before the
// operator gets to it. A rejected request puts the money straight back.

const createSchema = z.object({
  amountBdt: z.number().min(MIN_PAYOUT_BDT).max(1_000_000),
  method: z.enum(['bkash', 'nagad', 'rocket', 'bank']),
  accountNumber: z.string().trim().min(4).max(40),
  accountName: z.string().trim().max(120).optional(),
})

export async function POST(request: Request) {
  const disabled = marketplaceDisabled()
  if (disabled) return disabled
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved
  const session = await auth()
  const email = session?.user?.email?.trim().toLowerCase()
  if (!email || !hasFreshStepUp(request, email)) {
    return NextResponse.json({ message: 'Re-enter your password before requesting a payout.', code: 'REVERIFY_REQUIRED' }, { status: 428 })
  }

  const { allowed } = await checkRateLimit('payout-request', userId, { max: 10, windowSeconds: 86_400, failClosed: true })
  if (!allowed) {
    return NextResponse.json(
      { message: 'Too many payout requests today. Try again tomorrow.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: `Enter an amount of at least ৳${MIN_PAYOUT_BDT} and the account to send it to.`,
        errors: parsed.error.flatten(),
      },
      { status: 400 }
    )
  }

  const p = parsed.data

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.rpc('unreal_bs_payout_request_create', {
      p_seller_id: userId,
      p_amount_bdt: Math.round(p.amountBdt),
      p_method: p.method,
      p_account_number: p.accountNumber,
      p_account_name: p.accountName ?? null,
    })

    if (error) {
      if (/INSUFFICIENT_BALANCE/i.test(error.message ?? '')) {
        return NextResponse.json(
          { message: 'Your balance is not enough for that payout.', code: 'INSUFFICIENT_BALANCE' },
          { status: 402 }
        )
      }
      await logError('payout-request-create', error, { userId })
      return dbNotReady()
    }

    return NextResponse.json({ payout: { id: data?.id ?? null, status: 'pending' } }, { status: 201 })
  } catch (err) {
    await logError('payout-request-create', err, { userId })
    return dbNotReady()
  }
}
