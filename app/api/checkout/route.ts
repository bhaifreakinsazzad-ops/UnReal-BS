import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { checkRateLimit } from '@/lib/rate-limit'
import { logError } from '@/lib/log-error'
import { splitPrice } from '@/lib/commerce/pricing'
import { syncOrderToGhl } from '@/lib/commerce/ghl-sync'
import { isGatewayConfigured, manualPaymentTargets } from '@/lib/commerce/payment-provider'

export const dynamic = 'force-dynamic'

// PUBLIC. No session, no account. A buyer arrives from a Facebook or WhatsApp
// link, gives a name and a phone number, and gets an order.
//
// Phone rather than email is the required identity because in Bangladesh
// everyone has a mobile number and a large share of buyers have no email they
// check. The access link is unguessable, so it can be sent over SMS.

const checkoutSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  buyerName: z.string().trim().min(1).max(120),
  // Deliberately permissive: 01712345678, +8801712345678 and 01712-345678 are
  // all the same number to a human, and rejecting a real customer over a dash
  // costs a sale.
  buyerPhone: z.string().trim().min(6).max(30),
  buyerEmail: z.string().trim().email().max(200).optional().or(z.literal('')),
})

function clientIp(request: Request): string {
  // x-forwarded-for is spoofable, so this alone is not a defence. The
  // per-product limit below is the one that actually holds.
  const fwd = request.headers.get('x-forwarded-for')
  return fwd?.split(',')[0]?.trim() || 'unknown'
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ message: 'Checkout is not available right now.' }, { status: 502 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Please enter your name and mobile number.', errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { slug, buyerName, buyerPhone } = parsed.data
  const buyerEmail = parsed.data.buyerEmail || null

  const ip = clientIp(request)
  const byIp = await checkRateLimit('checkout-ip', ip, { max: 20, windowSeconds: 3600 })
  if (!byIp.allowed) {
    return NextResponse.json({ message: 'Too many attempts. Please try again later.' }, { status: 429 })
  }

  try {
    const supabase = getSupabaseAdmin()

    const { data: product } = await supabase
      .from('unreal_bs_digital_products')
      .select('id, seller_id, kind, title, price_bdt, status')
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (!product) {
      return NextResponse.json({ message: 'This product is no longer available.' }, { status: 404 })
    }

    // The real backstop: x-forwarded-for can be forged, a product id cannot.
    // A flood against one product is capped regardless of where it comes from.
    const byProduct = await checkRateLimit('checkout-product', product.id, {
      max: 200,
      windowSeconds: 3600,
    })
    if (!byProduct.allowed) {
      return NextResponse.json(
        { message: 'This product is receiving too many orders right now. Please try again shortly.' },
        { status: 429 }
      )
    }

    // Price and split are recomputed here from the product row. Nothing about
    // the money comes from the client, and the DB CHECK constraint asserts the
    // same equation on the way in.
    const split = splitPrice(Number(product.price_bdt))
    const isFree = split.priceBdt === 0

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
        price_bdt: split.priceBdt,
        commission_bdt: split.commissionBdt,
        seller_payout_bdt: split.sellerPayoutBdt,
        status: 'pending_payment',
      })
      .select('id, access_token, price_bdt, status')
      .single()

    if (error || !order) {
      await logError('checkout-create', error, { slug })
      return NextResponse.json({ message: 'Could not start your order.' }, { status: 502 })
    }

    // A free product has nothing to confirm, so it is marked paid immediately
    // through the same RPC a paid order uses. The buyer gets access at once
    // and the seller still gets the contact.
    if (isFree) {
      const { error: paidError } = await supabase.rpc('unreal_bs_order_mark_paid', {
        p_order_id: order.id,
        p_method: 'free',
        p_reference: null,
        p_note: null,
      })
      if (paidError) {
        await logError('checkout-free-mark-paid', paidError, { orderId: order.id })
      } else {
        await syncOrderToGhl(order.id)
      }
    }

    return NextResponse.json(
      {
        order: {
          accessToken: order.access_token,
          priceBdt: split.priceBdt,
          status: isFree ? 'paid' : 'pending_payment',
        },
        // The checkout page tells the buyer the truth about how they are
        // paying rather than implying a card form exists.
        payment: {
          manual: !isGatewayConfigured(),
          targets: isFree ? [] : manualPaymentTargets(),
        },
      },
      { status: 201 }
    )
  } catch (err) {
    await logError('checkout-create', err, { slug })
    return NextResponse.json({ message: 'Could not start your order.' }, { status: 502 })
  }
}
