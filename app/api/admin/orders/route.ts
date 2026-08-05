import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'
import { dbNotReady, requireAdmin } from '@/lib/commerce/guards'
import { syncOrderToGhl } from '@/lib/commerce/ghl-sync'

export const dynamic = 'force-dynamic'

// The payment desk. Somebody reads the bKash statement, matches a TrxID, and
// presses Confirm — which is the single moment money moves from "a customer
// says they paid" to "the seller has been credited".

const patchSchema = z.object({
  orderId: z.string().uuid(),
  action: z.enum(['confirm', 'reject', 'refund']),
  note: z.string().trim().max(1000).optional(),
})

export async function GET() {
  const resolved = await requireAdmin()
  if ('error' in resolved) return resolved.error

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_orders')
      .select('id, product_id, product_title, product_kind, buyer_name, buyer_phone, buyer_email, price_bdt, commission_bdt, seller_payout_bdt, status, payment_method, payer_reference, payer_msisdn, ghl_contact_id, admin_note, paid_at, refunded_at, created_at, unreal_bs_users!unreal_bs_orders_seller_id_fkey(business_name, email)')
      // An abandoned checkout is not work for anyone. Only orders where the
      // buyer has actually claimed to have paid reach this queue — same shape
      // as the ads queue skipping drafts.
      .neq('status', 'pending_payment')
      .order('created_at', { ascending: true })
      .limit(300)

    if (error) {
      await logError('admin-orders-get', error)
      return dbNotReady()
    }

    return NextResponse.json({
      orders: (data ?? []).map((o) => {
        const u = Array.isArray(o.unreal_bs_users) ? o.unreal_bs_users[0] : o.unreal_bs_users
        return {
          id: o.id,
          productId: o.product_id,
          productTitle: o.product_title,
          productKind: o.product_kind,
          sellerName: u?.business_name ?? null,
          sellerEmail: u?.email ?? null,
          buyerName: o.buyer_name,
          buyerPhone: o.buyer_phone,
          buyerEmail: o.buyer_email,
          priceBdt: Number(o.price_bdt),
          commissionBdt: Number(o.commission_bdt),
          sellerPayoutBdt: Number(o.seller_payout_bdt),
          status: o.status,
          paymentMethod: o.payment_method,
          payerReference: o.payer_reference,
          payerMsisdn: o.payer_msisdn,
          ghlSynced: Boolean(o.ghl_contact_id),
          adminNote: o.admin_note,
          paidAt: o.paid_at,
          refundedAt: o.refunded_at,
          createdAt: o.created_at,
        }
      }),
    })
  } catch (err) {
    await logError('admin-orders-get', err)
    return dbNotReady()
  }
}

export async function PATCH(request: Request) {
  const resolved = await requireAdmin()
  if ('error' in resolved) return resolved.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ message: 'Invalid values.' }, { status: 400 })
  }

  const { orderId, action, note } = parsed.data

  try {
    const supabase = getSupabaseAdmin()

    if (action === 'confirm') {
      // One RPC does the whole thing: the status guard lives inside its UPDATE
      // predicate, so pressing Confirm twice credits the seller exactly once —
      // the second call finds no matching row and raises.
      const { error } = await supabase.rpc('unreal_bs_order_mark_paid', {
        p_order_id: orderId,
        p_method: null,
        p_reference: null,
        p_note: note ?? null,
      })

      if (error) {
        if (/ORDER_NOT_PAYABLE/i.test(error.message ?? '')) {
          return NextResponse.json(
            { message: 'This order has already been confirmed or closed.' },
            { status: 409 }
          )
        }
        await logError('admin-order-confirm', error, { orderId })
        return NextResponse.json({ message: 'Could not confirm this order.' }, { status: 502 })
      }

      // After the money, never before, and never in a way that can undo it.
      // A GHL outage leaves ghl_contact_id null and the row shows as unsynced.
      await syncOrderToGhl(orderId)

      return NextResponse.json({ ok: true })
    }

    if (action === 'refund') {
      const { error } = await supabase.rpc('unreal_bs_order_refund', {
        p_order_id: orderId,
        p_note: note ?? null,
      })

      if (error) {
        if (/ORDER_NOT_REFUNDABLE/i.test(error.message ?? '')) {
          return NextResponse.json(
            { message: 'Only a paid order can be refunded.' },
            { status: 409 }
          )
        }
        if (/INSUFFICIENT_BALANCE/i.test(error.message ?? '')) {
          // The refund and the status change are one transaction, so nothing
          // has changed — the order is still paid. Saying so plainly matters:
          // the operator has to settle this by hand.
          return NextResponse.json(
            {
              message:
                'The seller has already withdrawn this money, so it could not be clawed back. Nothing was changed — settle this manually.',
              code: 'SELLER_BALANCE_TOO_LOW',
            },
            { status: 409 }
          )
        }
        await logError('admin-order-refund', error, { orderId })
        return NextResponse.json({ message: 'Could not refund this order.' }, { status: 502 })
      }

      return NextResponse.json({ ok: true })
    }

    // Reject: the buyer's TrxID did not match anything. No money has moved at
    // this point, so this is a plain status change.
    const { data, error } = await supabase
      .from('unreal_bs_orders')
      .update({
        status: 'rejected',
        admin_note: note ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .in('status', ['pending_payment', 'awaiting_confirmation'])
      .select('id')
      .maybeSingle()

    if (error) {
      await logError('admin-order-reject', error, { orderId })
      return NextResponse.json({ message: 'Could not reject this order.' }, { status: 502 })
    }

    if (!data) {
      return NextResponse.json(
        { message: 'This order has already been confirmed — refund it instead of rejecting it.' },
        { status: 409 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    await logError('admin-orders-patch', err, { orderId })
    return NextResponse.json({ message: 'Could not update this order.' }, { status: 502 })
  }
}
