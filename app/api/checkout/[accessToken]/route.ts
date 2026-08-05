import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/log-error'
import { isGatewayConfigured, manualPaymentTargets } from '@/lib/commerce/payment-provider'

export const dynamic = 'force-dynamic'

// PUBLIC, keyed on the order's unguessable access token. That token is the
// buyer's only credential — it is what lets somebody with no account come back
// to their order from an SMS link.

const patchSchema = z.object({
  method: z.enum(['bkash', 'nagad', 'rocket']),
  payerReference: z.string().trim().min(4).max(60),
  payerMsisdn: z.string().trim().max(30).optional(),
})

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  const { accessToken } = await params
  if (!UUID.test(accessToken)) {
    return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: 'Checkout is not available right now.' }, { status: 502 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data: order } = await supabase
      .from('unreal_bs_orders')
      .select('access_token, product_title, product_kind, buyer_name, buyer_phone, price_bdt, status, payment_method, payer_reference, paid_at, created_at')
      .eq('access_token', accessToken)
      .maybeSingle()

    if (!order) return NextResponse.json({ message: 'Order not found.' }, { status: 404 })

    return NextResponse.json({
      order: {
        accessToken: order.access_token,
        productTitle: order.product_title,
        productKind: order.product_kind,
        buyerName: order.buyer_name,
        buyerPhone: order.buyer_phone,
        priceBdt: Number(order.price_bdt),
        status: order.status,
        paymentMethod: order.payment_method,
        payerReference: order.payer_reference,
        paidAt: order.paid_at,
        createdAt: order.created_at,
      },
      payment: {
        manual: !isGatewayConfigured(),
        targets: Number(order.price_bdt) === 0 ? [] : manualPaymentTargets(),
      },
    })
  } catch (err) {
    await logError('checkout-status', err)
    return NextResponse.json({ message: 'Could not load your order.' }, { status: 502 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ accessToken: string }> }
) {
  const { accessToken } = await params
  if (!UUID.test(accessToken)) {
    return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: 'Checkout is not available right now.' }, { status: 502 })
  }

  const { allowed } = await checkRateLimit('checkout-trxid', accessToken, {
    max: 15,
    windowSeconds: 3600,
  })
  if (!allowed) {
    return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Enter the Transaction ID from your payment SMS.' },
      { status: 400 }
    )
  }

  const p = parsed.data

  try {
    const supabase = getSupabaseAdmin()

    // The status guard is in the UPDATE predicate rather than in a preceding
    // read: submitting a TrxID must never touch an order that has already been
    // confirmed, rejected or refunded, and doing it this way there is no
    // window between the check and the write.
    const { data, error } = await supabase
      .from('unreal_bs_orders')
      .update({
        status: 'awaiting_confirmation',
        payment_method: p.method,
        payer_reference: p.payerReference,
        payer_msisdn: p.payerMsisdn ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('access_token', accessToken)
      .in('status', ['pending_payment', 'awaiting_confirmation'])
      .select('access_token, status')
      .maybeSingle()

    if (error) {
      await logError('checkout-submit-trxid', error)
      return NextResponse.json({ message: 'Could not save that Transaction ID.' }, { status: 502 })
    }

    if (!data) {
      return NextResponse.json(
        { message: 'This order has already been processed. Check your access link.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ order: { accessToken: data.access_token, status: data.status } })
  } catch (err) {
    await logError('checkout-submit-trxid', err)
    return NextResponse.json({ message: 'Could not save that Transaction ID.' }, { status: 502 })
  }
}
