import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/log-error'
import { generateAccessToken } from '@/lib/commerce/access-token'
import { storefrontEnabledForRequest } from '@/lib/commerce/flags'
import { platformSplitPrice } from '@/lib/commerce/pricing'
import { syncOrderToGhl } from '@/lib/commerce/ghl-sync'
import { isGatewayConfigured, manualPaymentTargets } from '@/lib/commerce/payment-provider'
import { attributionColumns, attributionSchema } from '@/lib/meta/attribution'
import { sendMetaEvent } from '@/lib/meta/capi'
import { clientIp, opaqueRateKey, readJson } from '@/lib/security/request'

export const dynamic = 'force-dynamic'

const checkoutSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  buyerName: z.string().trim().min(1).max(120),
  buyerPhone: z.string().trim().min(6).max(30),
  buyerEmail: z.string().trim().email().max(200).optional().or(z.literal('')),
}).extend(attributionSchema.shape)

export async function POST(request: Request) {
  if (!(await storefrontEnabledForRequest())) return new NextResponse(null, { status: 404 })
  if (!isSupabaseConfigured()) return NextResponse.json({ message: 'Checkout is not available right now.' }, { status: 502 })

  const parsed = await readJson(request, checkoutSchema, { maxBytes: 16 * 1024 })
  if (parsed.error) return parsed.error
  const { slug, buyerName, buyerPhone } = parsed.data
  const buyerEmail = parsed.data.buyerEmail || null
  const ip = clientIp(request)

  const [ipLimit, buyerLimit] = await Promise.all([
    checkRateLimit('checkout-ip', opaqueRateKey(ip), { max: 20, windowSeconds: 3600, failClosed: true }),
    checkRateLimit('checkout-buyer', opaqueRateKey(buyerPhone), { max: 10, windowSeconds: 3600, failClosed: true }),
  ])
  if (!ipLimit.allowed || !buyerLimit.allowed) {
    return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429, headers: { 'x-request-id': parsed.requestId } })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data: product } = await supabase
      .from('unreal_bs_digital_products')
      .select('id, seller_id, platform_owned, kind, title, price_bdt, status')
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('platform_owned', true)
      .maybeSingle()
    if (!product) return NextResponse.json({ message: 'This product is no longer available.' }, { status: 404 })

    const productLimit = await checkRateLimit('checkout-product', product.id, { max: 200, windowSeconds: 3600, failClosed: true })
    if (!productLimit.allowed) {
      return NextResponse.json({ message: 'This product is receiving too many orders right now. Please try again shortly.' }, { status: 429 })
    }

    const split = platformSplitPrice(Number(product.price_bdt))
    const isFree = split.priceBdt === 0
    const paymentTargets = isFree ? [] : manualPaymentTargets()
    if (!isFree && paymentTargets.length === 0) {
      return NextResponse.json({ message: 'Paid checkout is not available until a verified payment destination is configured.' }, { status: 503 })
    }

    const access = generateAccessToken()
    const purchaseEventId = randomUUID().replace(/-/g, '')
    const { data: order, error } = await supabase
      .from('unreal_bs_orders')
      .insert({
        product_id: product.id,
        seller_id: product.seller_id,
        product_title: product.title,
        product_kind: product.kind,
        buyer_name: buyerName,
        buyer_phone: buyerPhone,
        buyer_email: buyerEmail,
        access_token: null,
        access_token_hash: access.hash,
        purchase_event_id: purchaseEventId,
        price_bdt: split.priceBdt,
        commission_bdt: split.commissionBdt,
        seller_payout_bdt: 0,
        status: 'pending_payment',
        ...attributionColumns(parsed.data),
      })
      .select('id, price_bdt, status')
      .single()

    if (error || !order) {
      await logError('checkout-create', error, { slug, requestId: parsed.requestId })
      return NextResponse.json({ message: 'Could not start your order.' }, { status: 502 })
    }

    if (isFree) {
      const { error: paidError } = await supabase.rpc('unreal_bs_order_mark_paid_v2', {
        p_order_id: order.id,
        p_method: 'free',
        p_reference: null,
        p_reason: 'Automatic access for free platform product',
        p_operator_email_hash: 'system',
        p_idempotency_key: `free:${order.id}`,
        p_expected_status: 'pending_payment',
      })
      if (paidError) {
        await logError('checkout-free-mark-paid', paidError, { orderId: order.id })
        return NextResponse.json({ message: 'Could not activate free access. Please try again.' }, { status: 502 })
      }
      await syncOrderToGhl(order.id)
    }

    if (parsed.data.eventId) {
      await sendMetaEvent({
        eventName: 'InitiateCheckout',
        eventId: parsed.data.eventId,
        eventSourceUrl: parsed.data.landingPage || new URL(request.url).origin + `/p/${encodeURIComponent(slug)}`,
        attribution: parsed.data,
        email: buyerEmail,
        phone: buyerPhone,
        clientIp: ip,
        userAgent: request.headers.get('user-agent'),
        valueBdt: split.priceBdt,
        orderId: order.id,
      })
    }

    return NextResponse.json({
      order: { accessToken: access.raw, priceBdt: split.priceBdt, status: isFree ? 'paid' : 'pending_payment' },
      payment: { manual: !isGatewayConfigured(), targets: paymentTargets },
    }, { status: 201, headers: { 'x-request-id': parsed.requestId, 'cache-control': 'no-store' } })
  } catch (err) {
    await logError('checkout-create', err, { slug, requestId: parsed.requestId })
    return NextResponse.json({ message: 'Could not start your order.' }, { status: 502 })
  }
}
