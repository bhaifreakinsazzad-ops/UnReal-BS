import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'
import { dbNotReady } from '@/lib/commerce/guards'
import { syncOrderToGhl } from '@/lib/commerce/ghl-sync'
import { commerceEnabledFor } from '@/lib/commerce/flags'
import { sendMetaEvent } from '@/lib/meta/capi'
import { checkRateLimit } from '@/lib/rate-limit'
import { requireAdminSession } from '@/lib/security/admin'
import { recordAuditEvent } from '@/lib/security/audit'
import { opaqueRateKey, readJson } from '@/lib/security/request'
import { hasFreshStepUp } from '@/lib/security/step-up'

export const dynamic = 'force-dynamic'

const patchSchema = z.object({
  orderId: z.string().uuid(),
  action: z.enum(['confirm', 'reject', 'refund']),
  expectedStatus: z.enum(['pending_payment', 'verification_submitted', 'paid']),
  reason: z.string().trim().min(3).max(1000),
  refundReference: z.string().trim().min(4).max(100).regex(/^[A-Za-z0-9_-]+$/).optional(),
}).superRefine((value, ctx) => {
  if (value.action === 'refund' && !value.refundReference) {
    ctx.addIssue({ code: 'custom', path: ['refundReference'], message: 'Refund reference is required.' })
  }
})

export async function GET() {
  const admin = await requireAdminSession()
  if (admin.error) return admin.error
  if (!commerceEnabledFor(admin.email)) return NextResponse.json({ message: 'Commerce is disabled.' }, { status: 403 })
  if (!isSupabaseConfigured()) return dbNotReady()
  try {
    const { data, error } = await getSupabaseAdmin()
      .from('unreal_bs_orders')
      .select('id, product_id, product_title, product_kind, buyer_name, buyer_phone, buyer_email, price_bdt, commission_bdt, seller_payout_bdt, status, payment_method, payer_reference, payer_msisdn, ghl_contact_id, admin_note, paid_at, refunded_at, refund_reference, created_at, unreal_bs_users!unreal_bs_orders_seller_id_fkey(business_name, email)')
      .neq('status', 'pending_payment')
      .order('created_at', { ascending: true })
      .limit(300)
    if (error) {
      await logError('admin-orders-get', error)
      return dbNotReady()
    }
    return NextResponse.json({ orders: (data ?? []).map((o) => {
      const u = Array.isArray(o.unreal_bs_users) ? o.unreal_bs_users[0] : o.unreal_bs_users
      return {
        id: o.id, productId: o.product_id, productTitle: o.product_title, productKind: o.product_kind,
        sellerName: u?.business_name ?? null, sellerEmail: u?.email ?? null,
        buyerName: o.buyer_name, buyerPhone: o.buyer_phone, buyerEmail: o.buyer_email,
        priceBdt: Number(o.price_bdt), platformRevenueBdt: Number(o.commission_bdt), sellerPayoutBdt: 0,
        status: o.status, paymentMethod: o.payment_method, payerReference: o.payer_reference,
        payerMsisdn: o.payer_msisdn, ghlSynced: Boolean(o.ghl_contact_id), adminNote: o.admin_note,
        paidAt: o.paid_at, refundedAt: o.refunded_at, refundReference: o.refund_reference, createdAt: o.created_at,
      }
    }) }, { headers: { 'cache-control': 'no-store' } })
  } catch (err) {
    await logError('admin-orders-get', err)
    return dbNotReady()
  }
}

export async function PATCH(request: Request) {
  const admin = await requireAdminSession({ hide: false })
  if (admin.error) return admin.error
  if (!commerceEnabledFor(admin.email)) return NextResponse.json({ message: 'Commerce is disabled.' }, { status: 403 })
  if (!isSupabaseConfigured()) return dbNotReady()
  if (!hasFreshStepUp(request, admin.email)) {
    return NextResponse.json({ message: 'Re-enter your password before this money operation.', code: 'REVERIFY_REQUIRED' }, { status: 428 })
  }

  const idempotencyKey = request.headers.get('idempotency-key')?.trim()
  if (!idempotencyKey || !/^[A-Za-z0-9_-]{12,120}$/.test(idempotencyKey)) {
    return NextResponse.json({ message: 'A valid Idempotency-Key header is required.' }, { status: 400 })
  }
  const parsed = await readJson(request, patchSchema, { maxBytes: 8192 })
  if (parsed.error) return parsed.error
  const { orderId, action, expectedStatus, reason, refundReference } = parsed.data

  const limit = await checkRateLimit('admin-money-operation', opaqueRateKey(`${admin.email}:${action}`), { max: 30, windowSeconds: 3600, failClosed: true })
  if (!limit.allowed) return NextResponse.json({ message: 'Too many money operations. Try again later.' }, { status: 429 })

  try {
    const supabase = getSupabaseAdmin()
    const common = {
      p_order_id: orderId,
      p_reason: reason,
      p_operator_email_hash: opaqueRateKey(admin.email),
      p_idempotency_key: idempotencyKey,
      p_expected_status: expectedStatus,
    }
    const result = action === 'confirm'
      ? await supabase.rpc('unreal_bs_order_mark_paid_v2', { ...common, p_method: null, p_reference: null })
      : action === 'refund'
        ? await supabase.rpc('unreal_bs_order_refund_v2', { ...common, p_refund_reference: refundReference })
        : await supabase.rpc('unreal_bs_order_reject_v1', common)

    if (result.error) {
      if (/ORDER_(NOT_PAYABLE|NOT_REFUNDABLE|NOT_REJECTABLE)|STATUS_MISMATCH|IDEMPOTENCY_CONFLICT/i.test(result.error.message ?? '')) {
        return NextResponse.json({ message: 'The order changed before this operation. Refresh and review it again.' }, { status: 409 })
      }
      await logError(`admin-order-${action}`, result.error, { orderId, requestId: parsed.requestId })
      return NextResponse.json({ message: `Could not ${action} this order.` }, { status: 502 })
    }

    await recordAuditEvent({ eventType: `commerce.order.${action}`, actorEmail: admin.email, targetType: 'order', targetId: orderId, requestId: parsed.requestId, metadata: { expectedStatus, idempotencyKey } })

    if (action === 'confirm') {
      await syncOrderToGhl(orderId)
      const { data: order } = await supabase
        .from('unreal_bs_orders')
        .select('buyer_email, buyer_phone, price_bdt, purchase_event_id, marketing_consent, consent_version, utm_source, utm_medium, utm_campaign, utm_content, utm_term, fbclid, landing_page, referrer')
        .eq('id', orderId)
        .maybeSingle()
      if (order?.purchase_event_id) {
        await sendMetaEvent({
          eventName: 'Purchase',
          eventId: order.purchase_event_id,
          eventSourceUrl: order.landing_page || process.env.NEXT_PUBLIC_APP_URL || 'https://www.unreal-bs.shop',
          attribution: {
            utmSource: order.utm_source, utmMedium: order.utm_medium, utmCampaign: order.utm_campaign,
            utmContent: order.utm_content, utmTerm: order.utm_term, fbclid: order.fbclid,
            landingPage: order.landing_page, referrer: order.referrer,
            marketingConsent: Boolean(order.marketing_consent), consentVersion: order.consent_version,
          },
          email: order.buyer_email, phone: order.buyer_phone, valueBdt: Number(order.price_bdt), orderId,
        })
      }
    }
    return NextResponse.json({ ok: true }, { headers: { 'x-request-id': parsed.requestId } })
  } catch (err) {
    await logError('admin-orders-patch', err, { orderId, requestId: parsed.requestId })
    return NextResponse.json({ message: 'Could not update this order.' }, { status: 502 })
  }
}
