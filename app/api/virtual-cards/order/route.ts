import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { getSupabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/client'
import { resolveUserIdByEmail } from '@/lib/supabase/user'
import { addContactTags, upsertContact } from '@/lib/ghl/contacts'
import { logError } from '@/lib/log-error'

export const dynamic = 'force-dynamic'

const DB_NOT_READY_MESSAGE =
  'Database not yet configured. Run the migration in supabase/migrations/0004_shared_wallet_and_virtual_cards.sql.'

const LOCATION_ID = process.env.GHL_LOCATION_ID

const postSchema = z.object({
  marketedPriceUsd: z.number().positive().max(100_000).optional(),
  note: z.string().trim().max(2000).optional().or(z.literal('')),
})

async function requireUserId() {
  const session = await auth()
  const email = session?.user?.email
  if (!email) return { error: NextResponse.json({ message: 'Authentication required.' }, { status: 401 }) }

  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }

  try {
    const userId = await resolveUserIdByEmail(email)
    if (!userId) {
      return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
    }
    return { userId, email }
  } catch {
    return { error: NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 }) }
  }
}

export async function GET() {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId } = resolved

  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('unreal_bs_virtual_card_orders')
      .select('id, requested_note, marketed_price_usd, charged_amount_bdt, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
    return NextResponse.json({ order: data ?? null })
  } catch (err) {
    await logError('virtual-cards-order-route-get', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}

export async function POST(request: Request) {
  const resolved = await requireUserId()
  if (resolved.error) return resolved.error
  const { userId, email } = resolved

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

  try {
    const supabase = getSupabaseAdmin()

    const { data: latest, error: latestError } = await supabase
      .from('unreal_bs_virtual_card_orders')
      .select('id, status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    if (latest?.status === 'pending') {
      return NextResponse.json({ message: 'You already have a pending card order.' }, { status: 409 })
    }

    const { data, error } = await supabase
      .from('unreal_bs_virtual_card_orders')
      .insert({
        user_id: userId,
        requested_note: parsed.data.note || null,
        marketed_price_usd: parsed.data.marketedPriceUsd ?? null,
        status: 'pending',
      })
      .select()
      .single()

    // 23505 = unique_violation from the partial unique index added in
    // migration 0007 (one pending order per user). Closes the double-tap race
    // the read-then-insert check above cannot.
    if (error?.code === '23505') {
      return NextResponse.json({ message: 'You already have a pending card order.' }, { status: 409 })
    }
    if (error) return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })

    if (LOCATION_ID) {
      try {
        const { data: userRow } = await supabase
          .from('unreal_bs_users')
          .select('business_name, email')
          .eq('id', userId)
          .maybeSingle()

        const response = await upsertContact(LOCATION_ID, {
          companyName: userRow?.business_name || undefined,
          email: userRow?.email || email,
          source: 'UnReal Systems Virtual Cards — Order Request',
        })
        const contactId = response.contact?.id
        if (contactId) {
          await addContactTags(contactId, LOCATION_ID, ['CARD-ORDER-REQUEST'])
        }
      } catch (ghlErr) {
        await logError('virtual-cards-order-ghl-notify', ghlErr, { userId })
      }
    }

    return NextResponse.json({ order: data })
  } catch (err) {
    await logError('virtual-cards-order-route-post', err, { userId })
    return NextResponse.json({ message: DB_NOT_READY_MESSAGE }, { status: 502 })
  }
}
