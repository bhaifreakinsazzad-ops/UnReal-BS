import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/client'
import { logError } from '@/lib/log-error'
import { dbNotReady, requireSellerId } from '@/lib/commerce/guards'
import { marketplaceSellersEnabled } from '@/lib/commerce/flags'

export const dynamic = 'force-dynamic'

// Everything a seller needs to know about money coming in: their orders, and
// what has actually been earned versus what is still waiting on a payment
// being confirmed.

export async function GET() {
  if (!marketplaceSellersEnabled()) {
    return NextResponse.json({ message: 'Marketplace seller earnings are disabled for this launch.' }, { status: 403 })
  }
  const resolved = await requireSellerId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  try {
    const supabase = getSupabaseAdmin()

    const [{ data: orders, error }, { data: wallet }, { data: payouts }] = await Promise.all([
      supabase
        .from('unreal_bs_orders')
        .select('id, product_id, product_title, product_kind, buyer_name, buyer_phone, buyer_email, price_bdt, commission_bdt, seller_payout_bdt, status, payment_method, payer_reference, ghl_contact_id, paid_at, created_at')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase.from('unreal_bs_wallets').select('balance_bdt').eq('user_id', userId).maybeSingle(),
      supabase
        .from('unreal_bs_payout_requests')
        .select('id, amount_bdt, method, account_number, status, admin_note, operator_reference, paid_at, created_at')
        .eq('seller_id', userId)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    if (error) {
      await logError('sales-get', error, { userId })
      return dbNotReady()
    }

    const rows = orders ?? []
    const paid = rows.filter((o) => o.status === 'paid')

    return NextResponse.json({
      // The wallet is the single source of truth for what a seller can
      // withdraw — it already nets off refunds, payout requests and any AI
      // spend, so it is read rather than recomputed from orders.
      balanceBdt: wallet?.balance_bdt != null ? Number(wallet.balance_bdt) : 0,
      summary: {
        paidOrders: paid.length,
        awaitingConfirmation: rows.filter((o) => o.status === 'awaiting_confirmation').length,
        lifetimeEarnedBdt: paid.reduce((sum, o) => sum + Number(o.seller_payout_bdt), 0),
        lifetimeCommissionBdt: paid.reduce((sum, o) => sum + Number(o.commission_bdt), 0),
      },
      orders: rows.map((o) => ({
        id: o.id,
        productId: o.product_id,
        productTitle: o.product_title,
        productKind: o.product_kind,
        buyerName: o.buyer_name,
        buyerPhone: o.buyer_phone,
        buyerEmail: o.buyer_email,
        priceBdt: Number(o.price_bdt),
        commissionBdt: Number(o.commission_bdt),
        sellerPayoutBdt: Number(o.seller_payout_bdt),
        status: o.status,
        paymentMethod: o.payment_method,
        payerReference: o.payer_reference,
        ghlSynced: Boolean(o.ghl_contact_id),
        paidAt: o.paid_at,
        createdAt: o.created_at,
      })),
      payouts: (payouts ?? []).map((p) => ({
        id: p.id,
        amountBdt: Number(p.amount_bdt),
        method: p.method,
        accountNumber: p.account_number,
        status: p.status,
        adminNote: p.admin_note,
        operatorReference: p.operator_reference,
        paidAt: p.paid_at,
        createdAt: p.created_at,
      })),
    })
  } catch (err) {
    await logError('sales-get', err)
    return dbNotReady()
  }
}
