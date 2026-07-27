import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Bundles are not available yet. Run the migration in supabase/migrations/0009_ai_bundles_and_repriced_rate_card.sql.'

// Prepaid AI bundles.
//
// A bundle is a fixed-price top-up that lands MORE credit in the wallet than
// the customer paid — the bonus is the bulk discount. Because every model is
// priced at true cost with the same 1.40x markup, the most we can ever pay a
// provider for a bundle is credit_bdt / 1.40, whichever models the customer
// picks. That ceiling is stored on the row as cost_cap_bdt.
//
// Purchase reuses the deposit-request flow rather than inventing a second
// money path: the customer submits a request, the operator confirms the money
// actually arrived, and the existing atomic RPC credits the wallet.

export async function GET() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ bundles: [] })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_ai_bundles')
      .select('code, name_en, name_bn, tagline_en, tagline_bn, price_bdt, credit_bdt')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      await logError('bundles-get', error)
      return NextResponse.json({ bundles: [] })
    }

    // cost_cap_bdt is deliberately NOT exposed — it is our internal margin.
    return NextResponse.json({
      bundles: (data ?? []).map((b) => ({
        code: b.code,
        nameEn: b.name_en,
        nameBn: b.name_bn,
        taglineEn: b.tagline_en,
        taglineBn: b.tagline_bn,
        priceBdt: Number(b.price_bdt),
        creditBdt: Number(b.credit_bdt),
        bonusBdt: Number(b.credit_bdt) - Number(b.price_bdt),
      })),
    })
  } catch (err) {
    await logError('bundles-get', err)
    return NextResponse.json({ bundles: [] })
  }
}

const purchaseSchema = z.object({
  code: z.string().trim().min(1).max(50),
  method: z.string().trim().min(1).max(50).optional(),
  note: z.string().trim().max(500).optional(),
})

export async function POST(request: Request) {
  const session = await auth()
  const email = session?.user?.email
  if (!email) {
    return NextResponse.json({ message: 'Authentication required.' }, { status: 401 })
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = purchaseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const { code, method, note } = parsed.data

  try {
    const userId = await resolveUserIdByEmail(email)
    if (!userId) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    const supabase = getSupabaseAdmin()

    // Price and credit are read from the DB, never trusted from the client —
    // otherwise a caller could post their own creditBdt and mint wallet money.
    const { data: bundle, error: bundleError } = await supabase
      .from('unreal_bs_ai_bundles')
      .select('code, price_bdt, credit_bdt')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle()

    if (bundleError) {
      await logError('bundles-purchase-lookup', bundleError, { userId, code })
      return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    }
    if (!bundle) {
      return NextResponse.json({ message: 'That package is not available.' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('unreal_bs_deposit_requests')
      .insert({
        user_id: userId,
        requested_amount_bdt: bundle.price_bdt,
        bundle_code: bundle.code,
        bundle_credit_bdt: bundle.credit_bdt,
        method: method || null,
        note: note || null,
        status: 'pending',
      })
      .select('id, requested_amount_bdt, bundle_credit_bdt')
      .single()

    // 23505 = the partial unique index from migration 0007 (one pending
    // request per user). Prevents a double-tap creating two claims that could
    // each be approved separately for one real payment.
    if (error?.code === '23505') {
      return NextResponse.json(
        { message: 'You already have a pending top-up. Wait for it to be confirmed before buying another package.' },
        { status: 409 }
      )
    }
    if (error) {
      await logError('bundles-purchase-insert', error, { userId, code })
      return NextResponse.json({ message: 'Could not place this order.' }, { status: 502 })
    }

    return NextResponse.json(
      {
        request: {
          id: data.id,
          priceBdt: Number(data.requested_amount_bdt),
          creditBdt: Number(data.bundle_credit_bdt),
        },
      },
      { status: 201 }
    )
  } catch (err) {
    await logError('bundles-purchase', err, { code })
    return NextResponse.json({ message: 'Could not place this order.' }, { status: 502 })
  }
}
