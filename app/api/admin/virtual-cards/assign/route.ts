import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { encryptCardCredential } from '@/lib/crypto/card-credentials'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0004_shared_wallet_and_virtual_cards.sql.'

const postSchema = z.object({
  orderId: z.string().uuid(),
  label: z.string().trim().min(1).max(200),
  cardBrand: z.string().trim().max(50).optional(),
  last4: z.string().trim().regex(/^\d{4}$/, 'Must be exactly 4 digits'),
  expiryMonth: z.number().int().min(1).max(12).optional(),
  expiryYear: z.number().int().min(2024).max(2099).optional(),
  // Full plaintext credential the admin is entering once — never logged,
  // encrypted before it touches the database. Expected shape: whatever the
  // admin needs the customer to see (number / expiry / CVV), as free text.
  credential: z.string().trim().min(1).max(2000),
  chargedAmountBdt: z.number().positive().max(1_000_000),
})

async function requireAdmin() {
  const session = await auth()
  const email = session?.user?.email
  const adminEmail = process.env.ADMIN_EMAIL
  if (!email || !adminEmail || email !== adminEmail) {
    return { error: NextResponse.json({ message: 'Not found.' }, { status: 404 }) }
  }
  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
  return { email }
}

// Admin-only card assignment: encrypts the pasted credential immediately,
// creates/updates the card row, debits the customer's shared wallet for the
// charged amount, and marks the order fulfilled. Plaintext credential is
// never logged and never stored — only its encrypted form persists, and
// only until the customer's one-time reveal clears it.
export async function POST(request: Request) {
  const resolved = await requireAdmin()
  if (resolved.error) return resolved.error

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { message: 'Invalid request payload.', errors: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { orderId, label, cardBrand, last4, expiryMonth, expiryYear, credential, chargedAmountBdt } =
    parsed.data

  try {
    const supabase = getSupabaseAdmin()

    const { data: order, error: orderError } = await supabase
      .from('unreal_bs_virtual_card_orders')
      .select('id, user_id, status')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    if (!order) return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
    if (order.status !== 'pending') {
      return NextResponse.json({ message: 'This order is not pending.' }, { status: 409 })
    }

    // Debit first — if the customer's balance can't cover it, stop before
    // any card is created/encrypted, so the admin can top them up and retry.
    const { error: debitError } = await supabase.rpc('unreal_bs_debit_wallet_generic', {
      p_user_id: order.user_id,
      p_amount_bdt: chargedAmountBdt,
      p_kind: 'card_purchase',
      p_reference_type: 'virtual_card_order',
      p_reference_id: orderId,
      p_note: label,
    })

    if (debitError) {
      return NextResponse.json(
        { message: 'Debit failed — likely insufficient balance. Top up the customer first.' },
        { status: 402 }
      )
    }

    const encrypted = encryptCardCredential(credential)

    const { data: card, error: cardError } = await supabase
      .from('unreal_bs_virtual_cards')
      .insert({
        label,
        card_brand: cardBrand || null,
        last4,
        expiry_month: expiryMonth ?? null,
        expiry_year: expiryYear ?? null,
        status: 'assigned',
        assigned_user_id: order.user_id,
        assigned_order_id: orderId,
        credential_secret_encrypted: encrypted,
      })
      .select('id')
      .single()

    if (cardError) {
      await logError('admin-virtual-cards-assign-card-insert', cardError, { orderId })
      return NextResponse.json(
        { message: 'Wallet was debited but card creation failed — check logs and resolve manually.' },
        { status: 500 }
      )
    }

    const { error: fulfillError } = await supabase
      .from('unreal_bs_virtual_card_orders')
      .update({
        status: 'fulfilled',
        card_id: card.id,
        charged_amount_bdt: chargedAmountBdt,
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (fulfillError) {
      await logError('admin-virtual-cards-assign-order-update', fulfillError, { orderId })
      return NextResponse.json(
        { message: 'Card was created but the order status update failed — check logs and resolve manually.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ cardId: card.id })
  } catch (err) {
    await logError('admin-virtual-cards-assign-route-post', err, { orderId })
    return NextResponse.json({ message: 'Unexpected error.' }, { status: 500 })
  }
}
