import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/log-error'
import { hashAccessToken } from '@/lib/commerce/access-token'
import { storefrontEnabledForRequest } from '@/lib/commerce/flags'
import { isGatewayConfigured, manualPaymentTargets } from '@/lib/commerce/payment-provider'
import { recordAuditEvent } from '@/lib/security/audit'
import { clientIp, opaqueRateKey, readJson } from '@/lib/security/request'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  method: z.enum(['bkash', 'nagad', 'rocket']),
  payerReference: z.string().trim().min(4).max(60).regex(/^[A-Za-z0-9-]+$/),
  payerMsisdn: z.string().trim().max(30).optional(),
})
const TOKEN = /^[A-Za-z0-9_-]{40,64}$/

export async function GET(_request: Request, { params }: { params: Promise<{ accessToken: string }> }) {
  if (!(await storefrontEnabledForRequest())) return new NextResponse(null, { status: 404 })
  const { accessToken } = await params
  if (!TOKEN.test(accessToken)) return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
  if (!isSupabaseConfigured()) return NextResponse.json({ message: 'Checkout is not available right now.' }, { status: 502 })

  const accessHash = hashAccessToken(accessToken)
  const accessLimit = await checkRateLimit('checkout-access-token-read', accessHash, {
    max: 60,
    windowSeconds: 3600,
    failClosed: true,
  })
  if (!accessLimit.allowed) {
    return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  try {
    const { data: order } = await getSupabaseAdmin()
      .from('unreal_bs_orders')
      .select('product_title, product_kind, buyer_name, buyer_phone, price_bdt, status, payment_method, payer_reference, paid_at, created_at, purchase_event_id')
      .eq('access_token_hash', accessHash)
      .maybeSingle()
    if (!order) return NextResponse.json({ message: 'Order not found.' }, { status: 404 })

    return NextResponse.json({
      order: {
        accessToken,
        productTitle: order.product_title,
        productKind: order.product_kind,
        buyerName: order.buyer_name,
        buyerPhone: order.buyer_phone,
        priceBdt: Number(order.price_bdt),
        status: order.status,
        paymentMethod: order.payment_method,
        payerReference: order.payer_reference ? `***${String(order.payer_reference).slice(-4)}` : null,
        purchaseEventId: order.status === 'paid' ? order.purchase_event_id : null,
        paidAt: order.paid_at,
        createdAt: order.created_at,
      },
      payment: { manual: !isGatewayConfigured(), targets: Number(order.price_bdt) === 0 ? [] : manualPaymentTargets() },
    }, { headers: { 'cache-control': 'no-store' } })
  } catch (err) {
    await logError('checkout-status', err)
    return NextResponse.json({ message: 'Could not load your order.' }, { status: 502 })
  }
}
export async function PATCH(request: Request, { params }: { params: Promise<{ accessToken: string }> }) {
  if (!(await storefrontEnabledForRequest())) return new NextResponse(null, { status: 404 })
  const { accessToken } = await params
  if (!TOKEN.test(accessToken)) return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
  if (!isSupabaseConfigured()) return NextResponse.json({ message: 'Checkout is not available right now.' }, { status: 502 })

  const parsed = await readJson(request, patchSchema, { maxBytes: 8192 })
  if (parsed.error) return parsed.error
  const accessHash = hashAccessToken(accessToken)
  const [tokenLimit, referenceLimit, ipLimit] = await Promise.all([
    checkRateLimit('checkout-access-token', accessHash, { max: 15, windowSeconds: 3600, failClosed: true }),
    checkRateLimit('checkout-payment-reference', opaqueRateKey(`${parsed.data.method}:${parsed.data.payerReference}`), { max: 5, windowSeconds: 86400, failClosed: true }),
    checkRateLimit('checkout-submit-ip', opaqueRateKey(clientIp(request)), { max: 30, windowSeconds: 3600, failClosed: true }),
  ])
  if (!tokenLimit.allowed || !referenceLimit.allowed || !ipLimit.allowed) {
    return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  try {
    const { data, error } = await getSupabaseAdmin()
      .from('unreal_bs_orders')
      .update({
        status: 'verification_submitted',
        payment_method: parsed.data.method,
        payer_reference: parsed.data.payerReference,
        payer_msisdn: parsed.data.payerMsisdn ?? null,
        verification_submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('access_token_hash', accessHash)
      .in('status', ['pending_payment', 'verification_submitted'])
      .select('id, status')
      .maybeSingle()

    if (error?.code === '23505') {
      return NextResponse.json({ message: 'That payment reference has already been used.' }, { status: 409 })
    }
    if (error) {
      await logError('checkout-submit-reference', error, { requestId: parsed.requestId })
      return NextResponse.json({ message: 'Could not save that Transaction ID.' }, { status: 502 })
    }
    if (!data) return NextResponse.json({ message: 'This order has already been processed. Check your access link.' }, { status: 409 })

    await recordAuditEvent({ eventType: 'commerce.payment_verification_submitted', targetType: 'order', targetId: data.id, requestId: parsed.requestId, metadata: { provider: parsed.data.method } })
    return NextResponse.json({ order: { accessToken, status: data.status } }, { headers: { 'x-request-id': parsed.requestId, 'cache-control': 'no-store' } })
  } catch (err) {
    await logError('checkout-submit-reference', err, { requestId: parsed.requestId })
    return NextResponse.json({ message: 'Could not save that Transaction ID.' }, { status: 502 })
  }
}
